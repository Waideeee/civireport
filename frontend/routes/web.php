<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AnnouncementController;
use App\Http\Controllers\Admin\ComplaintController;
use App\Http\Controllers\Auth\BarangayAdminVerificationController;

Route::get('/', function () {
    return view('welcome');
});


Route::get('/verify-email/{token}', [BarangayAdminVerificationController::class, 'verify'])
    ->name('barangay-admin.verification.verify');

Route::post('/verify-email/resend', [BarangayAdminVerificationController::class, 'resend'])
    ->name('barangay-admin.verification.resend');

Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_session'),
    'ensure.authenticated',
    'verified',
    'admin',
    'active.user',
    'no.cache',
])->group(function () {

    // Dashboard
    Route::get('/dashboard', [App\Http\Controllers\Admin\DashboardController::class, 'index'])
        ->name('dashboard');

    // Dashboard API proxy routes (FastAPI health check applied)
    Route::middleware('fastapi.health')->group(function () {

        Route::get('/api/dashboard/complaint-stats', function () {
            $api = app(App\Services\FastApiService::class);
            return response()->json($api->getDashboardComplaintStats());
        });

        Route::get('/api/dashboard/pending-users', function () {
            $api = app(App\Services\FastApiService::class);
            return response()->json($api->getDashboardPendingUsers());
        });

        Route::get('/api/dashboard/registered-users', function () {
            $api = app(App\Services\FastApiService::class);
            return response()->json($api->getDashboardRegisteredUsers());
        });

        Route::get('/api/complaints', function () {
            $api = app(App\Services\FastApiService::class);
            return response()->json($api->getComplaints());
        });

        Route::patch('/api/complaints/{id}/status', function ($id, \Illuminate\Http\Request $request) {
            $api = app(App\Services\FastApiService::class);
            $payload = $request->all();
            $payload['admin_id'] = auth()->id();
            $result = $api->updateComplaintStatus(
                $id,
                $payload['complaint_status'] ?? $payload['status'] ?? $request->complaint_status ?? $request->status,
                $payload['admin_id'],
                $payload['rejection_reason'] ?? null,
                $payload['action_proof'] ?? null,
                $payload['action_proof_name'] ?? null,
                $payload['resolved_notes'] ?? null
            );

            return response()->json(
                $result['data'] ?? ['detail' => 'Failed to update complaint status.'],
                $result['status'] ?? 422
            );
        });

        Route::get('/api/audit-logs', function () {
            $api = app(App\Services\FastApiService::class);
            return response()->json($api->getAuditLogs());
        });

        Route::get('/api/analytics', function () {
            $api = app(App\Services\FastApiService::class);
            return response()->json($api->getAnalytics());
        });

        Route::get('/api/analytics/insight', function () {
            $api = app(App\Services\FastApiService::class);
            return response()->json($api->getAnalyticsInsight());
        });

        Route::get('/api/announcements', function () {
            $api = app(App\Services\FastApiService::class);
            return response()->json($api->getAnnouncements());
        });

        Route::post('/api/announcements', function (\Illuminate\Http\Request $request) {
            $api = app(App\Services\FastApiService::class);
            $data = $request->all();
            $data['admin_id'] = auth()->id();
            return response()->json($api->createAnnouncement($data));
        });

        Route::put('/api/announcements/{id}', function ($id, \Illuminate\Http\Request $request) {
            $api = app(App\Services\FastApiService::class);
            $data = $request->all();
            $data['admin_id'] = auth()->id();
            return response()->json($api->updateAnnouncement($id, $data));
        });
        Route::get('/api/emergencies', function () {
            $api = app(App\Services\FastApiService::class);
            return response()->json($api->getEmergencies());
        });

        Route::get('/api/emergencies/pending', function () {
            $api = app(App\Services\FastApiService::class);
            return response()->json($api->getPendingEmergencies());
        });

        Route::patch('/api/emergencies/{id}/status', function ($id, \Illuminate\Http\Request $request) {
            $api = app(App\Services\FastApiService::class);
            $payload = $request->all();
            $payload['admin_id'] = auth()->id();
            return response()->json($api->updateEmergencyStatus($id, $payload));
        });

        Route::get('/api/notifications/complaints/latest', function () {
            $api = app(App\Services\FastApiService::class);
            return response()->json($api->getLatestComplaintNotification());
        });

        Route::get('/api/notifications/users/latest', function () {
            $api = app(App\Services\FastApiService::class);
            return response()->json($api->getLatestUserNotification());
        });

        Route::patch('/api/notifications/complaints/{id}/notified', function ($id) {
            $api = app(App\Services\FastApiService::class);
            return response()->json($api->markComplaintNotified($id));
        });

        Route::patch('/api/notifications/users/{id}/notified', function ($id) {
            $api = app(App\Services\FastApiService::class);
            return response()->json($api->markUserNotified($id));
        });
    });


    // Complaints
    Route::get('/Complaints', [App\Http\Controllers\Admin\ComplaintController::class, 'index'])
        ->name('Complaints');
    Route::get('/Complaints/{id}', [App\Http\Controllers\Admin\ComplaintController::class, 'show'])
        ->name('Complaints.show');
    Route::patch('/Complaints/{id}/status', [App\Http\Controllers\Admin\ComplaintController::class, 'updateStatus'])
        ->name('Complaints.updateStatus');

    // Announcements
    Route::get('/Announcements', [AnnouncementController::class, 'index'])
        ->name('Announcements');
    Route::get('/Announcements/create', [AnnouncementController::class, 'create'])
        ->name('announcements.create');
    Route::post('/Announcements', [AnnouncementController::class, 'store'])
        ->name('announcements.store');
    Route::get('/Announcements/{id}/edit', [AnnouncementController::class, 'edit'])
        ->name('announcements.edit');
    Route::put('/Announcements/{id}', [AnnouncementController::class, 'update'])
        ->name('announcements.update');
    Route::delete('/Announcements/{id}', [AnnouncementController::class, 'destroy'])
        ->name('announcements.destroy');

    // User Records
    Route::get('/UserRecords', [App\Http\Controllers\Admin\UserController::class, 'index'])
        ->name('UserRecords');
    Route::get('/UserRecords/{id}', [App\Http\Controllers\Admin\UserController::class, 'show'])
        ->name('UserRecords.show');
    Route::patch('/UserRecords/users/{id}/status', [App\Http\Controllers\Admin\UserController::class, 'updateStatus'])
        ->name('UserRecords.status');

    // Audit Log
    Route::get('/AuditLog', [App\Http\Controllers\Admin\AuditLogController::class, 'index'])
        ->name('AuditLog');

    // Report Analytics
    Route::get('/ReportAnalytics', [App\Http\Controllers\Admin\ReportAnalyticsController::class, 'index'])
        ->name('ReportAnalytics');

    // Emergency Reports
    Route::get('/EmergencyReports', [App\Http\Controllers\Admin\EmergencyReportController::class, 'index'])
        ->name('EmergencyReports');

    Route::get('/Complaints/{id}/download', [ComplaintController::class, 'downloadComplaint'])
        ->name('Complaints.download');
});

