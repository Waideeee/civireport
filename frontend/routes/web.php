<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_session'),
    'verified',
])->group(function () {

    Route::get('/dashboard', [App\Http\Controllers\Admin\DashboardController::class, 'index'])
        ->name('dashboard');

    Route::get('/Complaints', [App\Http\Controllers\Admin\ComplaintController::class, 'index'])
        ->name('Complaints');
    Route::get('/Complaints/{id}', [App\Http\Controllers\Admin\ComplaintController::class, 'show'])
        ->name('Complaints.show');
    Route::patch('/Complaints/{id}/status', [App\Http\Controllers\Admin\ComplaintController::class, 'updateStatus'])
        ->name('Complaints.updateStatus');

    Route::get('/Announcements', [App\Http\Controllers\Admin\AnnouncementController::class, 'index'])
        ->name('Announcements');
    Route::get('/Announcements/create', [App\Http\Controllers\Admin\AnnouncementController::class, 'create'])
        ->name('Announcements.create');
    Route::post('/Announcements', [App\Http\Controllers\Admin\AnnouncementController::class, 'store'])
        ->name('Announcements.store');
    Route::get('/Announcements/{id}/edit', [App\Http\Controllers\Admin\AnnouncementController::class, 'edit'])
        ->name('Announcements.edit');
    Route::put('/Announcements/{id}', [App\Http\Controllers\Admin\AnnouncementController::class, 'update'])
        ->name('Announcements.update');
    Route::delete('/Announcements/{id}', [App\Http\Controllers\Admin\AnnouncementController::class, 'destroy'])
        ->name('Announcements.destroy');

    Route::get('/UserRecords', [App\Http\Controllers\Admin\UserController::class, 'index'])
        ->name('UserRecords');
    Route::get('/UserRecords/{id}', [App\Http\Controllers\Admin\UserController::class, 'show'])
        ->name('UserRecords.show');

    Route::patch('/UserRecords/users/{id}/status', [App\Http\Controllers\Admin\UserController::class, 'updateStatus'])
        ->name('UserRecords.status');

    Route::get('/AuditLog', [App\Http\Controllers\Admin\AuditLogController::class, 'index'])
        ->name('AuditLog');

    Route::get('/ReportAnalytics', [App\Http\Controllers\Admin\ReportAnalyticsController::class, 'index'])
        ->name('ReportAnalytics');
});