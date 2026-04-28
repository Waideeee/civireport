<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     * Ensures the authenticated user has an elevated admin role.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return redirect('/login');
        }

        $role = strtolower(auth()->user()->role ?? '');
        if (! in_array($role, ['admin', 'barangay_admin', 'superadmin'], true)) {
            abort(403, 'Unauthorized. Access restricted to administrators.');
        }

        return $next($request);
    }
}
