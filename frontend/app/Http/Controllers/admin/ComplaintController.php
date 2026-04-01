<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\FastApiService;
use Illuminate\Http\Request;

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

public function updateStatus(Request $request, $id) { 
    $request->validate([ 'status' => 'required|in:pending, inprogress, approved, rejected',]);

    $complaint = $this->api->getComplaint($id); //for old status para sa audit log

    $this->api->updateComplaintStatus($id, $request->status); 

    AuditLog::create([
        'admin-id' => auth() -> id(), 
        'complaint_id' => $id,
        'old_status' => $complaint['complaint-status'],
        'new_status' => $request -> status,
    ]);

    return redirect() ->back() ->with ('success', 'Status updated!');
}
}