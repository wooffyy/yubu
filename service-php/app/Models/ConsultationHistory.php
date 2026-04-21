<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class ConsultationHistory extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'consultation_history';
    
    protected $fillable = [
        'user_id',
        'category',
        'template_id',
        'problem',
        'ai_response',
        'metadata',
        'created_at'
    ];

    protected $casts = [
        'metadata' => 'array', // biar tetep jadi array
        'template_id' => 'string',  
        'created_at' => 'datetime',
    ];

    protected $attributes = [
        'template_id' => null, // kalo ga pake template, default null
        'metadata' => [],       
    ];
}