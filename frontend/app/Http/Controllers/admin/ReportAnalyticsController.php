<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\FastApiService;
use Throwable;

class ReportAnalyticsController extends Controller
{
    protected $api;

    public function __construct(FastApiService $api)
    {
        $this->api = $api;
    }

    public function index()
    {
        try {
            $analytics = $this->api->getAnalytics();
        } catch (Throwable $e) {
            $analytics = [];
        }

        if (!is_array($analytics)) {
            $analytics = [];
        }

        return view('pages.ReportAnalytics', [
            'analytics' => $analytics,
        ]);
    }
}