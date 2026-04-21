<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AnnouncementController;
use App\Http\Controllers\Admin\ComplaintController;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware([
    'auth:sanctum', 
    config('jetstream.auth_session'),
    'verified',
    'admin',
    'active.user',
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
            return response()->json(
                $api->updateComplaintStatus($id, $request->complaint_status, auth()->id())
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
            return response()->json($api->updateEmergencyStatus($id, $request->all()));
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

    Route::get('/admin/complaints/{id}/download', [ComplaintController::class, 'downloadComplaint']);
});