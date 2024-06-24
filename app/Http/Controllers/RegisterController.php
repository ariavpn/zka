<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\CryptoTicker;
use Exception;
use Illuminate\Support\Facades\Log;
use App\Services\ImageWriter;
use App\Services\TokenManager;
use Illuminate\Support\Facades\Cookie;
use App\Models\Identity;
use App\Models\Sales;
use Illuminate\Support\Facades\Validator;
use MongoDB\Laravel\Validation;
use Illuminate\Validation\Rule;
use MongoDB\Laravel\Auth\User as Authenticatable;
use Jenssegers\Agent\Agent;

class RegisterController extends Controller
{

    private $tokenManager;
    private $commission;
    
    public function __construct(ImageWriter $imageWriter, TokenManager $tokenManager)
    {
        $this->imageWriter = $imageWriter;
        $this->tokenManager = $tokenManager;
        $this->commission = 0.25;
    }

    public function visitorID(Request $request) {
        
        $data=$request->all();
        $ctoken = $request->session()->token();
        
        if(isset($data['pubhash'])) {     
            
            $dateTime = Carbon::now();
            $agent = new Agent();

            $identity = Identity::where('pubhash', $data['pubhash'])->first();
            if(!isset($identity)) {
                $identity = Identity::where('refkey', $data['refkey'])->first();
            }
            if(!isset($identity)) {
                $identity = Identity::where('refkey2', $data['refkey'])->first();
            }
   
            if(!isset($identity) && !$agent->isRobot()) {
                $identity = new Identity();     
                $identity->pubhash = $data['pubhash'];
                $identity->refkey = $data['refkey'];
                $identity->token = $ctoken;          
                if (Cookie::has('client')) {
                    $client = Cookie::get('client');
                    $identity->localid = $client;
                }
                $identity->save();         
            }

            if(isset($data['checkforplan']) && $data['checkforplan']) {
                $dateTime = Carbon::now();
                $epochnow = $dateTime->timestamp;
                $sales = Sales::where('pubhash', $data['pubhash'])->where('plan.epochend', '>=', $epochnow)->first();
                if($sales && !isset($identity->ik) && isset($sales->address) && isset($sales->txid)) {
                    $result = array(
                        'absentik' => true,
                        'address' => $sales->address,
                        'txid' => $sales->txid,
                    );
                    return response()->json($result);
                } else if($sales && !isset($sales->vpnpath)) {
                    $result = array('inactivevpn' => true);
                    return response()->json($result);
                }
            }
        }
        return true;
    }
    public function createID(Request $request) {
        $data=$request->all();
        $validator = Validator::make($data, [
                    'pubhash' => [
                        "required", Rule::exists('mongodb.identity')
                    ]
                ]);
    
        if($validator->fails()) {           
            return response()->json($validator->errors());
        } else {
            $timestamp = Carbon::now();
            $identity = Identity::where('pubhash', $data['pubhash'])->first();
            $_id = $identity->id;
            $userid = hash('sha256', $_id);
            $token = $this->tokenManager->createToken($identity)->plainTextToken;
            $identity->stoken = $token;
            $identity->save();
            return array($userid, $token);
        }
    }

    public function updateID(Request $request) {
        $data=$request->all();
        $validator = Validator::make($data, [
                    'pubhash' => [
                        "required", Rule::exists('mongodb.identity')
                    ],
                    'ik' => [
                        "required", Rule::unique('mongodb.identity')
                    ],
                    'count' => [
                        "required"
                    ],
                    'msg' => [
                        "required"
                    ],                  
                ]);
        
        if($validator->fails()) { 
            Log::info('Validation errors: ' . json_encode($validator->errors()));     
            return response()->json($validator->errors());
        } else {     
            if (Cookie::has('referral')) {    
                $referral = Cookie::get('referral');
                $haslink = Identity::where('referral', $referral)->first();     
                if($haslink) {
                    $ref = $haslink->whereIn("prospects", [$data['refkey']])->first();
                    if(!$ref) {                                    
                        $ref = $haslink->whereIn("prospects", [$data['refkey2']])->first();
                    }
                    if($ref) {
                        $sales = Sales::where('pubhash', $data['pubhash'])->where('txid', $data['txid'])->first();
                        if($sales) {
                            $previousReferral = Sales::where('pubhash', $data['pubhash'])->where('lead', '$exists', true)->first();
                            if(!$previousReferral) {
                                $sales->lead = $haslink->pubhash;
                                $p = $sales->plan;

                                if(!isset($p['extends'])) {
                                    $selfrefcheck = Identity::where('pubhash', $data['pubhash'])->first(); 
                                    $sales->localid = $selfrefcheck->localid;
                                    $selfrefcount = Sales::where('localid', $selfrefcheck->localid)->count();
                                    if(!$selfrefcount || $selfrefcount < 2) {
                                        $paid = (isset($p['finalprice'])) ? $p['finalprice'] : $p['fixprice'];
                                        if($p['currency'] === 'XMR') {
                                            $sales->leadpay = round(($paid * $this->commission), 8);
                                        } else {
                                            $ticker = CryptoTicker::first();
                                            $sales->leadpay = round(((($paid * $this->commission) * $p['usd']) / $ticker['ticker']['monero']['usd']), 8);
                                        }
                                        $referer = Cookie::get('referer');
                                        if($referer) {
                                            $sales->referer = $referer;
                                        }                   
                                        $sales->save();
                                    }
                                    if($selfrefcount && $selfrefcount > 1) {
                                        $selfrefcheck->selfrefcount = $selfrefcount;
                                        $selfrefcheck->save();
                                    }                     
                                }
                            }                            
                        }
                    }
                }
            }              
            $timestamp = Carbon::now();    
            try {
                $identity = Identity::where('pubhash', $data['pubhash'])->first();
                $hashhash = hash('sha256',hash('sha256',$identity->id));
                if($hashhash === $data['msg']) {
                    $identity->refkey2 = $data['refkey2'];
                    $identity->ik = $data['ik'];
                    $identity->count = $data['count'];
                    $identity->updated_at = $timestamp;
                    $identity->save();
                    $result = array('success' => true);
                    return response()->json($result);
                } else {
                    abort(404);
                }
            }
            catch(Exception $e) {
                Log::info("updateID Exception");
                Log::info($e->getMessage());
                $result = array('success' => false);
            }
        }    
    }
}