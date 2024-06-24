<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

class Sales extends Model
{
    use HasFactory;
    
    protected $connection = 'mongodb';
    protected $collection = 'sales';
    public $timestamps = true;
    protected $primaryKey = '_id';

    

   // protected $hidden = ['_id'];
    protected $fillable = [
        'out', 'in', 'tx', 'tier','pledge', 'clientpledge', 'outbalance', 'match', 'notours','servicedown','txmatch'
    ];
    public function identity()
    {
        return $this->hasOne(\App\Models\Identity::class, 'pubhash',  'pubhash'); // ->select('refkey', 'referral');
    }
  
}
