{{-- HKA Electronic Invoice (Factura Electrónica) Section --}}
@if(config('hka.enabled'))
<div class="card mt-3">
    <div class="card-header">
        <h5 class="card-title">
            <i class="tio-receipt"></i> {{translate('messages.electronic_invoice')}} (HKA)
        </h5>
    </div>
    <div class="card-body">
        @php
            $hkaInvoice = $order->hkaInvoice;
        @endphp

        @if($hkaInvoice)
            <div class="row">
                <div class="col-md-6">
                    <table class="table table-borderless table-sm">
                        <tr>
                            <td><strong>{{translate('messages.status')}}:</strong></td>
                            <td>
                                @if($hkaInvoice->status == 'authorized')
                                    <span class="badge badge-success">{{translate('messages.authorized')}}</span>
                                @elseif($hkaInvoice->status == 'pending')
                                    <span class="badge badge-warning">{{translate('messages.pending')}}</span>
                                @elseif($hkaInvoice->status == 'failed')
                                    <span class="badge badge-danger">{{translate('messages.failed')}}</span>
                                @elseif($hkaInvoice->status == 'voided')
                                    <span class="badge badge-secondary">{{translate('messages.voided')}}</span>
                                @endif
                            </td>
                        </tr>
                        @if($hkaInvoice->cufe)
                        <tr>
                            <td><strong>CUFE:</strong></td>
                            <td><small class="text-muted">{{ \Illuminate\Support\Str::limit($hkaInvoice->cufe, 30) }}</small></td>
                        </tr>
                        @endif
                        @if($hkaInvoice->numero_documento_fiscal)
                        <tr>
                            <td><strong>{{translate('messages.fiscal_doc_number')}}:</strong></td>
                            <td>{{ $hkaInvoice->numero_documento_fiscal }}</td>
                        </tr>
                        @endif
                        @if($hkaInvoice->protocolo_autorizacion)
                        <tr>
                            <td><strong>{{translate('messages.authorization_number')}}:</strong></td>
                            <td>{{ $hkaInvoice->protocolo_autorizacion }}</td>
                        </tr>
                        @endif
                        @if($hkaInvoice->fecha_recepcion_dgi)
                        <tr>
                            <td><strong>{{translate('messages.dgi_reception_date')}}:</strong></td>
                            <td>{{ $hkaInvoice->fecha_recepcion_dgi->format('Y-m-d H:i:s') }}</td>
                        </tr>
                        @endif
                        @if($hkaInvoice->email_sent)
                        <tr>
                            <td><strong>{{translate('messages.email_sent')}}:</strong></td>
                            <td><span class="badge badge-info">{{translate('messages.sent')}}</span></td>
                        </tr>
                        @endif
                    </table>
                </div>
                <div class="col-md-6">
                    @if($hkaInvoice->status == 'failed')
                        <div class="alert alert-danger alert-sm mb-3">
                            <strong>{{translate('messages.error')}}:</strong> {{ $hkaInvoice->hka_response_message ?? 'Unknown error' }}
                        </div>
                    @endif

                    @if($hkaInvoice->qr_url)
                        <a href="{{ $hkaInvoice->qr_url }}" target="_blank" class="btn btn-sm btn-outline-info mb-2 d-block">
                            <i class="tio-open-in-new"></i> {{translate('messages.verify_on_dgi')}}
                        </a>
                    @endif
                </div>
            </div>

            {{-- Action Buttons --}}
            <hr>
            <div class="d-flex flex-wrap gap-2">
                @if($hkaInvoice->status == 'failed')
                    <form action="{{ route('admin.hka.generate', $order->id) }}" method="POST" class="d-inline">
                        @csrf
                        <button type="submit" class="btn btn-sm btn-primary" onclick="return confirm('{{translate('messages.are_you_sure')}}')">
                            <i class="tio-refresh"></i> {{translate('messages.retry_invoice')}}
                        </button>
                    </form>
                @endif

                @if($hkaInvoice->isAuthorized())
                    <a href="{{ route('admin.hka.download-pdf', $order->id) }}" class="btn btn-sm btn-success">
                        <i class="tio-download"></i> {{translate('messages.download_pdf')}}
                    </a>

                    <form action="{{ route('admin.hka.send-email', $order->id) }}" method="POST" class="d-inline">
                        @csrf
                        <button type="submit" class="btn btn-sm btn-info">
                            <i class="tio-email"></i> {{translate('messages.send_email_invoice')}}
                        </button>
                    </form>

                    @if($hkaInvoice->canBeVoided())
                        <form action="{{ route('admin.hka.void', $order->id) }}" method="POST" class="d-inline">
                            @csrf
                            <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('{{translate('messages.void_invoice_confirm')}}')">
                                <i class="tio-clear"></i> {{translate('messages.void_invoice')}}
                            </button>
                        </form>
                    @endif
                @endif
            </div>

        @else
            {{-- No invoice yet - show generate button --}}
            <div class="text-center py-3">
                <p class="text-muted mb-3">{{translate('messages.no_electronic_invoice_generated')}}</p>
                <form action="{{ route('admin.hka.generate', $order->id) }}" method="POST" class="d-inline">
                    @csrf
                    <button type="submit" class="btn btn-primary" onclick="return confirm('{{translate('messages.generate_einvoice_confirm')}}')">
                        <i class="tio-receipt"></i> {{translate('messages.generate_electronic_invoice')}}
                    </button>
                </form>
            </div>
        @endif
    </div>
</div>
@endif
