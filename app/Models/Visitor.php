<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

class Visitor extends Model
{
    use HasFactory;
    
    protected $connection = 'mongodb';
    protected $collection = 'visitor';
    public $timestamps = true;
    protected $primaryKey = '_id';
    // protected $hidden = ['_id'];
    protected $fillable = [
        'browser', 'connection_type','country', 'device','device_type', 'languages','platform', 'user_type','referer', 'resolution','visit_type', 'date'
    ];
}
