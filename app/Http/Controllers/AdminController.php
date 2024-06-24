<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Identity;
use App\Models\FAQ;
use App\Models\ErrorLog;
use App\Models\Contact;
use App\Models\Visitor;
use App\Models\Redeem;
use App\Models\PubIndex;
use App\Models\PubMIndex;
use App\Models\Sales;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\IPBlacklist;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Exception;
use App\Models\CryptoTicker;
use Illuminate\Support\Facades\Validator;
use MongoDB\Laravel\Validation;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Cookie;
use App\Services\Crypto;
use Jenssegers\Agent\Agent;


class AdminController extends Controller
{

    public function privateMode(Request $request) {
        $data=$request->all();
        $result = [];

        if(hash('sha256',"16Eiv7F6EmKD1wkX2QjdD7nWjmqy99") === $data['pass']) {
            $result = array(
                'scripts' => ['libs/dexie.js', 'libs/qrcode.js','dbmodel-min.js', 'libs/qrcode.js', 'libs/aesjs.js', 'libs/bitcoin.js','libs/crypto-js.min.js','app.js']
            );
        } else {
            $result = array(
                'fail' => true
            );
        }
        return response()->json($result);
    }
}