// Super Admin Routes
Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_session'),
    'ensure.authenticated',
    'verified',
    'superadmin',
    'active.user',
    'no.cache',
])->prefix('superadmin')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\Admin\SuperAdminController::class, 'index'])
        ->name('superadmin.dashboard');

    Route::get('/admins', [App\Http\Controllers\Admin\SuperAdminController::class, 'admins'])
        ->name('superadmin.admins');

    Route::get('/audit-log', [App\Http\Controllers\Admin\SuperAdminController::class, 'auditLog'])
        ->name('superadmin.audit_log');

    Route::get('/proxy/audit-logs', function(\Illuminate\Http\Request $request, App\Services\FastApiService $api) {
        try {
            $params = array_filter($request->only([
                'page',
                'per_page',
                'search',
                'date_from',
                'date_to',
                'status',
            ]), fn($v) => $v !== null && $v !== '');
            $result = $api->getSuperAdminAuditLogs($params);
            return response()->json($result ?? ['data' => [], 'total' => 0, 'page' => 1, 'per_page' => 20]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Superadmin audit log proxy error: ' . $e->getMessage());
            return response()->json(['data' => [], 'total' => 0, 'page' => 1, 'per_page' => 20]);
        }
    })->name('superadmin.proxy.audit_logs');

    Route::get('/proxy/stats', function (App\Services\FastApiService $api) {
        try {
            return response()->json($api->getSuperAdminStats() ?? [
                'active_admins' => 0,
                'inactive_admins' => 0,
                'total_residents' => 0,
                'total_complaints' => 0,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Superadmin stats proxy error: ' . $e->getMessage());
            return response()->json([
                'active_admins' => 0,
                'inactive_admins' => 0,
                'total_residents' => 0,
                'total_complaints' => 0,
            ]);
        }
    })->name('superadmin.proxy.stats');

    Route::get('/proxy/admins', function (App\Services\FastApiService $api) {
        try {
            return response()->json($api->getAllAdmins() ?? []);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Superadmin admins proxy error: ' . $e->getMessage());
            return response()->json([]);
        }
    })->name('superadmin.proxy.admins');

    Route::patch('/users/{id}/deactivate', [App\Http\Controllers\Admin\SuperAdminController::class, 'deactivate'])
        ->name('superadmin.users.deactivate');

    Route::patch('/users/{id}/activate', [App\Http\Controllers\Admin\SuperAdminController::class, 'activate'])
        ->name('superadmin.users.activate');

    Route::delete('/users/{id}', [App\Http\Controllers\Admin\SuperAdminController::class, 'destroy'])
        ->name('superadmin.users.destroy');
});
