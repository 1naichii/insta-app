<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimiting();
    }

    /**
     * Configure application rate limiters.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('auth-actions', function (Request $request): Limit {
            if (app()->environment('e2e')) {
                return Limit::none();
            }

            $route = $request->route();
            $routeName = is_object($route) ? $route->getName() : null;

            return match ($routeName) {
                'register.store' => Limit::perMinute(5)->by('registration:'.$request->ip()),
                'password.email' => Limit::perMinute(3)->by('password-reset:'.$request->ip()),
                default => Limit::none(),
            };
        });

        RateLimiter::for('posts', function (Request $request): Limit {
            if (app()->environment('e2e')) {
                return Limit::none();
            }

            $key = $request->user()?->getAuthIdentifier() ?? $request->ip();

            return Limit::perMinute(10)->by('posts:'.$key);
        });

        RateLimiter::for('comments', function (Request $request): Limit {
            if (app()->environment('e2e')) {
                return Limit::none();
            }

            $key = $request->user()?->getAuthIdentifier() ?? $request->ip();

            return Limit::perMinute(30)->by('comments:'.$key);
        });

        RateLimiter::for('likes', function (Request $request): Limit {
            if (app()->environment('e2e')) {
                return Limit::none();
            }

            $key = $request->user()?->getAuthIdentifier() ?? $request->ip();

            return Limit::perMinute(120)->by('likes:'.$key);
        });

        RateLimiter::for('profile-updates', function (Request $request): Limit {
            if (app()->environment('e2e')) {
                return Limit::none();
            }

            $key = $request->user()?->getAuthIdentifier() ?? $request->ip();

            return Limit::perMinute(20)->by('profile-updates:'.$key);
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
