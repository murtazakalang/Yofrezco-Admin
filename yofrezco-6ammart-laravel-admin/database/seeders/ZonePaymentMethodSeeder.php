<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ZonePaymentMethod;

class ZonePaymentMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Panama (zone_id = 11): Tilopay, CyberSource
     * Curacao (zone_id = 4): Rapidpay
     */
    public function run(): void
    {
        // Clear existing data
        ZonePaymentMethod::truncate();

        // Panama Zone (ID: 11) - Tilopay and CyberSource
        ZonePaymentMethod::create([
            'zone_id' => 11,
            'payment_method' => 'tilopay'
        ]);

        ZonePaymentMethod::create([
            'zone_id' => 11,
            'payment_method' => 'cybersource'
        ]);

        // Curacao Zone (ID: 4) - Rapidpay
        ZonePaymentMethod::create([
            'zone_id' => 4,
            'payment_method' => 'rapidpay'
        ]);
    }
}
