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
        $request->validate([
            'status' => 'required|in:pending,in progress,resolved,rejected',
        ]);

        $result = $this->api->updateComplaintStatus($id, $request->status, auth()->id());

        // Always return JSON so the frontend AJAX handler can read it
        if ($result && !isset($result['error'])) {
            return response()->json([
                'success' => true,
                'message' => 'Status updated!'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['error'] ?? 'Failed to update complaint status.'
        ], 422);
    }

    public function downloadComplaint($id)
    {
        $complaint = $this->api->getComplaint($id);

        $pdf = Pdf::loadView('pdf.complaint', compact('complaint'))
            ->setOptions([
                'isRemoteEnabled' => true, // 🔥 para gumana CSS/images
                'defaultFont' => 'sans-serif'
            ]);

        return $pdf->download('complaint_'.$id.'.pdf');
    }
}