<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class FastApiService
{
    protected $baseUrl;

    public function __construct()
    {
        $this->baseUrl = env('FASTAPI_URL', 'http://127.0.0.1:8000');
    }

    protected function client($timeout = 10)
    {
        return Http::timeout($timeout)->baseUrl($this->baseUrl);
    }

    public function getDashboardUserStats()
    {
        return $this->client()->get('/dashboard/stats')->json();
    }

    public function getDashboardStats()
    {
        return $this->client()->get('/dashboard/stats')->json();
    }

    public function getDashboardPendingUsers()
    {
        return $this->client()->get('/dashboard/pending-users')->json();
    }

    public function getDashboardRegisteredUsers()
    {
        return $this->client()->get('/dashboard/registered-users')->json();
    }

    public function getDashboardComplaintStats()
    {
        return $this->client()->get('/dashboard/complaint-stats')->json();
    }

    public function getComplaints()
    {
        return $this->client()->get('/complaints')->json();
    }

    public function getComplaint($id)
    {
        return $this->client()->get("/complaints/{$id}")->json();
    }

    // FIX: added $adminId parameter so audit log is written correctly in FastAPI
    public function updateComplaintStatus($id, $status, $adminId = null)
    {
        return $this->client()->patch("/complaints/{$id}/status", [
            'complaint_status' => $status,
            'admin_id'         => $adminId,
        ])->json();
    }

    public function getUsers()
    {
        return $this->client()->get('/users')->json();
    }

    public function getUser($id)
    {
        return $this->client()->get("/users/{$id}")->json();
    }

    public function updateUserStatus($id, $payload)
    {
        return $this->client()->patch("/users/{$id}/status", $payload)->json();
    }

    public function getAuditLogs()
    {
        return $this->client()->get('/audit-logs')->json();
    }

    public function getAnalytics()
    {
        return $this->client()->get('/analytics')->json();
    }

    public function getAnalyticsInsight()
    {
        return $this->client(30)->get('/analytics/insight')->json();
    }

    public function getAnnouncements()
    {
        return $this->client()->get('/announcements')->json();
    }

    public function createAnnouncement($data)
    {
        return $this->client()->post('/announcements', $data)->json();
    }

    public function updateAnnouncement($id, $data)
    {
        return $this->client()->put("/announcements/{$id}", $data)->json();
    }
    public function deleteAnnouncement($id)
    {
        return $this->client()->delete("/announcements/{$id}")->json();
    }
}
