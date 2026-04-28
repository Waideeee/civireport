<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\FastApiService;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class ComplaintController extends Controller
{
    protected $api;

    public function __construct(FastApiService $api)
    {
        $this->api = $api;
    }

    public function index()
    {
        $complaints = $this->api->getComplaints();
        return view('pages.Complaints', compact('complaints'));
    }

    public function show($id)
    {
        $complaint = $this->api->getComplaint($id);
        return view('pages.Complaints.show', compact('complaint'));
    }

    public function updateStatus(Request $request, $id)
    {
        $status = $request->input('complaint_status', $request->input('status'));
        $request->merge([
            'status' => $status,
        ]);

        $request->validate([
            'status' => 'required|in:in_progress,rejected',
            'rejection_reason' => 'required_if:status,rejected|nullable|string|max:1000',
            'action_proof' => 'nullable|string',
            'action_proof_name' => 'nullable|string',
            'resolved_notes' => 'nullable|string',
        ]);

        $result = $this->api->updateComplaintStatus(
            $id, 
            $status, 
            auth()->id(), 
            $request->rejection_reason,
            $request->action_proof,
            $request->action_proof_name,
            $request->resolved_notes
        );

        if (($result['successful'] ?? false) === true) {
            return response()->json([
                'success' => true,
                'message' => data_get($result, 'data.message', 'Status updated!'),
                'data' => $result['data'] ?? null,
            ], $result['status'] ?? 200);
        }

        $message = data_get($result, 'data.detail');
        if (is_array($message)) {
            $message = collect($message)
                ->map(function ($entry) {
                    if (is_array($entry)) {
                        return $entry['msg'] ?? json_encode($entry);
                    }

                    return (string) $entry;
                })
                ->implode(' ');
        }

        return response()->json([
            'success' => false,
            'message' => $message ?: data_get($result, 'data.error', 'Failed to update complaint status.'),
            'errors' => data_get($result, 'data.detail'),
        ], $result['status'] ?? 422);
    }

    public function downloadComplaint($id)
    {
        $complaint = $this->api->getComplaint($id);
        $history = collect($this->api->getAuditLogs())
            ->filter(fn ($entry) => (int) ($entry['complaint_id'] ?? 0) === (int) $id)
            ->map(fn ($entry) => [
                'admin_name' => $entry['admin_name'] ?? $entry['user_full_name'] ?? $entry['user_name'] ?? 'System',
                'audit_date' => $entry['audit_date'] ?? $entry['created_at'] ?? '',
                'old_status' => $entry['old_status'] ?? '',
                'new_status' => $entry['new_status'] ?? '',
                'action_notes' => $entry['action_notes'] ?? '',
            ])
            ->values()
            ->all();

        $pdf = Pdf::loadView('pdf.complaint', compact('complaint', 'history'))
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isRemoteEnabled' => true,
                'defaultFont' => 'sans-serif'
            ]);

        return $pdf->download('complaint_'.$id.'.pdf');
    }
}
