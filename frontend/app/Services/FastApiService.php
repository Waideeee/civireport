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

    protected function client()
    {
        return Http::timeout(10)->baseUrl($this->baseUrl);
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
    public function updateComplaintStatus($complaintId, $status, $adminId, $rejectionReason = null, $actionProof = null, $actionProofName = null, $resolvedNotes = null)
    {
        $payload = [
            'complaint_status' => $status,
            'admin_id'         => $adminId,
        ];

        if ($rejectionReason !== null) {
            $payload['rejection_reason'] = $rejectionReason;
        }

        if ($actionProof !== null) {
            $payload['action_proof'] = $actionProof;
            $payload['action_proof_name'] = $actionProofName;
        }

        if ($resolvedNotes !== null) {
            $payload['resolved_notes'] = $resolvedNotes;
        }

        return $this->client()->patch("/complaints/{$complaintId}/status", $payload)->json();
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