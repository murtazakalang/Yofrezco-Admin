<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Models\PaymentRequest;
use App\Traits\Processor;

class CyberSourcePaymentController extends Controller
{
    use Processor;

    private $config_values;
    private PaymentRequest $payment;
    private bool $config_loaded = false;
    private string $api_endpoint;

    public function __construct(PaymentRequest $payment)
    {
        $this->payment = $payment;
        $this->loadConfig();
    }

    private function loadConfig(): void
    {
        $config = $this->payment_config('cybersource', 'payment_config');

        if (!is_null($config)) {
            $this->config_loaded = true;
            if ($config->mode == 'live') {
                $this->config_values = json_decode($config->live_values);
                $this->api_endpoint = 'https://api.cybersource.com';
            } else {
                $this->config_values = json_decode($config->test_values);
                $this->api_endpoint = 'https://apitest.cybersource.com';
            }
        }
    }

    /**
     * Generate HTTP Signature headers for CyberSource REST API
     */
    private function generateHttpSignature(string $method, string $path, $body = null): array
    {
        $host = parse_url($this->api_endpoint, PHP_URL_HOST);
        $date = gmdate('D, d M Y H:i:s \G\M\T');
        $digest = null;
        $bodyJson = null;

        // Generate digest for POST requests
        if ($method === 'POST' && $body !== null) {
            $bodyJson = json_encode($body);
            $digest = 'SHA-256=' . base64_encode(hash('sha256', $bodyJson, true));
        }

        // Build signature string
        $signatureString = "host: {$host}\n";
        $signatureString .= "date: {$date}\n";
        $signatureString .= "(request-target): " . strtolower($method) . " {$path}";

        if ($digest) {
            $signatureString .= "\ndigest: {$digest}";
        }

        $signatureString .= "\nv-c-merchant-id: {$this->config_values->merchant_id}";

        // Decode shared secret from Base64
        $sharedSecretDecoded = base64_decode($this->config_values->shared_secret_key);

        // Generate HMAC signature
        $signatureBytes = hash_hmac('sha256', $signatureString, $sharedSecretDecoded, true);
        $signature = base64_encode($signatureBytes);

        // Build signature header
        $headers = $digest
            ? 'host date (request-target) digest v-c-merchant-id'
            : 'host date (request-target) v-c-merchant-id';

        $signatureHeader = 'keyid="' . $this->config_values->api_key_id . '", ' .
                          'algorithm="HmacSHA256", ' .
                          'headers="' . $headers . '", ' .
                          'signature="' . $signature . '"';

        $httpHeaders = [
            'Host' => $host,
            'Date' => $date,
            'Signature' => $signatureHeader,
            'v-c-merchant-id' => $this->config_values->merchant_id,
            'Content-Type' => 'application/json',
            'Accept' => 'application/hal+json;charset=utf-8',
        ];

        if ($digest) {
            $httpHeaders['Digest'] = $digest;
        }

        return $httpHeaders;
    }

