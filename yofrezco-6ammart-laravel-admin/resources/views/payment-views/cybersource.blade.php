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

                        <form id="payment-form" action="{{ route('cybersource.process') }}" method="POST">
                            @csrf
                            <input type="hidden" name="payment_id" value="{{ $data->id }}">

                            <div class="mb-3">
                                <label for="card_number" class="form-label">Card Number</label>
                                <input type="text" class="form-control" id="card_number" name="card_number"
                                    placeholder="1234 5678 9012 3456" maxlength="19" required>
                            </div>

                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <label for="expiry_month" class="form-label">Expiry Month</label>
                                    <select class="form-control" id="expiry_month" name="expiry_month" required>
                                        <option value="">MM</option>
                                        @for ($i = 1; $i <= 12; $i++)
                                            <option value="{{ str_pad($i, 2, '0', STR_PAD_LEFT) }}">
                                                {{ str_pad($i, 2, '0', STR_PAD_LEFT) }}</option>
                                        @endfor
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label for="expiry_year" class="form-label">Expiry Year</label>
                                    <select class="form-control" id="expiry_year" name="expiry_year" required>
                                        <option value="">YYYY</option>
                                        @for ($i = date('Y'); $i <= date('Y') + 15; $i++)
                                            <option value="{{ $i }}">{{ $i }}</option>
                                        @endfor
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label for="cvv" class="form-label">CVV</label>
                                    <input type="password" class="form-control" id="cvv" name="cvv" placeholder="123"
                                        maxlength="4" required>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="first_name" class="form-label">First Name</label>
                                <input type="text" class="form-control" id="first_name" name="first_name" required>
                            </div>

                            <div class="mb-3">
                                <label for="last_name" class="form-label">Last Name</label>
                                <input type="text" class="form-control" id="last_name" name="last_name" required>
                            </div>

                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" name="email" required>
                            </div>

                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary btn-lg" id="submit-btn">
                                    <span id="btn-text">Pay Now</span>
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
                                <i class="bi bi-lock-fill"></i> Secure payment powered by CyberSource
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

        // Format card number with spaces
        document.getElementById('card_number').addEventListener('input', function (e) {
            let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
            let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formatted;
        });
    </script>
@endsection