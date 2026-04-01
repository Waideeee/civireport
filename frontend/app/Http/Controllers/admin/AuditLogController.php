<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;

class AuditLogController extends Controller
{
    public function index()
    {
        $logs = AuditLog::with('admin')->latest()->paginate(50);
        return view('pages.AuditLog', compact('logs'));
    }
}