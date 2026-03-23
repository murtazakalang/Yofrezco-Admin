<?php

return [
    /*
    |--------------------------------------------------------------------------
    | HKA Electronic Invoicing (Factura Electrónica - Panama)
    |--------------------------------------------------------------------------
    |
    | Configuration for The Factory HKA electronic invoicing API.
    | Required for Panama government compliance (DGI).
    |
    */

    'enabled' => env('HKA_ENABLED', false),

    // API credentials
    'token_empresa' => env('HKA_TOKEN_EMPRESA', ''),
    'token_password' => env('HKA_TOKEN_PASSWORD', ''),

    // API URL (demo or production)
    'api_url' => env('HKA_API_URL', 'https://demointegracion.thefactoryhka.com.pa/api'),

    // Branch / billing point configuration
    'sucursal_code' => env('HKA_SUCURSAL_CODE', '0000'),
    'tipo_sucursal' => env('HKA_TIPO_SUCURSAL', '1'),
    'punto_facturacion' => env('HKA_PUNTO_FACTURACION', '001'),

    // Document defaults
    'tipo_emision' => '01',           // 01 = Normal
    'tipo_documento' => '01',         // 01 = Factura de Operación Interna
    'naturaleza_operacion' => '01',   // 01 = Venta
    'tipo_operacion' => '1',          // 1 = Compra-Venta
    'destino_operacion' => '1',       // 1 = Panama, 2 = Extranjero
    'formato_cafe' => '1',            // 1 = PDF
    'entrega_cafe' => '1',            // 1 = Email
    'envio_contenedor' => '1',        // 1 = API
    'proceso_generacion' => '1',      // 1 = Sistema del contribuyente
    'tipo_venta' => '1',              // 1 = Contado

    // Default client (Consumidor Final - for B2C transactions)
    'default_client' => [
        'tipo_cliente_fe' => '02',        // 02 = Consumidor Final
        'tipo_contribuyente' => '1',      // 1 = Natural, 2 = Juridico
        'razon_social' => 'Consumidor Final',
        'pais' => 'PA',
    ],

    // ITBMS (Panama VAT) tax rates
    'itbms_rates' => [
        '00' => 0.00,   // Exempt
        '01' => 0.07,   // 7%
        '02' => 0.10,   // 10%
        '03' => 0.15,   // 15%
    ],

    // Default ITBMS rate code
    'default_itbms_rate' => '01',  // 7%

    // Payment method mapping
    'payment_methods' => [
        'cash_on_delivery' => '01',   // Efectivo
        'digital_payment'  => '02',   // Tarjeta de Crédito
        'offline_payment'  => '04',   // Otro
        'wallet'           => '04',   // Otro
    ],

    // Auto-generate invoice on order delivery
    'auto_generate_on_delivery' => env('HKA_AUTO_GENERATE', true),
];
