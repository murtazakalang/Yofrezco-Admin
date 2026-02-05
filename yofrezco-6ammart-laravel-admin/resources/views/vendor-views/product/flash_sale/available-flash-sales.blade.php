@extends('layouts.vendor.app')

@section('title', translate('messages.available_flash_sales'))

@push('css_or_js')

@endpush

@section('content')
    <div class="content container-fluid">
        <!-- Page Header -->
        <div class="page-header">
            <h1 class="page-header-title">
                <span class="page-header-icon">
                    <img src="{{asset('public/assets/admin/img/condition.png')}}" class="w--26" alt="">
                </span>
                <span>
                    {{translate('messages.available_flash_sales')}}
                </span>
            </h1>
        </div>
        <!-- End Page Header -->

        <div class="mb-3">
            <a href="{{route('vendor.item.flash_sale')}}" class="btn btn--primary">
                <i class="tio-arrow-back mr-1"></i>{{translate('messages.my_flash_sale_products')}}
            </a>
        </div>

        <div class="row g-3">
            <div class="col-12">
                <div class="card">
                    <div class="card-header py-2 border-0">
                        <div class="search--button-wrapper">
                            <h5 class="card-title">
                                {{translate('messages.active_flash_sales')}}<span class="badge badge-soft-dark ml-2"
                                    id="itemCount">{{$flash_sales->total()}}</span>
                            </h5>
                            <form class="search-form">
                                <!-- Search -->
                                <div class="input-group input--group">
                                    <input id="datatableSearch_" value="{{ request()?->search ?? null }}" type="search"
                                        name="search" class="form-control"
                                        placeholder="{{translate('ex_:_flash_sale_title')}}" aria-label="Search">
                                    <button type="submit" class="btn btn--secondary"><i class="tio-search"></i></button>
                                </div>
                                <!-- End Search -->
                            </form>
                        </div>
                    </div>
                    <!-- Table -->
                    <div class="table-responsive datatable-custom">
                        <table id="columnSearchDatatable"
                            class="table table-borderless table-thead-bordered table-nowrap table-align-middle card-table"
                            data-hs-datatables-options='{
                                     "order": [],
                                     "orderCellsTop": true,
                                     "paging":false
                                   }'>
                            <thead class="thead-light">
                                <tr class="text-center">
                                    <th class="border-0">{{translate('sl')}}</th>
                                    <th class="border-0">{{translate('messages.title')}}</th>
                                    <th class="border-0">{{translate('messages.duration')}}</th>
                                    <th class="border-0">{{translate('messages.total_products')}}</th>
                                    <th class="border-0">{{translate('messages.your_products')}}</th>
                                    <th class="border-0">{{translate('messages.action')}}</th>
                                </tr>

                            </thead>

                            <tbody id="set-rows">
                                @foreach($flash_sales as $key => $flash_sale)
                                    <tr>
                                        <td class="text-center">
                                            <span class="mr-3">
                                                {{$key + $flash_sales->firstItem()}}
                                            </span>
                                        </td>
                                        <td class="text-center">
                                            <h5 class="mb-0">{{Str::limit($flash_sale->title, 30, '...')}}</h5>
                                        </td>
                                        <td class="text-center">
                                            <div>
                                                <strong>{{translate('messages.start')}}:</strong>
                                                {{ $flash_sale->start_date->format('d M Y') }}<br>
                                                <strong>{{translate('messages.end')}}:</strong>
                                                {{ $flash_sale->end_date->format('d M Y') }}
                                            </div>
                                        </td>
                                        <td class="text-center">
                                            <span
                                                class="badge badge-soft-info">{{ $flash_sale->products_count ?? $flash_sale->products->count() }}</span>
                                        </td>
                                        <td class="text-center">
                                            <span
                                                class="badge badge-soft-success">{{ $flash_sale->vendor_products_count ?? 0 }}</span>
                                        </td>
                                        <td class="text-center">
                                            <a class="btn btn--primary btn-sm"
                                                href="{{route('vendor.item.flash_sale_add_product', $flash_sale->id)}}">
                                                <i class="tio-add mr-1"></i>{{translate('messages.add_product')}}
                                            </a>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                    @if(count($flash_sales) !== 0)
                        <hr>
                    @endif
                    <div class="page-area">
                        {!! $flash_sales->links() !!}
                    </div>
                    @if(count($flash_sales) === 0)
                        <div class="empty--data">
                            <img src="{{asset('/public/assets/admin/svg/illustrations/sorry.svg')}}" alt="public">
                            <h5>
                                {{translate('no_active_flash_sales_available')}}
                            </h5>
                        </div>
                    @endif
                </div>
            </div>
            <!-- End Table -->
        </div>
    </div>

@endsection

@push('script_2')

@endpush