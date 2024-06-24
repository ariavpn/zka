<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WebAnalyticsModel;
use Jenssegers\Agent\Agent;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cookie;
use Exception;

class WebAnalytics extends Controller
{   
    
    public function unloadAnon() {

        if (Cookie::has('visitor')) {
            $uuid = Cookie::get('visitor');
            $visitor = WebAnalyticsModel::where('uuid',$uuid)->latest()->first();
            if(isset($visitor)) {
                $dateTime = Carbon::now();
                $timeonsite = $dateTime->timestamp - $visitor->timestamp;
                $visitor->timeonsite = $timeonsite;
                $visitor->save();
            }
        }            
    }

    public function anonAccess(Request $request) {

        $data=$request->all();

        $ip = $request->ip(); 
        $apiUrl = "https://api.findip.net/{$ip}/?token=91ea1275763d4e63b762fefac1606fd4";
        $response = false;

        $context = stream_context_create([
            'http' => [
                'timeout' => 1, // Timeout set to 1 seconds
            ]
        ]);

        $response = @file_get_contents($apiUrl, false, $context);

        if (!$response || $response === false) {
            // $error = error_get_last();
            // throw new Exception("API call to findip.net failed: " . $error['message']);
        } else {
            $agent = new Agent();
            $visitor = new WebAnalyticsModel();
            $uuid = null;
            if (Cookie::has('visitor')) {
                $uuid = Cookie::get('visitor');
            }
            $visitor->uuid = $uuid;  
            if(!$agent->isRobot()) {           
                $ipset = json_decode($response,true);
                $data['country'] = (isset($ipset['country']['names']['en'])) ? $ipset['country']['names']['en'] : '';
                $data['connection_type'] = (isset($ipset['traits']['connection_type'])) ? $ipset['traits']['connection_type'] : '';
                $data['user_type'] = (isset($ipset['traits']['user_type'])) ? $ipset['traits']['user_type'] : '';
                $data['city'] = (isset($ipset['city']['names']['en'])) ? $ipset['city']['names']['en'] : '';
                $data['latitude'] = (isset($ipset['location']['latitude'])) ? $ipset['location']['latitude'] : '';
                $data['longitude'] = (isset($ipset['location']['longitude'])) ? $ipset['location']['longitude'] : '';
                $data['isp'] = (isset($ipset['traits']['isp'])) ? $ipset['traits']['isp'] : '';       
                $platform = $agent->platform();
                $version = $agent->version($platform); 
                $dateTime = Carbon::now();
                if($agent->isMobile()) {
                    $data['device_type'] = "is_mobile";
                } else if($agent->isDesktop()) {
                    $data['device_type'] = "is_desktop";
                } else if($agent->isTablet()) {
                    $data['device_type'] = "is_tablet";
                }           
                $visitor->browser = $agent->browser();
                $visitor->platform = $platform;
                $visitor->platformversion = $version;
                $visitor->device = $agent->device();
                $visitor->devicetype = (isset($data['device_type'])) ? $data['device_type'] : '';
                $visitor->resolution =  (isset($data['resolution'])) ? $data['resolution'] : '';
                $visitor->usertype = $data['user_type'];
                $visitor->connectiontype = $data['connection_type'];
                $visitor->isp =  $data['isp'];
                $visitor->country =  $data['country'];
                $visitor->city =  $data['city'];           
                $visitor->latitude = $data['latitude'];
                $visitor->longitude = $data['longitude'];
                $visitor->referer = (isset($data['referer'])) ? $data['referer'] : 'direct';   
            } else {
                $visitor->isbot = 1;
                $visitor->botip = $request->ip();
                $visitor->bottype = $agent->robot();
            }
            $route = null;       
            if (Cookie::has('route')) {
                $route = Cookie::get('route');
            }
            $visitor->route = $route;        
            $visitor->timestamp = $dateTime->timestamp;
            $visitor->save();
            return response()->json($visitor);                  
        }        
    }
}
