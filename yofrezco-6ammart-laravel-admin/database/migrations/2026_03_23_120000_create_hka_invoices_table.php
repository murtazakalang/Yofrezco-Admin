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
        Schema::create('hka_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->string('cufe')->nullable();
            $table->text('qr_url')->nullable();
            $table->string('numero_documento_fiscal');
            $table->string('status')->default('pending'); // pending, authorized, failed, voided
            $table->string('hka_response_code')->nullable();
            $table->text('hka_response_message')->nullable();
            $table->string('protocolo_autorizacion')->nullable();
            $table->timestamp('fecha_recepcion_dgi')->nullable();
            $table->text('request_payload')->nullable();
            $table->text('response_payload')->nullable();
            $table->string('pdf_path')->nullable();
            $table->boolean('email_sent')->default(false);
            $table->timestamp('voided_at')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('cufe');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hka_invoices');
    }
};
