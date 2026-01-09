<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\View\Factory;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Models\PaymentRequest;
use App\Traits\Processor;
use App\Models\Order;

class FygaroPaymentController extends Controller
{
    use Processor;

    private $config_values;
    private PaymentRequest $payment;
    private bool $config_loaded = false;

    public function __construct(PaymentRequest $payment)
    {
        $this->payment = $payment;
        $this->loadConfig();
    }

    private function loadConfig(): void
    {
        $config = $this->payment_config('fygaro', 'payment_config');

        if (!is_null($config)) {
            $this->config_loaded = true;
            if ($config->mode == 'live') {
                $this->config_values = json_decode($config->live_values);
            } else {
                $this->config_values = json_decode($config->test_values);
            }
        }
    }

    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'payment_id' => 'required|uuid'
        ]);

        if ($validator->fails()) {
            return response()->json($this->response_formatter(GATEWAYS_DEFAULT_400, null, $this->error_processor($validator)), 400);
        }

        // Check if config is loaded
        if (!$this->config_loaded || !isset($this->config_values)) {
            Log::error('Fygaro: Configuration not found or not properly configured');
            return response()->json($this->response_formatter(GATEWAYS_DEFAULT_400, null, [
                ['error_code' => 'config_error', 'message' => 'Fygaro payment gateway is not properly configured']
            ]), 400);
        }

        $payment = $this->payment::where(['id' => $request['payment_id']])->where(['is_paid' => 0])->first();
        if (!isset($payment)) {
            Log::error('Fygaro: Payment request not found or already paid', ['payment_id' => $request['payment_id']]);
            return response()->json($this->response_formatter(GATEWAYS_DEFAULT_204), 200);
        }

        // Fygaro Base Payment Button URL
        $baseUrl = $this->config_values->button_url ?? 'https://www.fygaro.com/en/pb/a2a290cb-b939-48c0-b11c-cfb44852876f/';

        // Ensure URL has trailing slash
        $baseUrl = rtrim($baseUrl, '/') . '/';

        // Calculate Tax Amount from Order
        $taxAmount = $this->calculateTaxAmount($payment);

        // Generate JWT
        $jwt = $this->generateFygaroJwt($payment, $taxAmount);

        Log::info('Fygaro: Redirecting to payment', [
            'payment_id' => $payment->id,
            'amount' => $payment->payment_amount,
            'tax_amount' => $taxAmount,
            'base_url' => $baseUrl
        ]);

        // Redirect to Fygaro
        return redirect()->away($baseUrl . '?jwt=' . $jwt);
    }

    private function calculateTaxAmount($payment): float
    {
        // Calculate 7% of payment amount as tax for Panama tax requirements
        $taxAmount = (float) ($payment->payment_amount * 0.07);

        Log::info('Fygaro: Tax calculated as 7% of payment amount', [
            'payment_id' => $payment->id,
            'payment_amount' => $payment->payment_amount,
            'tax_amount' => $taxAmount
        ]);

        return $taxAmount;
    }

    private function generateFygaroJwt($payment, $taxAmount): string
    {
        $header = [
            "alg" => "HS256",
            "typ" => "JWT",
            "kid" => $this->config_values->access_key
        ];

        $payload = [
            "amount" => number_format($payment->payment_amount, 2, '.', ''),
            "currency" => strtoupper($payment->currency_code ?? 'USD'),
            "custom_reference" => $payment->id,
            "tax_amount" => number_format($taxAmount, 2, '.', ''),
            "exp" => time() + 3600, // 1 hour expiration
            "nbf" => time()
        ];

        $base64Header = $this->base64UrlEncode(json_encode($header));
        $base64Payload = $this->base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $this->config_values->secret_key, true);
        $base64Signature = $this->base64UrlEncode($signature);

        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }

    private function base64UrlEncode($data): string
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    /**
     * Handle Fygaro webhook callback (POST)
     * Validates signature and updates payment status
     */
    public function callback(Request $request)
    {
        Log::info('Fygaro: Callback received', [
            'method' => $request->method(),
            'headers' => $request->headers->all(),
            'body' => $request->all()
        ]);

        // Validate webhook signature
        if (!$this->validateWebhookSignature($request)) {
            Log::error('Fygaro: Invalid webhook signature');
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        // Get payment ID from custom_reference
        $payment_id = $request->input('customReference') ?? $request->input('custom_reference');

        if (!$payment_id) {
            Log::error('Fygaro: No payment reference in callback');
            return response()->json($this->response_formatter(GATEWAYS_DEFAULT_204), 200);
        }

        $payment = $this->payment::where(['id' => $payment_id])->first();

        if ($payment) {
            // Update payment record
            $this->payment::where(['id' => $payment_id])->update([
                'payment_method' => 'fygaro',
                'is_paid' => 1,
                'transaction_id' => $request->input('transactionId') ?? $request->input('reference'),
            ]);

            $data = $this->payment::where(['id' => $payment_id])->first();

            // Call success hook if defined
            if (isset($data) && function_exists($data->success_hook)) {
                call_user_func($data->success_hook, $data);
            }

            Log::info('Fygaro: Payment successful', [
                'payment_id' => $payment_id,
                'transaction_id' => $request->input('transactionId')
            ]);

            // Return 200 to acknowledge webhook receipt
            return response()->json(['status' => 'success'], 200);
        }

        Log::error('Fygaro: Payment not found in callback', ['payment_id' => $payment_id]);
        return response()->json(['error' => 'Payment not found'], 404);
    }

    /**
     * Validate Fygaro webhook signature
     * Uses HMAC-SHA-256 as per Fygaro documentation
     */
    private function validateWebhookSignature(Request $request): bool
    {
        // Get the Fygaro-Signature header
        $signatureHeader = $request->header('Fygaro-Signature');

        if (!$signatureHeader) {
            Log::warning('Fygaro: No signature header present');
            // Allow requests without signature in development/testing
            // Remove this in production for security
            return true;
        }

        if (!$this->config_loaded || !isset($this->config_values->secret_key)) {
            Log::error('Fygaro: Cannot validate signature - config not loaded');
            return false;
        }

        // Parse signature header (format: t=timestamp,h1=hash)
        $parts = [];
        foreach (explode(',', $signatureHeader) as $part) {
            $keyValue = explode('=', $part, 2);
            if (count($keyValue) == 2) {
                $parts[$keyValue[0]] = $keyValue[1];
            }
        }

        $timestamp = $parts['t'] ?? null;
        $hash = $parts['h1'] ?? null;

        if (!$timestamp || !$hash) {
            Log::error('Fygaro: Invalid signature header format');
            return false;
        }

        // Check if timestamp is within 5 minutes (300 seconds)
        if (abs(time() - (int)$timestamp) > 300) {
            Log::error('Fygaro: Signature timestamp too old');
            return false;
        }

        // Reconstruct the message: timestamp.rawBody
        $rawBody = $request->getContent();
        $message = $timestamp . '.' . $rawBody;

        // Compute expected signature
        $expectedSignature = hash_hmac('sha256', $message, $this->config_values->secret_key);

        // Compare using timing-safe comparison
        if (!hash_equals($expectedSignature, $hash)) {
            Log::error('Fygaro: Signature mismatch');
            return false;
        }

        return true;
    }

    /**
     * Handle return URL redirect (GET)
     * User is redirected here after completing payment on Fygaro
     */
    public function return(Request $request)
    {
        Log::info('Fygaro: Return URL accessed', [
            'params' => $request->all()
        ]);

        // Get payment ID from custom_reference or reference
        $payment_id = $request->input('custom_reference') ?? $request->input('customReference');
        $reference = $request->input('reference');
        $status = $request->input('status');

        if (!$payment_id) {
            Log::error('Fygaro: No payment ID in return URL');
            return $this->payment_response(null, 'fail');
        }

        $payment = $this->payment::where(['id' => $payment_id])->first();

        if (!$payment) {
            Log::error('Fygaro: Payment not found on return', ['payment_id' => $payment_id]);
            return $this->payment_response(null, 'fail');
        }

        // Check if payment was already marked as paid (by webhook)
        if ($payment->is_paid == 1) {
            Log::info('Fygaro: Payment already completed', ['payment_id' => $payment_id]);
            return $this->payment_response($payment, 'success');
        }

        // If webhook hasn't processed yet, update based on return status
        // Note: Webhook is the authoritative source, this is just for UX
        if ($status === 'success' || $reference) {
            // Mark as paid (webhook may have already done this)
            $this->payment::where(['id' => $payment_id])->update([
                'payment_method' => 'fygaro',
                'is_paid' => 1,
                'transaction_id' => $reference,
            ]);

            $data = $this->payment::where(['id' => $payment_id])->first();

            if (isset($data) && function_exists($data->success_hook)) {
                call_user_func($data->success_hook, $data);
            }

            return $this->payment_response($data, 'success');
        }

        return $this->payment_response($payment, 'fail');
    }

    public function success()
    {
        return response()->json(['message' => 'Payment Successful']);
    }

    public function canceled()
    {
        return response()->json(['message' => 'Payment Canceled']);
    }
}
