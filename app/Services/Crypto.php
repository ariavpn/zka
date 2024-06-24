<?php

namespace App\Services;

use Intervention\Image\Constraint;
use Intervention\Image\ImageManager;
use Illuminate\Support\Facades\Log;

class Crypto
{
    // compatible with ann.cryptoJSAesDecrypt (see annika.js)
    public static function cryptoJSAesEncrypt($plain_text, $passphrase){
        $salt = openssl_random_pseudo_bytes(256);
        $iv = openssl_random_pseudo_bytes(16);    
        $iterations = 999;  
        $key = hash_pbkdf2("sha512", $passphrase, $salt, $iterations, 64);    
        $encrypted_data = openssl_encrypt($plain_text, 'aes-256-cbc', hex2bin($key), OPENSSL_RAW_DATA, $iv);    
        $data = array("ciphertext" => base64_encode($encrypted_data), "iv" => bin2hex($iv), "salt" => bin2hex($salt));
        return json_encode($data);
    }
    
    // compatible with ann.cryptoJSAesEncrypt (see annika.js)
    public static function cryptoJSAesDecrypt($jsonString,$passphrase){
        $jsondata = json_decode($jsonString, true);
        try {
            $salt = hex2bin($jsondata["salt"]);
            $iv  = hex2bin($jsondata["iv"]);          
        } catch(Exception $e) { return null; }
        $ciphertext = base64_decode($jsondata["ciphertext"]);
        $iterations = 999; //same as js encrypting 
        $key = hash_pbkdf2("sha512", $passphrase, $salt, $iterations, 64);
        $decrypted= openssl_decrypt($ciphertext , 'aes-256-cbc', hex2bin($key), OPENSSL_RAW_DATA, $iv);
        return $decrypted;
    }
}
