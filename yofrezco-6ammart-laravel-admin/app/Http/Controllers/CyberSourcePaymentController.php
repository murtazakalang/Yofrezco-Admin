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
use App\Models\PaymentRequest;
use App\Traits\Processor;
use App\Models\Order;

class CyberSourcePaymentController extends Controller
{
    use Processor;

    private $config_values;
    private PaymentRequest $payment;

    public function __construct(PaymentRequest $payment)
    {
        $config = $this->payment_config('cybersource', 'payment_config');
        if (!is_null($config) && $config->mode == 'live') {
            $this->config_values = json_decode($config->live_values);
        } elseif (!is_null($config) && $config->mode == 'test') {
            $this->config_values = json_decode($config->test_values);
        }
        $this->payment = $payment;
    }

    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'payment_id' => 'required|uuid'
        ]);

        if ($validator->fails()) {
            return response()->json($this->response_formatter(GATEWAYS_DEFAULT_400, null, $this->error_processor($validator)), 400);
        }

        $payment = $this->payment::where(['id' => $request['payment_id']])->where(['is_paid' => 0])->first();
        if (!isset($payment)) {
            return response()->json($this->response_formatter(GATEWAYS_DEFAULT_204), 200);
        }

        // Fygaro Base Payment Button URL (Provided by user)
        $baseUrl = 'https://www.fygaro.com/en/pb/a2a290cb-b939-48c0-b11c-cfb44852876f/';
        
        // Use button_url from config if exists, otherwise use the hardcoded one
        if (isset($this->config_values->button_url) && !empty($this->config_values->button_url)) {
            $baseUrl = $this->config_values->button_url;
        }

        // Calculate Tax Amount
        $taxAmount = 0.00;
        // Attempt to fetch tax from Order if linked
        if ($payment->attribute_id) {
            $order = Order::find($payment->attribute_id);
            if ($order) {
                // Ensure we use the correct tax field
                $taxAmount = $order->total_tax_amount ?? 0.00;
            }
        }
        
        // Generate JWT
        $jwt = $this->generateFygaroJwt($payment, $taxAmount);

        // Redirect to Fygaro
        return redirect()->away($baseUrl . '?jwt=' . $jwt);
    }

    private function generateFygaroJwt($payment, $taxAmount)
    {
        $header = [
            "alg" => "HS256",
            "typ" => "JWT",
            "kid" => $this->config_values->access_key // Public Key
        ];

        $payload = [
            "amount" => number_format($payment->payment_amount, 2, '.', ''),
            "currency" => "USD",
            "custom_reference" => $payment->id,
            "tax_amount" => number_format($taxAmount, 2, '.', ''), // Tax requirement
            "exp" => time() + 3600, // 1 hour expiration
            "nbf" => time()
        ];

        $base64Header = $this->base64UrlEncode(json_encode($header));
        $base64Payload = $this->base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $this->config_values->secret_key, true);
        $base64Signature = $this->base64UrlEncode($signature);

        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }

    private function base64UrlEncode($data)
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    public function callback(Request $request)
    {
        // Handle callback if Fygaro redirects back with parameters
        // Fygaro returns: ?reference=FYGARO_ID&custom_reference=OUR_PAYMENT_ID
        
        $payment_id = $request->input('custom_reference');
        
        if (!$payment_id) {
             return response()->json($this->response_formatter(GATEWAYS_DEFAULT_204), 200); 
        }

        $payment = $this->payment::where(['id' => $payment_id])->first();

        if ($payment) {
            $this->payment::where(['id' => $payment_id])->update([
                'payment_method' => 'cybersource', // Keep name as cybersource to match DB
                'is_paid' => 1,
                'transaction_id' => $request->input('reference'),
            ]);

            $data = $this->payment::where(['id' => $payment_id])->first();

            if (isset($data) && function_exists($data->success_hook)) {
                call_user_func($data->success_hook, $data);
            }

            return $this->payment_response($data, 'success');
        }

        return $this->payment_response(null, 'fail');
    }
    
    public function success() { return response()->json(['message' => 'Payment Successful']); }
    public function canceled() { return response()->json(['message' => 'Payment Canceled']); }
}
