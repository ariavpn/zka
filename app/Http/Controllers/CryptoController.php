<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PubXMRIndex;
use App\Models\CryptoTicker;
use Codenixsv\CoinGeckoApi\CoinGeckoClient;
use Carbon\Carbon;
use App\Models\Sales;
use Exception;

class CryptoController extends Controller
{

    private $app_path;

    public function __construct()
    {
        $this->app_path = config('app.path');
    }

    public function getFiatPrice() {
        $ticker = CryptoTicker::first();

        if($ticker) {
            $lastdt = $ticker->updated_at;
            $nowMinus10Seconds = Carbon::now()->subSeconds(10);
            if ($lastdt > $nowMinus10Seconds) {
                return response()->json($ticker);
            } else {
                $getgecko = null;
                try { $getgecko = $this->gecko($ticker); } catch (Exception $e) {}
                if($getgecko) {
                    return $getgecko;
                } else {
                    return response()->json($ticker);
                }                    
            }
        } else {
            $getgecko = null;
            try { $getgecko = $this->gecko($ticker); } catch (Exception $e) {}
            return $getgecko;
        }
    }

    private function gecko($ticker = false){
        $client = new CoinGeckoClient();
        $data = $client->simple()->getPrice('monero','usd');

        if($ticker)  {
            $ticker->ticker = $data;
            $ticker->save();
        } else {
            $cryptoticker = new CryptoTicker();
            $cryptoticker->ticker = $data;
            $cryptoticker->save();
        }
        return response()->json($data);
    }

    public function freeAddresses(Request $request) {
        $data=$request->all();
                
        if(isset($data['XMR'])) {      
            $pubindex = PubXMRIndex::where('address', $data['XMR'])->first();
            $sales = Sales::where('address', $data['XMR'])->first();          
            if($pubindex && !$sales) { 
                $pubindex->inuse = 0;
                $pubindex->save();
            }
        }
        
        return response()->json(true);
    }


    public function getCurrencyAddress(Request $request) {
        
       $r=$request->all();
       $currency = $r['currency'];
        $address = null;
        $pubindex = PubXMRIndex::where('account_index',21)->where('inuse', 0)->first();
        if(isset($pubindex)) {
            $pubindex->inuse = 1;
            $pubindex->save();
            $hasvpn = Sales::where('address',$pubindex->address)->first(); 
            if(!$hasvpn) {
                $address = $pubindex->address;
            }
        }
        if(!$address){
            $result = shell_exec("/bin/bash " . $this->app_path . "scripts/monero/createaddress.sh 2>&1");             
            $dataset = (json_decode($result,true)['result']) ? json_decode($result,true)['result'] : $result['result'];
            $address_index = $dataset['address_index'];
            $address = $dataset['address'];
            $pubindex = new PubXMRIndex();                   
            $pubindex->address = $address;
            $pubindex->address_index = $address_index;
            $pubindex->account_index = 21;
            $pubindex->inuse = 1;
            $pubindex->save();
        }
        $response = array('result' => $address);
        return response()->json($response);
        
        $response = array('result' => false);
        return response()->json($response);
       

    }

}
