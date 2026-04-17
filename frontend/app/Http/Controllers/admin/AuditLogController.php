<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\FastApiService;

class AuditLogController extends Controller
{
    protected $api;

    public function __construct(FastApiService $api)
    {
        $this->api = $api;
    }

    public function index()
    {
        // FIX: was using Eloquent directly (AuditLog::with('admin')->paginate())
        // but audit_logs table is managed by FastAPI — must go through the service
        $logs = $this->api->getAuditLogs() ?? [];
        return view('pages.AuditLog', compact('logs'));
    }
}