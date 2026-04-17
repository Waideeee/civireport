<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\FastApiService;
use Illuminate\Http\Request;

class UserController extends Controller
{
    protected $api;

    public function __construct(FastApiService $api)
    {
        $this->api = $api;
    }

    public function index()
    {
        $users = $this->api->getUsers();
        return view('pages.UserRecords', compact('users'));
    }

    public function show($id)
    {
        $user = $this->api->getUser($id);
        return view('pages.UserRecords', compact('user'));
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status'           => 'required|in:approved,rejected,active,inactive',
            // rejection_reason is required only when rejecting
            'rejection_reason' => 'required_if:status,rejected|nullable|string|max:1000',
        ]);

        $payload = ['status' => $request->status];

        if ($request->status === 'rejected' && $request->filled('rejection_reason')) {
            $payload['rejection_reason'] = $request->rejection_reason;
        }

        $result = $this->api->updateUserStatus($id, $payload);

        // Always return JSON so the frontend AJAX handler can read it
        if ($result && !isset($result['error'])) {
            return response()->json([
                'success' => true,
                'message' => $request->status === 'approved'
                    ? 'User approved successfully.'
                    : 'User rejected.',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['error'] ?? 'Failed to update user status.',
        ], 422);
    }
}