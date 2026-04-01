<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\FastApiService;

class DashboardController extends Controller
{
    protected $api;

    public function __construct(FastApiService $api)
    {
        $this->api = $api;
    }

    public function index() {    
        $stats = $this->api->getDashboardStats();
        $recentComplaints = $this->api->getComplaints();

        return view('pages.dashboard', compact('stats', 'recentComplaints'));
    }
}