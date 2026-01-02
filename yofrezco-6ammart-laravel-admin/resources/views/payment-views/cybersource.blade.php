@extends('payment-views.layouts.master')

@push('script')
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
@endpush

@section('content')
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card shadow">
                    <div class="card-header bg-primary text-white text-center">
                        <h4 class="mb-0">CyberSource Payment</h4>
                    </div>
                    <div class="card-body">
                        <div class="text-center mb-4">
                            <h5>Payment Amount: <strong>{{ $data->currency_code }}
                                    {{ number_format($data->payment_amount, 2) }}</strong></h5>
                        </div>

                        {{-- Secure Acceptance Form - Posts directly to CyberSource --}}
                        <form id="payment-form" action="{{ $formData['endpoint'] }}" method="POST">
                            {{-- Signed fields from controller --}}
                            @foreach($formData['fields'] as $name => $value)
                                <input type="hidden" name="{{ $name }}" value="{{ $value }}">
                            @endforeach

                            {{-- Unsigned fields - card data entered by user --}}
                            <div class="mb-3">
                                <label for="card_type" class="form-label">Card Type</label>
                                <select class="form-control" id="card_type" name="card_type" required>
                                    <option value="001">Visa</option>
                                    <option value="002">Mastercard</option>
                                    <option value="003">American Express</option>
                                    <option value="004">Discover</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label for="card_number" class="form-label">Card Number</label>
                                <input type="text" class="form-control" id="card_number" name="card_number"
                                    placeholder="4111111111111111" maxlength="19" required autocomplete="cc-number">
                            </div>

                            <div class="row mb-3">
                                <div class="col-md-8">
                                    <label for="card_expiry_date" class="form-label">Expiry Date (MM-YYYY)</label>
                                    <input type="text" class="form-control" id="card_expiry_date" name="card_expiry_date"
                                        placeholder="12-2031" maxlength="7" required pattern="\d{2}-\d{4}"
                                        autocomplete="cc-exp">
                                </div>
                                <div class="col-md-4">
                                    <label for="card_cvn" class="form-label">CVV</label>
                                    <input type="password" class="form-control" id="card_cvn" name="card_cvn"
                                        placeholder="123" maxlength="4" required autocomplete="cc-csc">
                                </div>
                            </div>

                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary btn-lg" id="submit-btn">
                                    <span id="btn-text">Pay {{ $data->currency_code }}
                                        {{ number_format($data->payment_amount, 2) }}</span>
                                    <span id="btn-loader" class="d-none">
                                        <span class="spinner-border spinner-border-sm" role="status"
                                            aria-hidden="true"></span>
                                        Processing...
                                    </span>
                                </button>
                            </div>
                        </form>

                        <div class="mt-3 text-center">
                            <small class="text-muted">
                                <i class="bi bi-lock-fill"></i> Secure payment powered by CyberSource (A Visa Solution)
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('payment-form').addEventListener('submit', function (e) {
            document.getElementById('btn-text').classList.add('d-none');
            document.getElementById('btn-loader').classList.remove('d-none');
            document.getElementById('submit-btn').disabled = true;
        });

        // Format card number - remove spaces for submission
        document.getElementById('card_number').addEventListener('input', function (e) {
            let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
            e.target.value = value;
        });

        // Format expiry date as MM-YYYY
        document.getElementById('card_expiry_date').addEventListener('input', function (e) {
            let value = e.target.value.replace(/[^\d-]/g, '');
            if (value.length === 2 && !value.includes('-')) {
                value = value + '-';
            }
            e.target.value = value;
        });
    </script>
@endsection