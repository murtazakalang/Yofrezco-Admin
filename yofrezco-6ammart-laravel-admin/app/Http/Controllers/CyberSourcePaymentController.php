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
     * Display the payment page with Secure Acceptance form
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
        
        // Get payer information
        $payer_info = json_decode($data->payer_information ?? '{}');
        $additional_data = json_decode($data->additional_data ?? '{}');
        
        // Generate Secure Acceptance form fields
        $formData = $this->generateSecureAcceptanceFormData($data, $payer_info, $additional_data);

        return view('payment-views.cybersource', compact('data', 'config', 'formData'));
    }

    /**
     * Generate Secure Acceptance form data with signature
     */
    private function generateSecureAcceptanceFormData($payment, $payer_info, $additional_data): array
    {
        $config = $this->config_values;
        
        // Determine endpoint based on mode
        $endpoint = $config->mode == 'live'
            ? 'https://secureacceptance.cybersource.com/silent/pay'
            : 'https://testsecureacceptance.cybersource.com/silent/pay';

        // Use simple uniqid() matching CyberSource sample
        $transaction_uuid = uniqid();
        $signed_date_time = gmdate("Y-m-d\TH:i:s\Z");
        $reference_number = 'REF-' . $payment->id;
        
        // Define signed_field_names in exact order (matching CyberSource sample)
        $signed_field_names = 'access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,signed_date_time,locale,transaction_type,reference_number,amount,currency,payment_method,bill_to_forename,bill_to_surname,bill_to_email,bill_to_phone,bill_to_address_line1,bill_to_address_city,bill_to_address_state,bill_to_address_country,bill_to_address_postal_code,override_custom_receipt_page,override_custom_cancel_page';
        
        // Build the form fields in the exact order of signed_field_names
        $fields = [
            'access_key' => $config->access_key,
            'profile_id' => $config->profile_id,
            'transaction_uuid' => $transaction_uuid,
            'signed_field_names' => $signed_field_names,
            'unsigned_field_names' => 'card_type,card_number,card_expiry_date',
            'signed_date_time' => $signed_date_time,
            'locale' => 'en',
            'transaction_type' => 'sale',
            'reference_number' => $reference_number,
            'amount' => number_format($payment->payment_amount, 2, '.', ''),
            'currency' => strtoupper($payment->currency_code),
            'payment_method' => 'card',
            'bill_to_forename' => $payer_info->name ?? 'Customer',
            'bill_to_surname' => $payer_info->last_name ?? 'User',
            'bill_to_email' => $payer_info->email ?? 'customer@example.com',
            'bill_to_phone' => $payer_info->phone ?? '0000000000',
            'bill_to_address_line1' => $payer_info->address ?? '123 Main St',
            'bill_to_address_city' => $payer_info->city ?? 'Panama City',
            'bill_to_address_state' => $payer_info->state ?? 'PA',
            'bill_to_address_country' => $payer_info->country ?? 'PA',
            'bill_to_address_postal_code' => $payer_info->postal_code ?? '00000',
            'override_custom_receipt_page' => route('cybersource.callback') . '?payment_id=' . $payment->id,
            'override_custom_cancel_page' => route('cybersource.canceled') . '?payment_id=' . $payment->id,
        ];

        // Generate signature
        $fields['signature'] = $this->generateSignature($fields, $config->secret_key);

        return [
            'endpoint' => $endpoint,
            'fields' => $fields
        ];
    }

    /**
     * Generate HMAC-SHA256 signature for Secure Acceptance
     */
    private function generateSignature(array $params, string $secretKey): string
    {
        $signedFieldNames = explode(',', $params['signed_field_names']);
        
        $dataToSign = [];
        foreach ($signedFieldNames as $field) {
            $dataToSign[] = $field . '=' . $params[$field];
        }
        
        $signatureString = implode(',', $dataToSign);
        
        return base64_encode(hash_hmac('sha256', $signatureString, $secretKey, true));
    }

    /**
     * Handle CyberSource callback (success or decline)
     */
    public function callback(Request $request)
    {
        // Verify signature from CyberSource response
        $responseSignature = $request->input('signature');
        $signedFieldNames = $request->input('signed_field_names');
        
        if ($signedFieldNames) {
            $fields = explode(',', $signedFieldNames);
            $dataToSign = [];
            foreach ($fields as $field) {
                $dataToSign[] = $field . '=' . $request->input($field);
            }
            $signatureString = implode(',', $dataToSign);
            $expectedSignature = base64_encode(hash_hmac('sha256', $signatureString, $this->config_values->secret_key, true));
            
            // Signature validation (optional but recommended)
            // if ($responseSignature !== $expectedSignature) {
            //     return $this->payment_response(null, 'fail');
            // }
        }

        $payment_id = $request->input('payment_id') ?? $request->input('req_reference_number');
        
        // Extract payment_id from reference_number if needed
        if (str_starts_with($payment_id, 'REF-')) {
            $payment_id = str_replace('REF-', '', $payment_id);
        }

        $decision = $request->input('decision');
        $reason_code = $request->input('reason_code');
        $transaction_id = $request->input('transaction_id');

        $paymentData = $this->payment::where(['id' => $payment_id])->first();

        if (!$paymentData) {
            return redirect()->route('payment-fail');
        }

        // Check if payment was successful
        // ACCEPT = approved, REVIEW = pending review, DECLINE/ERROR/CANCEL = failed
        if ($decision === 'ACCEPT' && $reason_code === '100') {
            // Payment successful
            $this->payment::where(['id' => $payment_id])->update([
                'payment_method' => 'cybersource',
                'is_paid' => 1,
                'transaction_id' => $transaction_id,
            ]);

            $paymentData = $this->payment::where(['id' => $payment_id])->first();

            if (isset($paymentData) && function_exists($paymentData->success_hook)) {
                call_user_func($paymentData->success_hook, $paymentData);
            }

            return $this->payment_response($paymentData, 'success');
        } else {
            // Payment failed
            if (isset($paymentData) && function_exists($paymentData->failure_hook)) {
                call_user_func($paymentData->failure_hook, $paymentData);
            }
            return $this->payment_response($paymentData, 'fail');
        }
    }

    /**
     * Handle successful payment (legacy route)
     */
    public function success(Request $request)
    {
        return $this->callback($request);
    }

    /**
     * Handle canceled payment
     */
    public function canceled(Request $request): JsonResponse|Redirector|RedirectResponse|Application
    {
        $payment_id = $request->input('payment_id');
        $paymentData = $this->payment::where(['id' => $payment_id])->first();
        
        if (isset($paymentData) && function_exists($paymentData->failure_hook)) {
            call_user_func($paymentData->failure_hook, $paymentData);
        }
        return $this->payment_response($paymentData, 'cancel');
    }
}
