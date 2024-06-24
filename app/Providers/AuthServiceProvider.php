<?php

namespace App\Providers;
use App\Models\Identity;
use App\Services\TokenManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        //    Playlist::class => PlaylistPolicy::class
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        Auth::viaRequest('token-via-query-parameter', static function (Request $request): ?Identity {
            /** @var TokenManager $tokenManager */
            $tokenManager = app(TokenManager::class);
            return $tokenManager->getUserFromPlainTextToken($request->api_token ?: '');
        });
    }
}
