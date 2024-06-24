<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Identity;
use App\Models\Sales;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Exception;
use App\Models\CryptoTicker;
use Illuminate\Support\Facades\Validator;
use MongoDB\Laravel\Validation;
use Illuminate\Validation\Rule;

class SalesController extends Controller
{

    private $pp;
    
    public function __construct()
    {
        $this->pp = [2, 10, 15];
    }


    public function fixPrice(Request $request) {

        $r=$request->all();
        $plan = $r['plan'];
        $num = $this->returnNumber($r['plan']);
        if($num >= 0 && $num <= 2) {
            $ticker = null; $usdValue = 0; $amount = 0;

            $identity = Identity::where('pubhash', $r['pubhash'])->first();

            $currticker = "ticker." . $r['currency'];
            $ticker = CryptoTicker::where($currticker, 'exists', true)->select($currticker .".usd")->first();
            $usdValue = $ticker[$currticker]['usd'];

            $amount = $this->getPrice($plan, $usdValue);
            
            $ip = $request->ip();
            $apiUrl = "https://api.findip.net/{$ip}/?token=91ea1275763d4e63b762fefac1606fd4";
            $apiresponse = false;

            $context = stream_context_create([
                'http' => [
                    'timeout' => 1, // Timeout set to 1 seconds
                ]
            ]);

            try {
                $apiresponse = file_get_contents($apiUrl, false, $context);
            } catch (Exception $e) {
                Log::info("API call to findip.net failed: " . $e->getMessage());
            }

            $country = '';
            if ($apiresponse !== false) {
                $ipset = json_decode($apiresponse,true);
                $country = (isset($ipset['country']) && $ipset['country'] && isset($ipset['country']['names']) && $ipset['country']['names'] && isset($ipset['country']['names']['en']) && $ipset['country']['names']['en']) ? $ipset['country']['names']['en'] : '';
            }
            $referrer = (isset($r['referer']) && $r['referer']) ? $r['referer'] : 'direct';

            $data = array(
                'plan' => $r['plan'],
                'fixprice' => ($r['currency'] === 'hive' || $r['currency'] === 'hive_dollar') ? round($amount, 3) : round($amount, 6),
                'usd'=> $usdValue,
                'currency' => 'XMR',
                'referrer' => $referrer,
                'country' => $country
            );

            if($identity) {
                $identity->plan = $data;
                $identity->save();
            }
           
           
            return response()->json(true);
        }
    }

    private function getPrice($plan, $usd) {
        switch ($plan) {                         
            case '0':
                $price = round($this->pp[0],2);
                return ($price/$usd);     
            case '1':
                $price = round($this->pp[1],2);
                return ($price/$usd);             
            case '2':
                $price = round($this->pp[2],2);
                return ($price/$usd);
            default:
                break;
        }
    }

    public function validatePlan(Request $request) {
        $r=$request->all();

        $validator = Validator::make($r, [
            'pubhash' => [
                "required", Rule::exists('mongodb.sales')
            ],
        ]);
        if(!$validator->fails()) {
            $sales = Sales::where('pubhash', $r['pubhash'])->where('txid', $r['txid'])->first();
        
            $identity = Identity::where('pubhash', $r['pubhash'])->first();

            $p = $sales->plan;
           
            $plan = (strpos($p['plan'], '-Day') !== false) ? 'Day' : $p['plan'];
            $fixed = $p['fixprice'];
            $currency = $sales->currency;
            $sale = $sales->sales;
            $paid = $sale / 1000000000000;

            $market = $p['usd'];
            $finalvalue = 0;
            $result = false;
            $planhours = 0;
           
            $pricedata = null;
            $std =$this->pp[0];
            switch ($plan) {
                case '0':
                    $finalvalue = $this->checkSlippage($fixed, $paid, $market);
                    $fullvalue = round($this->pp[0],2);
                    $price = $this->newPrice($fullvalue);;  
                    $result = ($finalvalue === true) ? $price : [$finalvalue,  (31 * $std), 31];
                    $planhours = (30 * 24) + 2;
                    break;
                case '1':
                    $finalvalue = $this->checkSlippage($fixed, $paid, $market);
                    $fullvalue = round($this->pp[1],2);  
                    $price = $this->newPrice($fullvalue);;                        
                    $result = ($finalvalue === true) ? $price : [$finalvalue, (365 * $std), 365];
                    $planhours = (365 * 24) + 5;
                    break;
                case '2':
                    $finalvalue = $this->checkSlippage($fixed, $paid, $market);
                    $fullvalue = round($this->pp[2], 2);
                    $price = $this->newPrice($fullvalue);;              
                    $result = ($finalvalue === true) ? $price : [$finalvalue, (365 * 5 * $std), 1825];
                    $planhours = (365 * 5 * 24) + 5;
                    break;               
                default:
                    break;
            }

            $data = $p;
            $issub = is_array($result);
            $substitute = null;
            if($issub) {
                $substitute = $this->substitutePlan($result[0], $result[1], $result[2]);
                array_push($result, $substitute);                
                $data['subplan'] = $substitute[0];
                $data['finalprice'] = $paid;
                $planhours = $substitute[1];         
            }
            $sales->plan = $data;
            $data['planid'] = $sales->_id;
            $sales->save();
            $newresult = array(
                'result' => $result,
                'data' => $sales
            );
            return response()->json($newresult);
        } else {
            Log::info('oops');         
        }
    }



