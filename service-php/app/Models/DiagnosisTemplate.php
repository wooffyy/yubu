<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class DiagnosisTemplate extends Model {
    protected $connection = 'mongodb';
    protected $collection = 'diagnosis_templates';
    protected $fillable = [
        'name',
        'problem_category',
        'system_prompt',
        'user_prompt_template', 
        'variables',
        'estimated_cost_range'
    ];

    protected $cast = [
        'variables' => 'array'
    ];
}