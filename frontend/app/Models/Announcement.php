<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'title',
        'post_date',
        'event_date',
        'venue',
        'description',
        'who_will_attend',
        'admin_id',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}