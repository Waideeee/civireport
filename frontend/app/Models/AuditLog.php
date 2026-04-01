<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'admin_id',
        'complaint_id',
        'old_status',
        'new_status',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}