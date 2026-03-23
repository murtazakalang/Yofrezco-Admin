<?php

namespace App\Services;

use App\Models\Order;
use App\Models\HkaInvoice;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class HkaService
{
    protected string $apiUrl;
    protected string $tokenEmpresa;
    protected string $tokenPassword;

    public function __construct()
    {
        $this->apiUrl = rtrim(config('hka.api_url'), '/');
        $this->tokenEmpresa = config('hka.token_empresa');
        $this->tokenPassword = config('hka.token_password');
    }

    /**
     * Check if HKA integration is enabled and configured.
     */
    public function isEnabled(): bool
    {
        return config('hka.enabled', false)
            && !empty($this->tokenEmpresa)
            && !empty($this->tokenPassword);
    }

    /**
     * Authenticate with HKA API and get a JWT token.
     * Tokens are cached for 50 minutes (they typically expire in 60).
     */
    public function authenticate(): ?string
    {
        $cacheKey = 'hka_jwt_token';

        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = Http::timeout(30)->post("{$this->apiUrl}/Autenticacion", [
                'usuario' => $this->tokenEmpresa,
                'clave' => $this->tokenPassword,
            ]);

            if ($response->successful()) {
                $token = $response->json('token');
                
                if ($token) {
                    // Clean up the token - remove any quotes
                    $token = trim($token, '"');
                    Cache::put($cacheKey, $token, now()->addMinutes(50));
                    return $token;
                } else {
                    Log::error('HKA Authentication rejected (HTTP 200 but no token)', [
                        'body' => $response->body()
                    ]);
                    return null;
                }
            }

            Log::error('HKA Authentication failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        } catch (\Exception $e) {
            Log::error('HKA Authentication exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Send an electronic invoice for an order.
     */
    public function sendInvoice(Order $order): HkaInvoice
    {
        $order->load(['details.item', 'customer', 'store']);

        // Check if invoice already exists
        $existing = HkaInvoice::where('order_id', $order->id)
            ->whereIn('status', ['authorized', 'pending'])
            ->first();

        if ($existing) {
            return $existing;
        }

        // Generate a unique fiscal document number
        $numeroDocFiscal = str_pad($order->id, 10, '0', STR_PAD_LEFT);

        // Create the HKA invoice record
        $hkaInvoice = HkaInvoice::create([
            'order_id' => $order->id,
            'numero_documento_fiscal' => $numeroDocFiscal,
            'status' => 'pending',
        ]);

        // Build the electronic document
        $documento = $this->buildDocumentoElectronico($order, $numeroDocFiscal);

        // Store the request payload
        $hkaInvoice->update(['request_payload' => json_encode($documento)]);

        // Get JWT token
        $jwt = $this->authenticate();
        if (!$jwt) {
            $hkaInvoice->update([
                'status' => 'failed',
                'hka_response_message' => 'Authentication failed - could not obtain JWT token',
            ]);
            return $hkaInvoice;
        }

        try {
            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => "Bearer {$jwt}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->apiUrl}/Enviar", $documento);

            $responseData = $response->json();

            $hkaInvoice->update([
                'response_payload' => json_encode($responseData),
                'hka_response_code' => $responseData['codigo'] ?? $response->status(),
                'hka_response_message' => $responseData['mensaje'] ?? $response->body(),
            ]);

            // Check for success (code 200 means authorized)
            $code = $responseData['codigo'] ?? null;
            if ($code == 200 || $code == '200') {
                $hkaInvoice->update([
                    'status' => 'authorized',
                    'cufe' => $responseData['cufe'] ?? null,
                    'qr_url' => $responseData['qr'] ?? null,
                    'protocolo_autorizacion' => $responseData['nroProtocoloAutorizacion'] ?? null,
                    'fecha_recepcion_dgi' => $responseData['fechaRecepcionDGI'] ?? now(),
                ]);
            } else {
                $hkaInvoice->update(['status' => 'failed']);
            }
        } catch (\Exception $e) {
            Log::error('HKA Send Invoice exception', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
            $hkaInvoice->update([
                'status' => 'failed',
                'hka_response_message' => 'Exception: ' . $e->getMessage(),
            ]);
        }

        return $hkaInvoice->fresh();
    }

    /**
     * Void / cancel an electronic invoice.
     */
    public function voidInvoice(HkaInvoice $invoice): bool
    {
        if (!$invoice->canBeVoided()) {
            return false;
        }

        $jwt = $this->authenticate();
        if (!$jwt) {
            return false;
        }

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => "Bearer {$jwt}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->apiUrl}/Anulacion", [
                    'cufe' => $invoice->cufe,
                    'motivo' => 'Anulación solicitada por el administrador',
                ]);

            $responseData = $response->json();

            $code = $responseData['codigo'] ?? null;
            if ($code == 200 || $code == '200') {
                $invoice->update([
                    'status' => 'voided',
                    'voided_at' => now(),
                ]);
                return true;
            }

            Log::error('HKA Void Invoice failed', [
                'cufe' => $invoice->cufe,
                'response' => $responseData,
            ]);
            return false;
        } catch (\Exception $e) {
            Log::error('HKA Void Invoice exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Download the invoice as PDF.
     */
    public function downloadPdf(HkaInvoice $invoice): ?string
    {
        if (!$invoice->isAuthorized() && !$invoice->cufe) {
            return null;
        }

        $jwt = $this->authenticate();
        if (!$jwt) {
            return null;
        }

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => "Bearer {$jwt}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->apiUrl}/Descarga", [
                    'cufe' => $invoice->cufe,
                    'numeroDocumento' => $invoice->numero_documento_fiscal,
                    'tipoArchivo' => 'PDF',
                ]);

            if ($response->successful()) {
                $pdfContent = $response->body();
                $filename = 'hka_invoice_' . $invoice->order_id . '_' . time() . '.pdf';
                $path = storage_path('app/public/hka_invoices/' . $filename);

                // Ensure directory exists
                if (!is_dir(dirname($path))) {
                    mkdir(dirname($path), 0755, true);
                }

                // Check if the response is base64 encoded
                $decoded = base64_decode($pdfContent, true);
                if ($decoded !== false) {
                    file_put_contents($path, $decoded);
                } else {
                    file_put_contents($path, $pdfContent);
                }

                $invoice->update(['pdf_path' => 'hka_invoices/' . $filename]);
                return $path;
            }

            return null;
        } catch (\Exception $e) {
            Log::error('HKA Download PDF exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Send the invoice via email to the customer.
     */
    public function sendEmail(HkaInvoice $invoice, string $email): bool
    {
        if (!$invoice->cufe) {
            return false;
        }

        $jwt = $this->authenticate();
        if (!$jwt) {
            return false;
        }

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => "Bearer {$jwt}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->apiUrl}/EnvioCorreo", [
                    'cufe' => $invoice->cufe,
                    'correos' => [$email],
                ]);

            $responseData = $response->json();
            $code = $responseData['codigo'] ?? null;

            if ($code == 200 || $code == '200' || $response->successful()) {
                $invoice->update(['email_sent' => true]);
                return true;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('HKA Send Email exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Check remaining folios (invoice credits) on the license.
     */
    public function checkFolios(): ?array
    {
        $jwt = $this->authenticate();
        if (!$jwt) {
            return null;
        }

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => "Bearer {$jwt}",
                ])
                ->get("{$this->apiUrl}/FoliosRestantes");

            if ($response->successful()) {
                return $response->json();
            }

            return null;
        } catch (\Exception $e) {
            Log::error('HKA Check Folios exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Build the electronic document structure from an order.
     */
    protected function buildDocumentoElectronico(Order $order, string $numeroDocFiscal): array
    {
        $config = config('hka');

        // Build client section
        $cliente = $this->buildCliente($order);

        // Build items list
        $listaItems = $this->buildItems($order);

        // Build totals
        $totales = $this->buildTotales($order, $listaItems);

        // Transaction data
        $datosTransaccion = [
            'tipoEmision' => $config['tipo_emision'],
            'tipoDocumento' => $config['tipo_documento'],
            'numeroDocumentoFiscal' => $numeroDocFiscal,
            'puntoFacturacionFiscal' => $config['punto_facturacion'],
            'fechaEmision' => now()->setTimezone('America/Panama')->format('Y-m-d\TH:i:s-05:00'),
            'naturalezaOperacion' => $config['naturaleza_operacion'],
            'tipoOperacion' => $config['tipo_operacion'],
            'destinoOperacion' => $config['destino_operacion'],
            'formatoCAFE' => $config['formato_cafe'],
            'entregaCAFE' => $config['entrega_cafe'],
            'envioContenedor' => $config['envio_contenedor'],
            'procesoGeneracion' => $config['proceso_generacion'],
            'tipoVenta' => $config['tipo_venta'],
            'informacionInteres' => 'Pedido #' . $order->id . ' - ' . ($order->store->name ?? 'Yofrezco'),
            'cliente' => $cliente,
        ];

        return [
            'codigoSucursalEmisor' => $config['sucursal_code'],
            'tipoSucursal' => $config['tipo_sucursal'],
            'datosTransaccion' => $datosTransaccion,
            'listaItems' => $listaItems,
            'totalesSubTotales' => $totales,
        ];
    }

    /**
     * Build the client section of the electronic document.
     */
    protected function buildCliente(Order $order): array
    {
        $defaults = config('hka.default_client');
        $customer = $order->customer;

        // For most orders, use "Consumidor Final" (Consumer Final)
        $cliente = [
            'tipoClienteFE' => $defaults['tipo_cliente_fe'],
            'tipoContribuyente' => $defaults['tipo_contribuyente'],
            'razonSocial' => $defaults['razon_social'],
            'pais' => $defaults['pais'],
        ];

        // If we have customer info, populate it
        if ($customer) {
            $nombre = trim(($customer->f_name ?? '') . ' ' . ($customer->l_name ?? ''));
            if (!empty($nombre)) {
                $cliente['razonSocial'] = $nombre;
            }
            if (!empty($customer->email)) {
                $cliente['correoElectronico1'] = $customer->email;
            }
            if (!empty($customer->phone)) {
                $cliente['telefono1'] = $customer->phone;
            }
        }

        // Try to get delivery address for location info
        $address = $order->delivery_address ? json_decode($order->delivery_address, true) : null;
        if ($address && !empty($address['address'])) {
            $cliente['direccion'] = substr($address['address'], 0, 100);
        }

        return $cliente;
    }

    /**
     * Build the items list from order details.
     */
    protected function buildItems(Order $order): array
    {
        $items = [];
        $defaultItbmsRate = config('hka.default_itbms_rate', '01');
        $itbmsRates = config('hka.itbms_rates');
        $taxRate = $itbmsRates[$defaultItbmsRate] ?? 0.07;

        foreach ($order->details as $detail) {
            $itemName = 'Producto';
            $itemCode = 'P-' . $detail->item_id;

            if ($detail->item) {
                $itemName = substr($detail->item->name, 0, 80);
            } elseif ($detail->campaign) {
                $itemName = substr($detail->campaign->name ?? 'Campaña', 0, 80);
            }

            $quantity = number_format($detail->quantity, 2, '.', '');
            $unitPrice = number_format($detail->price, 2, '.', '');
            $discount = number_format($detail->discount_on_item ?? 0, 2, '.', '');
            $itemTotal = number_format($detail->price * $detail->quantity, 2, '.', '');

            // Calculate ITBMS (tax)
            $taxableAmount = ($detail->price * $detail->quantity) - ($detail->discount_on_item ?? 0);
            $itbmsAmount = number_format($taxableAmount * $taxRate, 2, '.', '');

            // Total with tax
            $valorTotal = number_format($taxableAmount + ($taxableAmount * $taxRate), 2, '.', '');

            $item = [
                'descripcion' => $itemName,
                'codigo' => $itemCode,
                'unidadMedida' => 'und',
                'cantidad' => $quantity,
                'precioUnitario' => $unitPrice,
                'precioUnitarioDescuento' => $discount,
                'precioItem' => $itemTotal,
                'valorTotal' => $valorTotal,
                'codigoGTIN' => '0',
                'cantGTINCom' => '0.00',
                'codigoGTINInv' => '0',
                'cantGTINComInv' => '0.00',
                'tasaITBMS' => $defaultItbmsRate,
                'valorITBMS' => $itbmsAmount,
            ];

            $items[] = $item;
        }

        // Add delivery charge as an item if applicable
        if ($order->delivery_charge > 0) {
            $deliveryCharge = number_format($order->delivery_charge, 2, '.', '');
            $deliveryTax = number_format($order->delivery_charge * $taxRate, 2, '.', '');
            $deliveryTotal = number_format($order->delivery_charge + ($order->delivery_charge * $taxRate), 2, '.', '');

            $items[] = [
                'descripcion' => 'Cargo por envío',
                'codigo' => 'DELIVERY',
                'unidadMedida' => 'und',
                'cantidad' => '1.00',
                'precioUnitario' => $deliveryCharge,
                'precioUnitarioDescuento' => '0.00',
                'precioItem' => $deliveryCharge,
                'valorTotal' => $deliveryTotal,
                'codigoGTIN' => '0',
                'cantGTINCom' => '0.00',
                'codigoGTINInv' => '0',
                'cantGTINComInv' => '0.00',
                'tasaITBMS' => $defaultItbmsRate,
                'valorITBMS' => $deliveryTax,
            ];
        }

        return $items;
    }

    /**
     * Build the totals section.
     */
    protected function buildTotales(Order $order, array $listaItems): array
    {
        $totalNeto = 0;
        $totalITBMS = 0;
        $totalTodosItems = 0;

        foreach ($listaItems as $item) {
            $totalNeto += floatval($item['precioItem']);
            $totalITBMS += floatval($item['valorITBMS']);
            $totalTodosItems += floatval($item['valorTotal']);
        }

        $totalNeto = number_format($totalNeto, 2, '.', '');
        $totalITBMS = number_format($totalITBMS, 2, '.', '');
        $totalTodosItems = number_format($totalTodosItems, 2, '.', '');

        $totalFactura = number_format($order->order_amount, 2, '.', '');
        $totalDiscount = number_format(
            ($order->coupon_discount_amount ?? 0) + ($order->store_discount_amount ?? 0),
            2, '.', ''
        );

        // Map payment method
        $paymentMethods = config('hka.payment_methods');
        $paymentCode = $paymentMethods[$order->payment_method] ?? '04';

        return [
            'totalPrecioNeto' => $totalNeto,
            'totalITBMS' => $totalITBMS,
            'totalISC' => '0.00',
            'totalMontoGravado' => $totalITBMS,
            'totalDescuento' => $totalDiscount,
            'totalAcarreoCobrado' => number_format($order->delivery_charge ?? 0, 2, '.', ''),
            'valorSeguroCobrado' => '0.00',
            'totalFactura' => $totalFactura,
            'totalValorRecibido' => $totalFactura,
            'vuelto' => '0.00',
            'tiempoPago' => '1',
            'nroItems' => (string) count($listaItems),
            'totalTodosItems' => $totalTodosItems,
            'listaFormaPago' => [
                [
                    'formaPagoFact' => $paymentCode,
                    'valorCuotaPagada' => $totalFactura,
                    'descFormaPago' => '',
                ],
            ],
        ];
    }
}
