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

    public function index()
    {
        try {
            $userStats        = $this->api->getDashboardUserStats();
            $recentComplaints = $this->api->getComplaints();
            $pendingUsers     = $this->api->getDashboardPendingUsers();
            $registeredUsers  = $this->api->getDashboardRegisteredUsers();
        } catch (\Exception $e) {
            $userStats        = null;
            $recentComplaints = [];
            $pendingUsers     = [];
            $registeredUsers  = [];
        }

        return view('pages.dashboard', compact(
            'userStats', 'recentComplaints', 'pendingUsers', 'registeredUsers'
        ));
    }
}