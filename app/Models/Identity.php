<?php

namespace App\Models;

use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Eloquent\SoftDeletes;
use MongoDB\Laravel\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class Identity extends Authenticatable
{
    use HasFactory;
    use Notifiable;
    use HasApiTokens;
    
    protected $connection = 'mongodb';
    protected $collection = 'identity';
    public $timestamps = true;
    protected $primaryKey = '_id';
    protected $hidden = ['_id'];
    protected $dates = ['creditexpiry', 'creditthreshold'];


    protected $fillable = [
        'pubhash', 'hasvpn', 'token', 'plan'
    ];
    public function sales()
    {
       return $this->hasMany(\App\Models\Sales::class, 'pubhash', 'pubhash');
    }

}
