@extends('layouts.vendor.app')

@section('title',translate('messages.add_product_to_flash_sale'))

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
                    {{translate('messages.add_product_to_flash_sale')}}
                </span>
            </h1>
        </div>
        <!-- End Page Header -->

        <!-- Flash Sale Info -->
        <div class="card mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4">
                        <strong>{{translate('messages.flash_sale')}}:</strong>
                        <span class="ml-2">{{ $flash_sale->title }}</span>
                    </div>
                    <div class="col-md-4">
                        <strong>{{translate('messages.start_date')}}:</strong>
                        <span class="ml-2">{{ $flash_sale->start_date->format('d M Y') }}</span>
                    </div>
                    <div class="col-md-4">
                        <strong>{{translate('messages.end_date')}}:</strong>
                        <span class="ml-2">{{ $flash_sale->end_date->format('d M Y') }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="mb-3">
            <a href="{{route('vendor.item.flash_sale_list')}}" class="btn btn-secondary">
                <i class="tio-arrow-back mr-1"></i>{{translate('messages.back_to_flash_sales')}}
            </a>
        </div>

        <!-- Add Product Form -->
        <div class="card mb-3">
            <div class="card-header">
                <h5 class="card-title">{{translate('messages.add_new_product')}}</h5>
            </div>
            <div class="card-body">
                <form action="{{route('vendor.item.flash_sale_store_product')}}" method="POST">
                    @csrf
                    <input type="hidden" name="flash_sale_id" value="{{ $flash_sale->id }}">
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label class="input-label">{{translate('messages.select_product')}} <span class="text-danger">*</span></label>
                                <select name="item_id" id="item_id" class="form-control js-select2-custom" required>
                                    <option value="">{{translate('messages.select_product')}}</option>
                                    @foreach($products as $product)
                                        <option value="{{$product->id}}" data-stock="{{$product->stock}}" data-price="{{$product->price}}">
                                            {{$product->name}} ({{translate('messages.stock')}}: {{$product->stock}}, {{translate('messages.price')}}: {{\App\CentralLogics\Helpers::format_currency($product->price)}})
                                        </option>
                                    @endforeach
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label class="input-label">{{translate('messages.flash_sale_stock')}} <span class="text-danger">*</span></label>
                                <input type="number" name="stock" class="form-control" placeholder="{{translate('messages.enter_stock_quantity')}}" min="1" required>
                                <small class="text-muted">{{translate('messages.stock_to_allocate_for_flash_sale')}}</small>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label class="input-label">{{translate('messages.discount_type')}} <span class="text-danger">*</span></label>
                                <select name="discount_type" id="discount_type" class="form-control" required>
                                    <option value="percent">{{translate('messages.percent')}} (%)</option>
                                    <option value="amount">{{translate('messages.amount')}}</option>
                                    <option value="current_active_discount">{{translate('messages.use_current_product_discount')}}</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6" id="discount_field">
                            <div class="form-group">
                                <label class="input-label">{{translate('messages.discount')}} <span class="text-danger">*</span></label>
                                <input type="number" name="discount" id="discount_input" class="form-control" placeholder="{{translate('messages.enter_discount')}}" min="0" step="0.01">
                            </div>
                        </div>
                    </div>
                    
                    <div class="btn--container justify-content-end mt-3">
                        <button type="reset" class="btn btn--reset">{{translate('messages.reset')}}</button>
                        <button type="submit" class="btn btn--primary">{{translate('messages.add_product')}}</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Your Products in this Flash Sale -->
        @if($flash_sale_items->count() > 0)
        <div class="card">
            <div class="card-header">
                <h5 class="card-title">{{translate('messages.your_products_in_this_flash_sale')}} <span class="badge badge-soft-success">{{$flash_sale_items->count()}}</span></h5>
            </div>
            <div class="table-responsive datatable-custom">
                <table class="table table-borderless table-thead-bordered table-nowrap table-align-middle card-table">
                    <thead class="thead-light">
                    <tr class="text-center">
                        <th>{{translate('sl')}}</th>
                        <th>{{translate('messages.product')}}</th>
                        <th>{{translate('messages.stock')}}</th>
                        <th>{{translate('messages.discount')}}</th>
                        <th>{{translate('messages.flash_sale_price')}}</th>
                        <th>{{translate('messages.status')}}</th>
                    </tr>
                    </thead>
                    <tbody>
                    @foreach($flash_sale_items as $key=>$item)
                        <tr>
                            <td class="text-center">{{$key+1}}</td>
                            <td class="text-center">
                                <a class="media align-items-center" href="{{route('vendor.item.view',[$item->item_id])}}">
                                    <img class="avatar avatar-lg mr-3 onerror-image" src="{{ $item->item['image_full_url'] }}"
                                         data-onerror-image="{{asset('public/assets/admin/img/160x160/img2.jpg')}}" alt="{{$item->item->name}} image">
                                    <div class="media-body">
                                        <h5 class="text-hover-primary mb-0">{{Str::limit($item->item['name'],20,'...')}}</h5>
                                    </div>
                                </a>
                            </td>
                            <td class="text-center">
                                {{ $item->available_stock }} / {{ $item->stock }}
                            </td>
                            <td class="text-center">
                                @if($item->discount_type == 'percent')
                                    {{$item->discount}} %
                                @elseif($item->discount_type == 'current_active_discount')
                                    {{translate('messages.product_discount')}}
                                @else
                                    {{\App\CentralLogics\Helpers::format_currency($item->discount)}}
                                @endif
                            </td>
                            <td class="text-center">
                                {{\App\CentralLogics\Helpers::format_currency($item->price)}}
                            </td>
                            <td class="text-center">
                                @if($item->status == 1)
                                    <span class="badge badge-soft-success">{{translate('messages.active')}}</span>
                                @else
                                    <span class="badge badge-soft-danger">{{translate('messages.inactive')}}</span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                    </tbody>
                </table>
            </div>
        </div>
        @endif
    </div>

@endsection

@push('script_2')
<script>
    $(document).ready(function() {
        // Toggle discount field based on discount type
        $('#discount_type').on('change', function() {
            if ($(this).val() == 'current_active_discount') {
                $('#discount_field').hide();
                $('#discount_input').removeAttr('required');
            } else {
                $('#discount_field').show();
                $('#discount_input').attr('required', true);
            }
        });

        // Initialize select2
        $('.js-select2-custom').select2();
    });
</script>
@endpush
