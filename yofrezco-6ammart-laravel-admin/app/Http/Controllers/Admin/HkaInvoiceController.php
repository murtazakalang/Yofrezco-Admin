<?php

namespace App\Http\Controllers\Admin;

use App\Models\Order;
use App\Models\HkaInvoice;
use App\Services\HkaService;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Brian2694\Toastr\Facades\Toastr;
use App\Scopes\ZoneScope;

class HkaInvoiceController extends Controller
{
    protected HkaService $hkaService;

    public function __construct(HkaService $hkaService)
    {
        $this->hkaService = $hkaService;
    }

    /**
     * Generate an electronic invoice for an order.
     */
    public function generate($orderId)
    {
        if (!$this->hkaService->isEnabled()) {
            Toastr::error(translate('messages.hka_not_configured'));
            return back();
        }

        $order = Order::withOutGlobalScope(ZoneScope::class)
            ->with(['details.item', 'customer', 'store'])
            ->find($orderId);

        if (!$order) {
            Toastr::error(translate('messages.order_not_found'));
            return back();
        }

        // Check if invoice already exists
        $existing = HkaInvoice::where('order_id', $order->id)
            ->where('status', 'authorized')
            ->first();

        if ($existing) {
            Toastr::info(translate('messages.hka_invoice_already_exists'));
            return back();
        }

        $invoice = $this->hkaService->sendInvoice($order);

        if ($invoice->isAuthorized()) {
            Toastr::success(translate('messages.hka_invoice_generated_successfully'));
        } else {
            Toastr::error(translate('messages.hka_invoice_generation_failed') . ': ' . ($invoice->hka_response_message ?? 'Unknown error'));
        }

        return back();
    }

    /**
     * Check the status of an order's HKA invoice.
     */
    public function status($orderId)
    {
        $invoice = HkaInvoice::where('order_id', $orderId)->latest()->first();

        if (!$invoice) {
            return response()->json(['status' => 'none', 'message' => 'No invoice found']);
        }

        return response()->json([
            'status' => $invoice->status,
            'cufe' => $invoice->cufe,
            'qr_url' => $invoice->qr_url,
            'message' => $invoice->hka_response_message,
            'created_at' => $invoice->created_at->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Download the invoice PDF.
     */
    public function downloadPdf($orderId)
    {
        $invoice = HkaInvoice::where('order_id', $orderId)
            ->where('status', 'authorized')
            ->latest()
            ->first();

        if (!$invoice) {
            Toastr::error(translate('messages.hka_no_authorized_invoice'));
            return back();
        }

        // Try to use cached PDF first
        if ($invoice->pdf_path && file_exists(storage_path('app/public/' . $invoice->pdf_path))) {
            return response()->download(storage_path('app/public/' . $invoice->pdf_path));
        }

        // Download from HKA
        $path = $this->hkaService->downloadPdf($invoice);

        if ($path && file_exists($path)) {
            return response()->download($path);
        }

        Toastr::error(translate('messages.hka_pdf_download_failed'));
        return back();
    }

    /**
     * Send the invoice to the customer's email.
     */
    public function sendEmail(Request $request, $orderId)
    {
        $invoice = HkaInvoice::where('order_id', $orderId)
            ->where('status', 'authorized')
            ->latest()
            ->first();

        if (!$invoice) {
            Toastr::error(translate('messages.hka_no_authorized_invoice'));
            return back();
        }

        $order = Order::withOutGlobalScope(ZoneScope::class)
            ->with('customer')
            ->find($orderId);

        $email = $request->input('email', $order->customer->email ?? null);

        if (!$email) {
            Toastr::error(translate('messages.hka_no_email_address'));
            return back();
        }

        $success = $this->hkaService->sendEmail($invoice, $email);

        if ($success) {
            Toastr::success(translate('messages.hka_email_sent_successfully'));
        } else {
            Toastr::error(translate('messages.hka_email_send_failed'));
        }

        return back();
    }

    /**
     * Void/cancel an electronic invoice.
     */
    public function void($orderId)
    {
        $invoice = HkaInvoice::where('order_id', $orderId)
            ->where('status', 'authorized')
            ->latest()
            ->first();

        if (!$invoice) {
            Toastr::error(translate('messages.hka_no_authorized_invoice'));
            return back();
        }

        $success = $this->hkaService->voidInvoice($invoice);

        if ($success) {
            Toastr::success(translate('messages.hka_invoice_voided_successfully'));
        } else {
            Toastr::error(translate('messages.hka_invoice_void_failed'));
        }

        return back();
    }

    /**
     * Check remaining folios.
     */
    public function folios()
    {
        if (!$this->hkaService->isEnabled()) {
            return response()->json(['error' => 'HKA not configured'], 400);
        }

        $folios = $this->hkaService->checkFolios();

        if ($folios) {
            return response()->json($folios);
        }

        return response()->json(['error' => 'Could not retrieve folios information'], 500);
    }

    /**
     * Show HKA invoice logs.
     */
    public function logs(Request $request)
    {
        $status = $request->query('status', 'all');
        $search = $request->query('search');

        $invoices = HkaInvoice::with('order.customer')
            ->when($status !== 'all', function ($q) use ($status) {
                return $q->where('status', $status);
            })
            ->when(!empty($search), function ($q) use ($search) {
                return $q->where(function ($query) use ($search) {
                    $query->where('cufe', 'like', "%{$search}%")
                        ->orWhere('numero_documento_fiscal', 'like', "%{$search}%")
                        ->orWhere('order_id', $search);
                });
            })
            ->latest()
            ->paginate(25);

        return view('admin-views.hka.logs', compact('invoices', 'status', 'search'));
    }
}
