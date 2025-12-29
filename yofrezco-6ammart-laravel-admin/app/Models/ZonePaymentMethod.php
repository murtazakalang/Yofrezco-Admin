<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ZonePaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = ['zone_id', 'payment_method'];

    /**
     * Get the zone that owns this payment method mapping.
     */
    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }
}
