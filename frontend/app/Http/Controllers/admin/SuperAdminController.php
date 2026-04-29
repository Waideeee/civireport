<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\FastApiService;

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

    public function deactivate($id)
    {
        $this->api->updateUserStatus($id, ['status' => 'deactivated']);
        return back()->with('success', 'Barangay admin deactivated.');
    }

    public function activate($id)
    {
        $this->api->updateUserStatus($id, ['status' => 'active']);
        return back()->with('success', 'Barangay admin reactivated.');
    }

    public function destroy($id)
    {
        $this->api->deleteUser($id);
        return back()->with('success', 'Barangay admin deleted.');
    }
}
