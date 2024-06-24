<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Identity;
use Illuminate\Support\Facades\Cookie;
use App\Models\WebAnalyticsModel;

class ClientController extends Controller
{

    private $app_path;

    public function __construct()
    {
        $this->app_path = config('app.path');
    }
    public function getIK(Request $request) {
        $data=$request->all();
        $identity = Identity::where('pubhash', $data['pubhash'])->first();
        if(isset($identity) && isset($identity->ik)){
            $result = array(
                'ik' => $identity->ik,
                'count' => $identity->count
            );
            
            return response()->json($result);
        }
        $result = array('ik' => "identity not found");
        return response()->json($result);
    }

    public function privateArea(Request $request) {
        $data=$request->all();

        $identity = Identity::where('pubhash', $data['pubhash'])->first(); 
        $visitor = null;
        if($identity) {           
            $hashhash = hash('sha256',hash('sha256',$identity->id));              
            if($hashhash === $data['msg']) {
                if (Cookie::has('visitor')) {
                    $uuid = Cookie::get('visitor');
                    $visitor = WebAnalyticsModel::where('uuid', $uuid)->get();             
                }                
                $result = array(
                    'identity' => $identity,
                    'visitor' => $visitor
                );

                return response()->json($result);
            }
        }        
    }
}




