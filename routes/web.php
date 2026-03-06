<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/sidebar', function (){
    return view('partials.sidebar');
})->name('sidebar');

Route::get('/ViewReport', function () {
    return view('ViewReport');
})->name('ViewReport');

Route::get('/Announcements', function(){
    return view('pages.Announcements');
})->name('Announcements');

Route::get('/AccountApproval', function() {
    return view('pages.AccountApproval');
})->name('AccountApproval');

Route::get('/RegisteredResidents', function() {
    return view('pages.RegisteredResidents');
})->name('RegisteredResidents');

Route::get('/AuditLog', function (){
    return view('pages.AuditLog');
})->name('AuditLog');

Route::get('/ReportAnalytics', function(){
    return view('pages.ReportAnalytics');
})->name('ReportAnalytics');



 




Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_session'),
    'verified',
])->group(function () {
    Route::get('/dashboard', function () {
        return view('pages.dashboard');
    })->name('dashboard');
});
