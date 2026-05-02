<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\FastApiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SuperAdminController extends Controller
{
    protected $api;

    public function __construct(FastApiService $api)
    {
        $this->api = $api;
    }

    public function index()
    {
        try {
            $stats = $this->api->getSuperAdminStats() ?? [
                'active_admins' => 0,
                'inactive_admins' => 0,
                'total_residents' => 0,
                'total_complaints' => 0,
            ];
            $rawAdmins = $this->api->getAllAdmins() ?? [];
            $allAdmins = array_slice(array_filter($rawAdmins, function ($admin) {
                $status = strtolower((string) ($admin['status'] ?? ''));
                return in_array($status, ['active', 'approved', 'deactivated', 'inactive', 'resolved'], true)
                    || (bool) ($admin['is_active'] ?? false);
            }), 0, 5);
        } catch (\Exception $e) {
            $stats = [
                'active_admins' => 0,
                'inactive_admins' => 0,
                'total_residents' => 0,
                'total_complaints' => 0,
            ];
            $allAdmins = [];
        }

        return view('pages.superadmin.dashboard', compact('stats', 'allAdmins'));
    }

    public function admins()
    {
        try {
            $allAdmins = $this->api->getAllAdmins() ?? [];
        } catch (\Exception $e) {
            $allAdmins = [];
        }
        return view('pages.superadmin.admins', compact('allAdmins'));
    }


    public function auditLog()
    {
        return view('pages.superadmin.AuditLogs');
    }

    protected function handleActionResponse(array $response, string $successMessage): RedirectResponse
    {
        if (! ($response['successful'] ?? false)) {
            $message = $response['data']['detail']
                ?? $response['data']['message']
                ?? 'The superadmin action could not be completed.';

            return back()->with('error', $message);
        }

        return back()->with('success', $successMessage);
    }

    public function deactivate(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ], [
            'reason.required' => 'Please provide a reason for deactivation.',
        ]);

        $response = $this->api->deactivateAdminAccount($id, [
            'reason' => $validated['reason'],
            'deactivated_by' => Auth::id(),
        ]);

        return $this->handleActionResponse($response, 'Admin account has been deactivated successfully.');
    }

    public function activate($id)
    {
        $response = $this->api->updateUserStatus($id, ['status' => 'approved']);

        return $this->handleActionResponse($response, 'Barangay admin reactivated.');
    }

    public function destroy($id)
    {
        $response = $this->api->deleteUser($id);

        return $this->handleActionResponse($response, 'Barangay admin deleted.');
    }
}