    /**
     * Display payment form and initiate 3DS setup
     */
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'payment_id' => 'required|uuid'
        ]);

        if ($validator->fails()) {
            return response()->json($this->response_formatter(GATEWAYS_DEFAULT_400, null, $this->error_processor($validator)), 400);
        }

        if (!$this->config_loaded || !isset($this->config_values)) {
            Log::error('CyberSource: Configuration not found');
            return response()->json($this->response_formatter(GATEWAYS_DEFAULT_400, null, [
                ['error_code' => 'config_error', 'message' => 'CyberSource payment gateway is not properly configured']
            ]), 400);
        }

        $payment = $this->payment::where(['id' => $request['payment_id']])->where(['is_paid' => 0])->first();
        if (!isset($payment)) {
            Log::error('CyberSource: Payment request not found', ['payment_id' => $request['payment_id']]);
            return response()->json($this->response_formatter(GATEWAYS_DEFAULT_204), 200);
        }

        Log::info('CyberSource: Rendering payment form', [
            'payment_id' => $payment->id,
            'amount' => $payment->payment_amount,
            'currency' => $payment->currency_code
        ]);

        // Render payment form
        return view('Gateways::payment.cybersource', [
            'payment' => $payment,
            'config' => $this->config_values,
            'api_endpoint' => $this->api_endpoint,
        ]);
    }

    /**
     * Process payment with 3DS authentication
     */
    public function callback(Request $request)
    {
        Log::info('CyberSource: Callback received', [
            'method' => $request->method(),
            'data' => $request->except(['card_number', 'cvv'])
        ]);

        $payment_id = $request->input('payment_id');

        if (!$payment_id) {
            Log::error('CyberSource: Missing payment_id in callback');
            return response()->json(['error' => 'Invalid callback parameters', 'success' => false], 400);
        }

        $payment = $this->payment::where(['id' => $payment_id])->first();

        if (!$payment) {
            Log::error('CyberSource: Payment not found in callback', ['payment_id' => $payment_id]);
            return response()->json(['error' => 'Payment not found', 'success' => false], 404);
        }

        // Check if already paid
        if ($payment->is_paid == 1) {
            Log::info('CyberSource: Payment already processed', ['payment_id' => $payment_id]);
            return response()->json([
                'success' => true,
                'redirect_url' => $this->getRedirectUrl($payment, 'success')
            ]);
        }

        // Process payment authorization
        $authResult = $this->authorizePayment($payment, $request);

        if ($authResult['success']) {
            // Update payment record
            $this->payment::where(['id' => $payment_id])->update([
                'payment_method' => 'cybersource',
                'is_paid' => 1,
                'transaction_id' => $authResult['transactionId'],
            ]);

            $data = $this->payment::where(['id' => $payment_id])->first();

            if (isset($data) && function_exists($data->success_hook)) {
                call_user_func($data->success_hook, $data);
            }

            Log::info('CyberSource: Payment successful', [
                'payment_id' => $payment_id,
                'transaction_id' => $authResult['transactionId']
            ]);

            return response()->json([
                'success' => true,
                'redirect_url' => $this->getRedirectUrl($data, 'success')
            ]);
        } else {
            Log::error('CyberSource: Payment authorization failed', [
                'payment_id' => $payment_id,
                'error' => $authResult['error'] ?? 'Unknown error'
            ]);

            if (isset($payment) && function_exists($payment->failure_hook)) {
                call_user_func($payment->failure_hook, $payment);
            }

            return response()->json([
                'success' => false,
                'error' => $authResult['error'] ?? 'Payment authorization failed',
                'redirect_url' => $this->getRedirectUrl($payment, 'fail')
            ]);
        }
    }

    /**
     * Authorize payment with CyberSource
     */
    private function authorizePayment($payment, Request $request): array
    {
        $path = '/pts/v2/payments';
        $payer = json_decode($payment->payer_information ?? '{}');

        // Get card details from request
        $cardNumber = preg_replace('/\s+/', '', $request->input('card_number', ''));
        $expMonth = $request->input('exp_month', '');
        $expYear = $request->input('exp_year', '');
        $cvv = $request->input('cvv', '');
        $cardholderName = $request->input('cardholder_name', 'Customer');

        // Split cardholder name
        $nameParts = explode(' ', $cardholderName, 2);
        $firstName = $nameParts[0] ?? 'Customer';
        $lastName = $nameParts[1] ?? 'User';

        // Calculate tax (7% for Panama)
        $taxAmount = number_format($payment->payment_amount * 0.07, 2, '.', '');

        $body = [
            'clientReferenceInformation' => [
                'code' => $payment->id,
            ],
            'processingInformation' => [
                'commerceIndicator' => 'internet',
                'actionList' => ['DECISION_SKIP'], // Skip Decision Manager fraud screening
            ],
            'orderInformation' => [
                'amountDetails' => [
                    'totalAmount' => number_format($payment->payment_amount, 2, '.', ''),
                    'currency' => strtoupper($payment->currency_code ?? 'USD'),
                    'taxAmount' => $taxAmount,
                ],
                'billTo' => [
                    'firstName' => $firstName,
                    'lastName' => $lastName,
                    'address1' => $payer->address ?? 'N/A',
                    'locality' => $payer->city ?? 'Panama City',
                    'administrativeArea' => $payer->state ?? 'PA',
                    'postalCode' => $payer->zip ?? '00000',
                    'country' => $payer->country ?? 'PA',
                    'email' => $payer->email ?? 'customer@example.com',
                    'phoneNumber' => $payer->phone ?? '0000000000',
                ],
            ],
            'paymentInformation' => [
                'card' => [
                    'number' => $cardNumber,
                    'expirationMonth' => str_pad($expMonth, 2, '0', STR_PAD_LEFT),
                    'expirationYear' => $expYear,
                    'securityCode' => $cvv,
                    'type' => $this->detectCardType($cardNumber),
                ],
            ],
        ];

        $headers = $this->generateHttpSignature('POST', $path, $body);

        try {
            Log::info('CyberSource: Sending authorization request', [
                'payment_id' => $payment->id,
                'amount' => $payment->payment_amount,
                'endpoint' => $this->api_endpoint . $path
            ]);

            $response = Http::withHeaders($headers)
                ->withBody(json_encode($body), 'application/json')
                ->post($this->api_endpoint . $path);

            $responseData = $response->json();

            Log::info('CyberSource: Authorization response', [
                'payment_id' => $payment->id,
                'status_code' => $response->status(),
                'status' => $responseData['status'] ?? 'unknown'
            ]);

            if ($response->successful()) {
                $status = $responseData['status'] ?? 'FAILED';

                if (in_array($status, ['AUTHORIZED', 'AUTHORIZED_PENDING_REVIEW', 'PENDING'])) {
                    return [
                        'success' => true,
                        'transactionId' => $responseData['id'] ?? null,
                        'reconciliationId' => $responseData['reconciliationId'] ?? null,
                        'status' => $status,
                    ];
                } else {
                    $errorMessage = $responseData['errorInformation']['message'] ??
                                   $responseData['message'] ??
                                   'Authorization failed: ' . $status;
                    return [
                        'success' => false,
                        'error' => $errorMessage,
                        'status' => $status,
                    ];
                }
            } else {
                $errorMessage = $responseData['message'] ??
                               $responseData['errorInformation']['message'] ??
                               'API request failed';

                Log::error('CyberSource: Authorization API Error', [
                    'status' => $response->status(),
                    'body' => $responseData
                ]);

                return [
                    'success' => false,
                    'error' => $errorMessage,
                ];
            }
        } catch (\Exception $e) {
            Log::error('CyberSource: Authorization Exception', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage()
            ]);
            return [
                'success' => false,
                'error' => 'Payment processing error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Detect card type from card number
     */
    private function detectCardType(string $cardNumber): string
    {
        $cardNumber = preg_replace('/\s+/', '', $cardNumber);

        // Visa
        if (preg_match('/^4/', $cardNumber)) {
            return '001';
        }
        // MasterCard
        if (preg_match('/^5[1-5]/', $cardNumber) || preg_match('/^2[2-7]/', $cardNumber)) {
            return '002';
        }
        // American Express
        if (preg_match('/^3[47]/', $cardNumber)) {
            return '003';
        }
        // Discover
        if (preg_match('/^6(?:011|5)/', $cardNumber)) {
            return '004';
        }
        // Diners Club
        if (preg_match('/^3(?:0[0-5]|[68])/', $cardNumber)) {
            return '005';
        }
        // JCB
        if (preg_match('/^(?:2131|1800|35)/', $cardNumber)) {
            return '007';
        }

        // Default to Visa
        return '001';
    }

    /**
     * Get redirect URL for payment response
     */
    private function getRedirectUrl($payment, string $status): string
    {
        $token_string = 'payment_method=' . ($payment->payment_method ?? 'cybersource') .
            '&&attribute_id=' . $payment->attribute_id .
            '&&transaction_reference=' . $payment->transaction_id;

        if (in_array($payment->payment_platform, ['web', 'app']) &&
            $payment->external_redirect_link != null) {
            return $payment->external_redirect_link .
                '?flag=' . $status . '&&token=' . base64_encode($token_string);
        }

        return route('payment-' . $status, ['token' => base64_encode($token_string)]);
    }

    /**
     * Success page handler
     */
    public function success(Request $request)
    {
        Log::info('CyberSource: Success page accessed', ['params' => $request->all()]);

        $payment_id = $request->input('payment_id');

        if ($payment_id) {
            $payment = $this->payment::where(['id' => $payment_id])->first();
            if ($payment) {
                return $this->payment_response($payment, 'success');
            }
        }

        return response()->json(['message' => 'Payment Successful']);
    }

    /**
     * Canceled page handler
     */
    public function canceled(Request $request)
    {
        Log::info('CyberSource: Canceled page accessed', ['params' => $request->all()]);

        $payment_id = $request->input('payment_id');

        if ($payment_id) {
            $payment = $this->payment::where(['id' => $payment_id])->first();
            if ($payment) {
                if (function_exists($payment->failure_hook)) {
                    call_user_func($payment->failure_hook, $payment);
                }
                return $this->payment_response($payment, 'fail');
            }
        }

        return response()->json(['message' => 'Payment Canceled']);
    }
}
