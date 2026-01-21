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
            $table->decimal('product_commission_amount', 24, 2)->default(0)->after('order_amount');
            $table->decimal('delivery_commission_amount', 24, 2)->default(0)->after('product_commission_amount');
            $table->decimal('product_commission_percentage', 8, 2)->default(0)->after('delivery_commission_amount');
            $table->decimal('delivery_commission_percentage', 8, 2)->default(0)->after('product_commission_percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'product_commission_amount',
                'delivery_commission_amount',
                'product_commission_percentage',
                'delivery_commission_percentage',
            ]);
        });
    }
};
