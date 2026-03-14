<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('delivery_tax_percentage', 8, 2)->default(0)->after('delivery_commission_percentage');
            $table->decimal('delivery_tax_amount', 24, 2)->default(0)->after('delivery_tax_percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['delivery_tax_percentage', 'delivery_tax_amount']);
        });
    }
};
