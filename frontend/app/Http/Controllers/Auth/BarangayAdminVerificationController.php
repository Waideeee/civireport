<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\FastApiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class BarangayAdminVerificationController extends Controller
{
    public function verify(string $token, FastApiService $api): RedirectResponse|View
    {
        $response = $api->verifyBarangayAdminEmail($token);

        if ($response['successful']) {
            return redirect('/login')->with('status', 'Your email has been verified. You can now log in.');
        }

        return view('auth.verify-email-token', [
            'email' => null,
            'errorMessage' => $response['data']['detail'] ?? 'Verification link is invalid or has expired.',
        ]);
    }

    public function resend(Request $request, FastApiService $api): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $response = $api->resendBarangayAdminVerification($validated['email']);

        if ($response['successful']) {
            return back()->with('status', $response['data']['message'] ?? 'A new verification email has been sent.');
        }

        return back()
            ->withInput()
            ->withErrors([
                'email' => $response['data']['detail'] ?? 'Unable to resend verification email.',
            ]);
    }
}
