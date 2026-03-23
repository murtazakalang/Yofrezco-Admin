<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HkaInvoice extends Model
{
    protected $table = 'hka_invoices';

    protected $fillable = [
        'order_id',
        'cufe',
        'qr_url',
        'numero_documento_fiscal',
        'status',
        'hka_response_code',
        'hka_response_message',
        'protocolo_autorizacion',
        'fecha_recepcion_dgi',
        'request_payload',
        'response_payload',
        'pdf_path',
        'email_sent',
        'voided_at',
    ];

    protected $casts = [
        'email_sent' => 'boolean',
        'fecha_recepcion_dgi' => 'datetime',
        'voided_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function scopeAuthorized($query)
    {
        return $query->where('status', 'authorized');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function isAuthorized(): bool
    {
        return $this->status === 'authorized';
    }

    public function isVoided(): bool
    {
        return $this->status === 'voided';
    }

    public function canBeVoided(): bool
    {
        return $this->status === 'authorized' && $this->voided_at === null;
    }
}
