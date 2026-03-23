@extends('layouts.admin.app')

@section('title', translate('messages.hka_invoice_logs'))

@section('content')
<div class="content container-fluid">
    <div class="page-header">
        <div class="row align-items-center">
            <div class="col-sm mb-2 mb-sm-0">
                <h1 class="page-header-title">
                    <i class="tio-receipt"></i> {{translate('messages.hka_electronic_invoices')}}
                </h1>
            </div>
            <div class="col-sm-auto">
                <span id="folios-info" class="badge badge-soft-info p-2">
                    {{translate('messages.loading_folios')}}...
                </span>
            </div>
        </div>
    </div>

    {{-- Filters --}}
    <div class="card mb-3">
        <div class="card-body">
            <form method="GET" action="{{ route('admin.hka.logs') }}" class="row align-items-end">
                <div class="col-md-3 mb-2">
                    <label>{{translate('messages.status')}}</label>
                    <select name="status" class="form-control">
                        <option value="all" {{ $status == 'all' ? 'selected' : '' }}>{{translate('messages.all')}}</option>
                        <option value="authorized" {{ $status == 'authorized' ? 'selected' : '' }}>{{translate('messages.authorized')}}</option>
                        <option value="pending" {{ $status == 'pending' ? 'selected' : '' }}>{{translate('messages.pending')}}</option>
                        <option value="failed" {{ $status == 'failed' ? 'selected' : '' }}>{{translate('messages.failed')}}</option>
                        <option value="voided" {{ $status == 'voided' ? 'selected' : '' }}>{{translate('messages.voided')}}</option>
                    </select>
                </div>
                <div class="col-md-4 mb-2">
                    <label>{{translate('messages.search')}}</label>
                    <input type="text" name="search" class="form-control" value="{{ $search }}" placeholder="{{translate('messages.search_by_order_id_cufe')}}">
                </div>
                <div class="col-md-2 mb-2">
                    <button type="submit" class="btn btn-primary btn-block">{{translate('messages.filter')}}</button>
                </div>
            </form>
        </div>
    </div>

    {{-- Invoice Table --}}
    <div class="card">
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover table-borderless table-thead-bordered table-nowrap table-align-middle card-table">
                    <thead class="thead-light">
                        <tr>
                            <th>{{translate('messages.sl')}}</th>
                            <th>{{translate('messages.order_id')}}</th>
                            <th>{{translate('messages.fiscal_doc_number')}}</th>
                            <th>{{translate('messages.customer')}}</th>
                            <th>{{translate('messages.status')}}</th>
                            <th>CUFE</th>
                            <th>{{translate('messages.date')}}</th>
                            <th>{{translate('messages.actions')}}</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($invoices as $key => $invoice)
                        <tr>
                            <td>{{ $invoices->firstItem() + $key }}</td>
                            <td>
                                <a href="{{ route('admin.order.details', $invoice->order_id) }}">
                                    #{{ $invoice->order_id }}
                                </a>
                            </td>
                            <td>{{ $invoice->numero_documento_fiscal }}</td>
                            <td>{{ $invoice->order?->customer?->f_name ?? 'N/A' }} {{ $invoice->order?->customer?->l_name ?? '' }}</td>
                            <td>
                                @if($invoice->status == 'authorized')
                                    <span class="badge badge-success">{{translate('messages.authorized')}}</span>
                                @elseif($invoice->status == 'pending')
                                    <span class="badge badge-warning">{{translate('messages.pending')}}</span>
                                @elseif($invoice->status == 'failed')
                                    <span class="badge badge-danger">{{translate('messages.failed')}}</span>
                                @elseif($invoice->status == 'voided')
                                    <span class="badge badge-secondary">{{translate('messages.voided')}}</span>
                                @endif
                            </td>
                            <td>
                                @if($invoice->cufe)
                                    <small title="{{ $invoice->cufe }}">{{ \Illuminate\Support\Str::limit($invoice->cufe, 20) }}</small>
                                @else
                                    -
                                @endif
                            </td>
                            <td>{{ $invoice->created_at->format('Y-m-d H:i') }}</td>
                            <td>
                                <div class="btn-group" role="group">
                                    <a href="{{ route('admin.order.details', $invoice->order_id) }}" class="btn btn-sm btn-outline-primary" title="{{translate('messages.view_order')}}">
                                        <i class="tio-visible"></i>
                                    </a>
                                    @if($invoice->isAuthorized())
                                        <a href="{{ route('admin.hka.download-pdf', $invoice->order_id) }}" class="btn btn-sm btn-outline-success" title="{{translate('messages.download_pdf')}}">
                                            <i class="tio-download"></i>
                                        </a>
                                    @endif
                                </div>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="8" class="text-center py-4">
                                <p class="text-muted">{{translate('messages.no_invoices_found')}}</p>
                            </td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
        @if($invoices->count() > 0)
        <div class="card-footer">
            {{ $invoices->links() }}
        </div>
        @endif
    </div>
</div>

@push('script_2')
<script>
    // Load folios count
    $(document).ready(function() {
        $.get("{{ route('admin.hka.folios') }}", function(data) {
            if (data && data.foliosRestantes !== undefined) {
                $('#folios-info').html('<i class="tio-receipt"></i> Folios: ' + data.foliosRestantes);
            } else {
                $('#folios-info').text('Folios: N/A');
            }
        }).fail(function() {
            $('#folios-info').text('Folios: Error');
        });
    });
</script>
@endpush
@endsection
