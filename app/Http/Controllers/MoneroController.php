<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PubXMRIndex;
use App\Models\Sales;
use App\Models\Identity;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Validator;
use MongoDB\Laravel\Validation;
use Illuminate\Validation\Rule;

class MoneroController extends Controller
{

    private $app_path;

    public function __construct()
    {
        $this->app_path = config('app.path');
    }

    public function getXMRTransfers(Request $request) {

        $r=$request->all();
        $validator = Validator::make($r, [
            'address' => [
                "required", Rule::exists('mongodb.pubxmrindex')
            ], 
            'pubhash' => [
                "required", Rule::exists('mongodb.identity')
            ]         
        ]);

        $start = microtime(true);
        $limit = 10;  // Seconds

        $response = new StreamedResponse();

        $result = array(
            'sales' => 0,      
        );

        
        if($validator->fails() )
        {
            $response->setCallback(function() {
                $result['notours'] = true;   
                echo 'data: ' . json_encode($result) . "\n\n";  
            });       
        } else {
            $pubindex = PubXMRIndex::where('account_index',21)->where('address', $r['address'])->first();      
            $identity = Identity::where('pubhash', $r['pubhash'])->first();
            if(isset($pubindex) && isset($identity)) {
                $index = $pubindex->address_index;                   
                $dataset = [];
                $response->setCallback(function() use ($r,$start,$limit,$pubindex,$identity, $index, $dataset) {  
                    do {
                        ob_start();                 
                        $result = shell_exec("/bin/bash " . $this->app_path . "scripts/monero/getransfers.sh " . $index . " 2>&1");
                        $dataset = json_decode($result,true)['result'];

                        if(empty($dataset)) {
                            $balance = shell_exec("/bin/bash " . $this->app_path . "scripts/monero/getbalance.sh " . $index . " 2>&1");
                            $bal = json_decode($balance,true)['result'];
                            if(!empty($bal)) {
                                $subbal = $bal['per_subaddress'][0];                         
                                echo 'data: ' . json_encode($subbal) . "\n\n";
                                ob_flush();                
                                flush();
                            } else {
                                echo 'data: ' . json_encode($balance) . "\n\n";
                            }                            
                        } else if(!empty($dataset)) {
                            $data = [];
                            if(isset($dataset['pool'])) {
                                $data = $dataset['pool'][0];
                            } else if(isset($dataset['in'])) {
                                $data = $dataset['in'][0];
                            }
                            $p = $identity->plan;
                            if(!empty($data) && $r['address'] === $data['address']) {
                                $hassale = Sales::where('address',$data['address'])->where('txid',$data['txid'])->first();
                                if(isset($hassale)) {
                                    if(isset($data['confirmations'])) {
                                        if($data['confirmations'] <= ($data['suggested_confirmations_threshold'] + 5)) {
                                            $hassale->confirmations = $data['confirmations'];
                                            $hassale->save();  
                                        }
                                    }
                                } else {
                                    $saledata = new Sales();
                                    $saledata->pubhash = $identity->pubhash;
                                    $saledata->address = $data['address'];
                                    $saledata->sales = $data['amount'];
                                    $saledata->txid = $data['txid'];
                                    $saledata->plan = $identity->plan;
                                    $saledata->timestamp = $data['timestamp'];
                                    $saledata->double_spend_seen = $data['double_spend_seen'];
                                    $saledata->confirmations = 0;
                                    $saledata->currency = 'XMR';                                
                                    $saledata->save();                  
                                }                                               
                            }
                            echo 'data: ' . json_encode($dataset) . "\n\n";
                        }
                        sleep(3);
                        ob_flush();                
                        flush();
                        if (connection_aborted()) { return;}                      
                        break;                     
                    } while (empty($dataset) && microtime(true) - $start <= $limit);
                });                   
            } else {
                $response->setCallback(function() {
                    $result['noid'] = true;
                    echo 'data: ' . json_encode($result) . "\n\n";
                });
            }           
        }
        $response->setStatusCode(200);
        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('X-Accel-Buffering', 'no');
        $response->headers->set('Cach-Control', 'no-cache');
        $response->headers->set ('Connection','keep-alive');
        $response->send();        
    }

    public function getConfirmations(Request $request) {
        $r=$request->all();        
       
        $sales = Sales::where('address',$r['address'])->where('txid',$r['txid'])->first();
        if(isset($sales)) {   
            $saleresult = array('address' => $sales->address,'txid' => $sales->txid,'confirmations' => $sales->confirmations);
            $pubindex = PubXMRIndex::where('account_index',21)->where('address', $r['address'])->first();        
            if(isset($pubindex)) {
                $index = $pubindex->address_index;
                $result = shell_exec("/bin/bash " . $this->app_path . "scripts/monero/getransfers.sh " . $index . " 2>&1");
                $dataset = json_decode($result,true)['result'];
                if(!empty($dataset)) {
                    $data = [];
                    if(isset($dataset['in'])) {
                        $data = $dataset['in'][0];
                        if(isset($data['confirmations'])) {
                            $sales->confirmations = $data['confirmations'];
                            $sales->save(); 
                            $saleresult['confirmations'] = $data['confirmations'];
                        }
                    }
                }
            }
            return response()->json($saleresult);
        } else {
            $result = array( 
                'fail' => true
            ); 
            return response()->json($result);
        }
    }

}
