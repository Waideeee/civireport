<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\FastApiService;

class ReportAnalyticsController extends Controller
{
    protected $api;

    public function __construct(FastApiService $api)
    {
        $this->api = $api;
    }

    public function index()
    {
        $stats      = $this->api->getDashboardStats();
        $complaints = $this->api->getComplaints();

        $byType    = collect($complaints)->groupBy('complaint_type')->map->count();
        $byStatus  = collect($complaints)->groupBy('complaint_status')->map->count();

        return view('pages.ReportAnalytics', compact('stats', 'byType', 'byStatus'));
    }
}