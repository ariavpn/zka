#!/bin/bash
php artisan optimize:clear
systemctl restart php8.3-fpm.service
php artisan config:cache



