<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Actions\Fortify\UpdateUserPassword;
use App\Actions\Fortify\UpdateUserProfileInformation;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Actions\RedirectIfTwoFactorAuthenticatable;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Contracts\LoginResponse;
use Laravel\Fortify\Contracts\RegisterResponse;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse;
use Laravel\Fortify\Contracts\LogoutResponse;

class FortifyServiceProvider extends ServiceProvider
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
        Fortify::createUsersUsing(CreateNewUser::class);
        Fortify::updateUserProfileInformationUsing(UpdateUserProfileInformation::class);
        Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::redirectUserForTwoFactorAuthenticationUsing(RedirectIfTwoFactorAuthenticatable::class);

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });

        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        Fortify::authenticateUsing(function (Request $request) {
            $user = User::where('email', $request->email)->first();

            if (! $user || ! Hash::check($request->password, $user->password)) {
                return null;
            }

            if (
                strtolower((string) $user->role) === 'barangay_admin'
                && (
                    strtolower((string) $user->status) === 'pending'
                    || empty($user->email_verified_at)
                )
            ) {
                throw ValidationException::withMessages([
                    'email' => 'Please verify your email before logging in. Check your inbox for the verification link.',
                ]);
            }

            return $user;
        });

        // Force explicit redirects based on role, ignoring "intended" URLs
        $this->app->singleton(LoginResponse::class, function () {
            return new class implements LoginResponse {
                public function toResponse($request) {
                    $role = strtolower(auth()->user()->role ?? '');
                    $redirectPath = ($role === 'superadmin') ? '/superadmin/dashboard' : '/dashboard';

                    return $request->wantsJson()
                        ? response()->json(['two_factor' => false])
                        : redirect($redirectPath);
                }
            };
        });

        $this->app->singleton(RegisterResponse::class, function () {
            return new class implements RegisterResponse {
                public function toResponse($request) {
                    $role = strtolower(auth()->user()->role ?? '');
                    $redirectPath = ($role === 'superadmin') ? '/superadmin/dashboard' : '/dashboard';

                    return $request->wantsJson()
                        ? response()->json(['two_factor' => false])
                        : redirect($redirectPath);
                }
            };
        });

        $this->app->singleton(TwoFactorLoginResponse::class, function () {
            return new class implements TwoFactorLoginResponse {
                public function toResponse($request) {
                    $role = strtolower(auth()->user()->role ?? '');
                    $redirectPath = ($role === 'superadmin') ? '/superadmin/dashboard' : '/dashboard';

                    return $request->wantsJson()
                        ? response()->json([], 204)
                        : redirect($redirectPath);
                }
            };
        });

        $this->app->singleton(LogoutResponse::class, function () {
            return new class implements LogoutResponse {
                public function toResponse($request) {
                    $guard = Auth::guard();
                    $recallerName = method_exists($guard, 'getRecallerName')
                        ? $guard->getRecallerName()
                        : null;

                    $response = $request->wantsJson()
                        ? response()->json([], 204)
                        : redirect('/login');

                    $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate');
                    $response->headers->set('Pragma', 'no-cache');
                    $response->headers->set('Expires', 'Sat, 01 Jan 2000 00:00:00 GMT');

                    $response->withCookie(cookie()->forget(config('session.cookie')));
                    $response->withCookie(cookie()->forget('XSRF-TOKEN'));
                    $response->withCookie(cookie()->forget('laravel_session'));

                    if ($recallerName) {
                        $response->withCookie(cookie()->forget($recallerName));
                    }

                    foreach (array_keys($request->cookies->all()) as $cookieName) {
                        $response->withCookie(cookie()->forget($cookieName));
                    }

                    return $response;
                }
            };
        });
    }
}
