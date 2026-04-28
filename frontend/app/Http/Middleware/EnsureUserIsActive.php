<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class EnsureUserIsActive
{
    /**
     * Handle an incoming request.
     * Blocks users whose account is not active (rejected/pending/banned).
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (
            Auth::check()
            && strtolower((string) (Auth::user()->role ?? '')) === 'barangay_admin'
            && (
                strtolower((string) (Auth::user()->status ?? '')) === 'pending'
                || empty(Auth::user()->email_verified_at)
            )
        ) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/login')->withErrors([
                'email' => 'Please verify your email before logging in. Check your inbox for the verification link.',
            ]);
        }

        if (Auth::check() && !Auth::user()->is_active) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/login')->withErrors([
                'email' => 'Your account is inactive or has been rejected. Please contact support.',
            ]);
        }

        return $next($request);
    }
}