    private function newPrice($price, $minPrice = 0.2) {
        $result;
        if ($price < $minPrice) {
            $result = $price;
        } else if (($price) >= $minPrice) {
            $result = $price;
        } else if (($price - $minPrice) <= $minPrice) {
            $result = $price - ($price - $minPrice);
        } else if (($minPrice) >= $price) {
            $result = 0.2;
        } else if (($price) <= $minPrice) {
            $result = $minPrice;
        } else {
            $result = $price;
        }
    
        $result = round($result,2);
        return $result;
    }


    private function returnNumber($str) {
        $num;
        if(!is_numeric($str)) {
            $num = preg_replace('/[^0-9.]/', '', $str);
            return floatval($num);
        }
        return floatval($str);
    }
    private function checkSlippage($fixedPrice, $paidPrice, $market) {
        $fp = floatval($fixedPrice);
        $tol = $fp * 0.02;
        $upperLimit = $fp + $tol;
        $lowerLimit = $fp - $tol;
    
        if ($paidPrice >= $lowerLimit && $paidPrice <= $upperLimit) {
            return true;
        } else {
            return round($paidPrice * $market, 2);
        }
    }

    private function substitutePlan($received, $expected, $totaldays) {

        $substitutedDays = round((($received * $totaldays) / $expected), 2);
        if ($substitutedDays >= 365) {
            $years = floor($substitutedDays / 365);
            $months = floor(($substitutedDays % 365) / 30);
            $days = $substitutedDays % 30;
            $pl = $years . "-Year " . $months . "-Month " . $days . "-Day";
            if($days == 0) {
                $pl =$years . "-Year " . $months . "-Month";
            }
            if($days == 0 && $months == 0) {
                $pl =$years . "-Year";
            }
            return [$pl, ((365 * $years * 24)+(30 * $months * 24)+($days * 24))];
        } else if ($substitutedDays >= 30) {
            $months = floor($substitutedDays / 30);
            $days = $substitutedDays % 30;
            $pl = $months . "-Month " . $days . "-Day";
            if($days == 0) {
                $pl = $months . "-Month";
            }
            return [$pl, ((30 * $months * 24)+($days * 24))];
        } else if ($substitutedDays < 1) {
            $hours = ceil($substitutedDays * 24);
            return [$hours . "-Hour", $hours];
        } else {
            $days = floor($substitutedDays);
            $hours = ceil(($substitutedDays - $days) * 24);
            $pl = $days . "-Day " . $hours . "-Hour";
            if($hours == 0) {
                $pl = $days . "-Day ";
            }
            return [$pl, (($days * 24)+$hours)];           
        }
    }

    private function derivePlanLength($epochend) {

        $today = Carbon::today();
        $currentDateTime = Carbon::now();
        $outstandingHours = $currentDateTime->diffInHours(Carbon::createFromTimestamp($epochend));
        $outstandingDays = round($outstandingHours / 24, 2);

        if ($outstandingDays >= 365) {
            $years = floor($outstandingDays / 365);
            $months = floor(($outstandingDays % 365) / 30);
            $days = $outstandingDays % 30;
            $pl = $years . "-Year " . $months . "-Month " . $days . "-Day";
            if($days == 0) {
                $pl =$years . "-Year " . $months . "-Month";
            }
            if($days == 0 && $months == 0) {
                $pl =$years . "-Year";
            } else if($month == 0) {
                $pl = $years . "-Year " . $days . "-Day";
            }
        } else if ($outstandingDays >= 30) {
            $months = floor($outstandingDays / 30);
            $days = $outstandingDays % 30;
            $pl = $months . "-Month " . $days . "-Day";
            if($days == 0) {
                $pl = $months . "-Month";
            }
        } else if ($outstandingDays < 1) {
            $hours = ceil($outstandingDays * 24);
            $pl = $hours . "-Hour";
        } else {
            $days = floor($outstandingDays);
            $hours = ceil(($outstandingDays - $days) * 24);
            $pl = $days . "-Day " . $hours . "-Hour";
            if($hours == 0) {
                $pl = $days . "-Day";
            } else if($hours == 24) {
                $days = $days + 1;
                $pl = $days . "-Day";
            }
        }
        return $pl;   
    }

}



