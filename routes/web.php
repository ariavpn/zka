<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Http\Controllers\WebAnalytics;

Route::group(['middleware' => ['web']], static function (): void {

    Route::get('/', function (Request $request) {
        if (!Cookie::has('visitor')) {    
            $uuid = (string) Str::uuid(); 
            Cookie::queue(Cookie::forever('visitor', $uuid));
        }
        if (!Cookie::has('client')) {    
            $uuid = (string) Str::uuid(); 
            Cookie::queue(Cookie::forever('client', $uuid));
        }
        return view('zka');
    })->name('home');
    
    Route::post('/visitorID', [App\Http\Controllers\RegisterController::class, 'visitorID']);
    Route::post('/updateID', [App\Http\Controllers\RegisterController::class, 'updateID']);        
    Route::post('/getIK', [App\Http\Controllers\ClientController::class, 'getIK']); 
    Route::post('/privateArea', [App\Http\Controllers\ClientController::class, 'privateArea']); 


    Route::get('/getFiatPrice', [App\Http\Controllers\CryptoController::class, 'getFiatPrice']);
    Route::post('/getCurrencyAddress', [App\Http\Controllers\CryptoController::class, 'getCurrencyAddress']);
    Route::post('/freeAddresses', [App\Http\Controllers\CryptoController::class, 'freeAddresses']);

    Route::post('/privateMode', [App\Http\Controllers\AdminController::class, 'privateMode']);

    Route::post('/fixPrice', [App\Http\Controllers\SalesController::class, 'fixPrice']);
    Route::post('/validatePlan', [App\Http\Controllers\SalesController::class, 'validatePlan']);

    Route::get('/getXMRTransfers', [App\Http\Controllers\MoneroController::class, 'getXMRTransfers']);
    Route::post('/getConfirmations', [App\Http\Controllers\MoneroController::class, 'getConfirmations']);

    Route::post('/createID', [App\Http\Controllers\RegisterController::class, 'createID']);

    Route::post('/errorLog', [App\Http\Controllers\AffiliateController::class, 'errorLog']);


    Route::post('/anonAccess', [App\Http\Controllers\WebAnalytics::class, 'anonAccess']);
    Route::get('/unloadAnon', [App\Http\Controllers\WebAnalytics::class, 'unloadAnon']);
});

// Auth::routes(['register' => false])

Route::get('/{any}', function (Request $request) {
    $uri = $request->getPathInfo();
    Cookie::queue(Cookie::make('route', $uri, 10));
    return redirect()->route('home')->withoutMiddleware('web');
});