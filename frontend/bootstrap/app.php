<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo('/login');
        $middleware->redirectUsersTo(function() {
            $role = strtolower(auth()->user()->role ?? '');
            if ($role === 'superadmin') {
                return '/superadmin/dashboard';
            }
            return '/dashboard';
        });

        $middleware->alias([
            'admin'            => \App\Http\Middleware\AdminMiddleware::class,
            'superadmin'       => \App\Http\Middleware\SuperAdminMiddleware::class,
            'active.user'      => \App\Http\Middleware\EnsureUserIsActive::class,
            'ensure.authenticated' => \App\Http\Middleware\EnsureAuthenticatedSession::class,
            'fastapi.health'   => \App\Http\Middleware\FastApiHealthCheck::class,
            'no.cache'         => \App\Http\Middleware\PreventBackHistory::class,
        ]);

        // Apply active user check globally to all web routes
        $middleware->appendToGroup('web', \App\Http\Middleware\EnsureUserIsActive::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
