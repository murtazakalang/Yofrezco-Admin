<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\View\Factory;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Routing\Redirector;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;
use App\Models\PaymentRequest;
use App\Traits\Processor;

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

    /**
     * Display the payment page
     */
    public function index(Request $request): View|Factory|JsonResponse|Application
    {
        $validator = Validator::make($request->all(), [
            'payment_id' => 'required|uuid'
        ]);

        if ($validator->fails()) {
            return response()->json($this->response_formatter(GATEWAYS_DEFAULT_400, null, $this->error_processor($validator)), 400);
        }

        $data = $this->payment::where(['id' => $request['payment_id']])->where(['is_paid' => 0])->first();
        if (!isset($data)) {
            return response()->json($this->response_formatter(GATEWAYS_DEFAULT_204), 200);
        }
        $config = $this->config_values;

        return view('payment-views.cybersource', compact('data', 'config'));
    }

    /**
     * Process the payment with CyberSource
     */
    public function processPayment(Request $request): JsonResponse|RedirectResponse
    {
        $data = $this->payment::where(['id' => $request['payment_id']])->where(['is_paid' => 0])->first();
        if (!isset($data)) {
            return response()->json($this->response_formatter(GATEWAYS_DEFAULT_204), 200);
        }

        $payment_amount = $data['payment_amount'];
        $currency_code = $data->currency_code;

        // Get business info for the order
        if (count(json_decode($data['additional_data'], true)) > 0) {
            $business = json_decode($data['additional_data']);
            $business_name = $business->business_name ?? "my_business";
        } else {
            $name = \App\Models\BusinessSetting::where('key', 'business_name')->first();
            $business_name = $name->value ?? "my_business";
        }

        try {
            // CyberSource API endpoint
            $host = $this->config_values->mode == 'live'
                ? 'api.cybersource.com'
                : 'apitest.cybersource.com';

            $merchant_id = $this->config_values->merchant_id;
            $api_key_id = $this->config_values->api_key_id;
            $secret_key = $this->config_values->secret_key;

            // Create payment request payload
            $payload = [
                'clientReferenceInformation' => [
                    'code' => $data->id
                ],
                'processingInformation' => [
                    'capture' => true
                ],
                'paymentInformation' => [
                    'card' => [
                        'number' => $request->card_number,
                        'expirationMonth' => $request->expiry_month,
                        'expirationYear' => $request->expiry_year,
                        'securityCode' => $request->cvv
                    ]
                ],
                'orderInformation' => [
                    'amountDetails' => [
                        'totalAmount' => number_format($payment_amount, 2, '.', ''),
                        'currency' => strtoupper($currency_code)
                    ],
                    'billTo' => [
                        'firstName' => $request->first_name ?? 'Customer',
                        'lastName' => $request->last_name ?? 'User',
                        'email' => $request->email ?? 'customer@example.com',
                        'country' => $request->country ?? 'US'
                    ]
                ]
            ];

            // Generate signature for CyberSource API
            $resource = '/pts/v2/payments';
            $date = gmdate("D, d M Y H:i:s") . " GMT";
            $digest = $this->generateDigest(json_encode($payload));
            $signature = $this->generateSignature($host, $date, $digest, $merchant_id, $api_key_id, $secret_key, $resource);

            // Make API request
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'v-c-merchant-id' => $merchant_id,
                'Date' => $date,
                'Host' => $host,
                'Digest' => "SHA-256={$digest}",
                'Signature' => $signature
            ])->post("https://{$host}{$resource}", $payload);

            $responseData = $response->json();

            if ($response->successful() && isset($responseData['status']) && $responseData['status'] === 'AUTHORIZED') {
                // Payment successful
                $this->payment::where(['id' => $request['payment_id']])->update([
                    'payment_method' => 'cybersource',
                    'is_paid' => 1,
                    'transaction_id' => $responseData['id'] ?? null,
                ]);

                $paymentData = $this->payment::where(['id' => $request['payment_id']])->first();

                if (isset($paymentData) && function_exists($paymentData->success_hook)) {
                    call_user_func($paymentData->success_hook, $paymentData);
                }

                return $this->payment_response($paymentData, 'success');
            } else {
                // Payment failed
                $paymentData = $this->payment::where(['id' => $request['payment_id']])->first();
                if (isset($paymentData) && function_exists($paymentData->failure_hook)) {
                    call_user_func($paymentData->failure_hook, $paymentData);
                }
                return $this->payment_response($paymentData, 'fail');
            }
        } catch (\Exception $e) {
            $paymentData = $this->payment::where(['id' => $request['payment_id']])->first();
            if (isset($paymentData) && function_exists($paymentData->failure_hook)) {
                call_user_func($paymentData->failure_hook, $paymentData);
            }
            return $this->payment_response($paymentData, 'fail');
        }
    }

    /**
     * Handle successful payment
     */
    public function success(Request $request)
    {
        $paymentData = $this->payment::where(['id' => $request['payment_id']])->first();
        if (isset($paymentData) && $paymentData->is_paid) {
            return $this->payment_response($paymentData, 'success');
        }
        return $this->payment_response($paymentData, 'fail');
    }

    /**
     * Handle canceled payment
     */
    public function canceled(Request $request): JsonResponse|Redirector|RedirectResponse|Application
    {
        $paymentData = $this->payment::where(['id' => $request['payment_id']])->first();
        if (isset($paymentData) && function_exists($paymentData->failure_hook)) {
            call_user_func($paymentData->failure_hook, $paymentData);
        }
        return $this->payment_response($paymentData, 'cancel');
    }

    /**
     * Generate SHA-256 digest for CyberSource
     */
    private function generateDigest(string $payload): string
    {
        return base64_encode(hash('sha256', $payload, true));
    }

    /**
     * Generate HTTP Signature for CyberSource API authentication
     */
    private function generateSignature(
        string $host,
        string $date,
        string $digest,
        string $merchantId,
        string $apiKeyId,
        string $secretKey,
        string $resource
    ): string {
        $signatureString = "host: {$host}\ndate: {$date}\n(request-target): post {$resource}\ndigest: SHA-256={$digest}\nv-c-merchant-id: {$merchantId}";

        $signatureHash = base64_encode(
            hash_hmac('sha256', $signatureString, base64_decode($secretKey), true)
        );

        return 'keyid="' . $apiKeyId . '", algorithm="HmacSHA256", headers="host date (request-target) digest v-c-merchant-id", signature="' . $signatureHash . '"';
    }
}
