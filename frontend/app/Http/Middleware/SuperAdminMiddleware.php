<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminMiddleware
{
    /**
     * Handle an incoming request.
     * Ensures the authenticated user has the 'superadmin' role.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return redirect('/login');
        }

        if (strtolower(auth()->user()->role) !== 'superadmin') {
            abort(403, 'Unauthorized. Super Admin access only.');
        }

        return $next($request);
    }
}
