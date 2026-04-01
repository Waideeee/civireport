<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class FastApiService
{
    protected $baseUrl;

    public function __construct()
    {
        $this->baseUrl = env('FASTAPI_URL');
    }

    // Complaints — kunin lahat kasama ang user at media
    public function getComplaints()
    {
        // GET /complaints
        // Expected fields: complaint_id, complaint_date, user_id,
        // complaint_type, complaint_subtype, complaint_location,
        // complaint_status, additional_notes
        return Http::get("{$this->baseUrl}/complaints")->json();
    }

    public function getComplaint($id)
    {
        // GET /complaints/{id}
        // Expected: same fields + complaint_media (file_path, media_type)
        return Http::get("{$this->baseUrl}/complaints/{$id}")->json();
    }

    public function updateComplaintStatus($id, $status)
    {
        // PATCH /complaints/{id}
        // Payload: complaint_status
        return Http::patch("{$this->baseUrl}/complaints/{$id}", [
            'complaint_status' => $status,
        ])->json();
    }

    public function getDashboardStats()
    {
        // GET /complaints/stats
        // Expected: count ng bawat status
        // pending, in_progress, resolved, rejected, total
        return Http::get("{$this->baseUrl}/complaints/stats")->json();
    }

    public function getUsers()
    {
        // GET /users
        return Http::get("{$this->baseUrl}/users")->json();
    }

    public function getUser($id)
    {
        // GET /users/{id}
        return Http::get("{$this->baseUrl}/users/{$id}")->json();
    }

    public function updateUserStatus($id, $status)
{
    return Http::patch("{$this->baseUrl}/users/{$id}/status", [
        'status' => $status,
    ])->json();
}

    public function chat($message)
    {
        return Http::post("{$this->baseUrl}/chat", [
            'message' => $message,
        ])->json();
    }
}