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

        $collection = collect($complaints);

        $byType   = $collection->groupBy('complaint_type')->map->count();
        $byStatus = $collection->groupBy('complaint_status')->map->count();

        // Monthly trend sa isang taon
        $byMonth = $collection
            ->filter(fn($c) => isset($c['created_at']) &&
                substr($c['created_at'], 0, 4) == date('Y'))
            ->groupBy(fn($c) => (int) substr($c['created_at'], 5, 2))
            ->map->count();

        $months    = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $trendData = collect(range(1, 12))->map(fn($m) => $byMonth[$m] ?? 0)->values();

        return view('pages.ReportAnalytics', compact(
            'stats', 'byType', 'byStatus', 'months', 'trendData'
        ));
    }
}