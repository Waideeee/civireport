<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class FastApiHealthCheck
{
    /**
     * Ping FastAPI before serving pages that depend on it.
     * If FastAPI is down, redirect with a friendly error instead of crashing.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $baseUrl = env('FASTAPI_URL', 'http://127.0.0.1:8000');

        try {
            $response = Http::timeout(3)->get("{$baseUrl}/");

            if (!$response->successful()) {
                return $this->unavailable($request);
            }
        } catch (\Exception $e) {
            return $this->unavailable($request);
        }

        return $next($request);
    }

    private function unavailable(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'error' => 'Backend service is currently unavailable. Please try again later.',
            ], 503);
        }

        return redirect()->back()->withErrors([
            'service' => 'The backend service is currently unavailable. Please try again later.',
        ]);
    }
}