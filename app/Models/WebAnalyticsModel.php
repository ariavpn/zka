<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

class WebAnalyticsModel extends Model
{
    use HasFactory;
    
    protected $connection = 'mongodb';
    protected $collection = 'webanalytics';
    public $timestamps = true;
    protected $primaryKey = '_id';
    protected $hidden = ['_id'];
    protected $fillable = [
       
    ];
}
