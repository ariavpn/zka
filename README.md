# AriaVPN | Zero Knowledge Architecture

Say goodbye to passwords, usernames, and personal data on third-party servers.

## DEMO

[zka.ariavpn.net](https://zka.ariavpn.net)

## Prerequisites

-   PHP '^8.3'
```
sudo apt install openssl php php-cli php-common php-fpm php-gd php-bcmath php-curl php-xml php-json php-mbstring php-tokenizer php-xml php-zip php-mysql php-mongodb
```
-   MongoDB

follow the instructions at [https://www.mongodb.com/docs/manual/administration/install-community](https://www.mongodb.com/docs/manual/administration/install-community) 

-   composer
```
  sudo apt install curl git unzip
  php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" 
  php composer-setup.php --install-dir=/usr/local/bin --filename=composer
  chmod +x /usr/local/bin/composer
```

## Components

LARAVEL BACK END

```
.env.example
resources/views/zka.blade.php
routes/web.php
app/Models/*
app/Http/Controllers/*
```

ANNIKA JS LIBRARY

```
public/js/annika/annika.js
```
To learn Annika, our [online documentation](https://annika.anne.media) is the best place to go.


3RD PARTY JS LIBRARIES

```
public/js/libs/*
```

## Initiation

```
git clone https://github.com/ariavpn/zka.git
composer install
php artisan key:generate
```

- To see an app in the web browser, in the terminal run...

```
php artisan serve
```

You can now access AriaVPN's ZKA site at `http://127.0.0.1:8000`

## Features

### Trustless Registration & Authentication

AriaVPN delivers a complete registration and authentication cryptographic process to register a user's identity.

Upon loading the webpage, each visitor gets a unique private key (PK) generated on the client's end. At first, the PK is stored in local storage and not shown to the user unless needed. A cryptographic set, as defined in the Cryptographic Proofs section, is generated in the background during page load if the set does not already exist for the particular PK.

The process can be divided into two parts. On the client side, a Public Key (pubkey) is derived from the PK, and the SHA256 sum of the pubkey is computed to create pubhash. The SHA256 sum of the PK is also computed, known as the Reference Key. On the server side, a CSRF token and client UUID are generated, stored in the identity collection, and as encrypted cookies.

The second part of the process may happen during page load or later. This part involves the encrypted count of iterations used to encrypt the IK, the IK itself, the Sanctum token, and the Reference Key 2. The latter two records may be needed, depending on your business logic.

When a user accesses a protected area for the first time, the PK is retrieved from local storage and shown to the user. The user is prompted to retain the PK and keep it safe. After the user copies the PK, the system asks the user to choose a PIN. When entered, the PK is stored encrypted by the PIN in the local storage, and the plain PK is removed.

The PK is then used to encrypt a concatenation of pubkey and server message (for example, this can be a hash of collection object ID), producing an IK stored on the server but not directly shown to the user. Each time we need to verify the user's identity, we transmit the IK to the client side. The user retrieves their encrypted PK from local storage, decrypts it with their PIN, decrypts the IK with their PK, and transmits back a hash of the secret server message it contains, thus allowing us to validate the user's identity on the server side.

We never see or keep a copy of the PK, pubkey, or PIN. We only store the PK encrypted by the PIN in the local storage and store all cryptographic proofs and tokens in our database.

 ![alt text](https://annika.anne.media/img/annikaminibanner.png)

## Buy us a bun & coffee 💙

XMR: 83NLDsw4ENAP9FAbLCnRazjbcjnaK2ccthffNgVMwXjkLfaw9uBbkVBLXvj68M82wZDHGFaH7rJxf5bX4ByjSyX7ALUdQEe

## Social

Gives us a follow at [@ariavpn_net](https://x.com/ariavpn_net) to keep in touch with the lastest.

[AriaVPN](https://ariavpn.net) - The Ultimate Armor for Your Digital Footprint


