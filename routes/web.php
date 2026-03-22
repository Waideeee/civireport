<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/sidebar', function (){
    return view('partials.sidebar');
})->name('sidebar');

Route::get('/Complaints', function () {
    return view('pages.Complaints');
})->name('Complaints');

Route::get('/Announcements', function(){
    return view('pages.Announcements');
})->name('Announcements');

Route::get('/UserRecords', function(){
    return view('pages.UserRecords');
})->name('UserRecords');

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
