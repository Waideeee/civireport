@extends('layouts.app') 
@section('content')

@vite(['resources/css/app.css', 'resources/css/UserRecords.css', 'resources/js/app.js', 'resources/js/UserRecords.js'])
<div class="main">
  <div class="content">

    {{-- ── Pending Account Approvals ── --}}
    <div class="approval-wrapper">
      <div class="approval-title">Pending Account Approvals</div>
      <div class="approval-table">

        {{-- Toolbar --}}
        <div class="ur-toolbar">
          <div class="ur-search-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" id="approval-search" class="ur-search" placeholder="Search name, email…" />
          </div>
          <div class="ur-count" id="approval-count">0 records</div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Date Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="approval-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>

    {{-- ── Registered Residents ── --}}
    <div class="residents-wrapper">
      <div class="residents-title">Registered Residents</div>
      <div class="residents-table">

        {{-- Toolbar --}}
        <div class="ur-toolbar">
          <div class="ur-toolbar-left">
            <div class="ur-search-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" id="residents-search" class="ur-search" placeholder="Search name, email…" />
            </div>
            <select id="residents-filter-status" class="ur-select">
              <option value="">All Status</option>
              <option value="active">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div class="ur-toolbar-right">
            <button class="ur-btn-download" onclick="downloadResidentsPDF()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download PDF
            </button>
            <div class="ur-count" id="residents-count">0 records</div>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Date Registered</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="residents-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</div>

{{-- ═══════════════════════════════════════════ --}}
{{-- APPROVE CONFIRMATION MODAL                  --}}
{{-- ═══════════════════════════════════════════ --}}
<div class="ur-modal-overlay" id="approve-modal-overlay">
  <div class="ur-modal">
    <div class="ur-modal-icon" style="padding: 0; overflow: hidden; border-radius: 50%; width: 64px; height: 64px; border: 3px solid #16a34a; display: flex; align-items: center; justify-content: center; background: #f0fdf4;">
      <img id="approve-user-photo" src="" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">
    </div>
    <div class="ur-modal-title">Approve Account</div>
    <div class="ur-modal-message">
      Are you sure you want to approve
      <strong id="approve-user-name"></strong>?
      They will be granted access to the system.
    </div>
    <div class="ur-modal-actions">
      <button class="ur-btn ur-btn-ghost" onclick="closeApproveModal()">Cancel</button>
      <button class="ur-btn ur-btn-approve" id="approve-confirm-btn" onclick="submitApproval()">
        <span id="approve-btn-text">Yes, Approve</span>
        <span id="approve-btn-spinner" class="ur-spinner-text">Processing…</span>
      </button>
    </div>
  </div>
</div>

{{-- ═══════════════════════════════════════════ --}}
{{-- REJECT CONFIRMATION MODAL                   --}}
{{-- ═══════════════════════════════════════════ --}}
<div class="ur-modal-overlay" id="reject-modal-overlay">
  <div class="ur-modal">
    <div class="ur-modal-icon" style="padding: 0; overflow: hidden; border-radius: 50%; width: 64px; height: 64px; border: 3px solid #dc2626; display: flex; align-items: center; justify-content: center; background: #fef2f2;">
      <img id="reject-user-photo" src="" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">
    </div>
    <div class="ur-modal-title">Reject Account</div>
    <div class="ur-modal-message">
      Are you sure you want to reject
      <strong id="reject-user-name"></strong>?
      This action will deny their access to the system.
    </div>
    <div class="ur-modal-field">
      <label class="ur-modal-label" for="reject-reason">
        Reason for Rejection <span class="ur-modal-required">*</span>
      </label>
      <textarea
        id="reject-reason"
        class="ur-modal-textarea"
        placeholder="Please explain why this account is being rejected…"
        rows="4"
      ></textarea>
      <div class="ur-modal-error" id="reject-reason-error">
        Please provide a reason for rejection.
      </div>
    </div>
    <div class="ur-modal-actions">
      <button class="ur-btn ur-btn-ghost" onclick="closeRejectModal()">Cancel</button>
      <button class="ur-btn ur-btn-reject" id="reject-confirm-btn" onclick="submitRejection()">
        <span id="reject-btn-text">Yes, Reject</span>
        <span id="reject-btn-spinner" class="ur-spinner-text">Processing…</span>
      </button>
    </div>
  </div>
</div>

{{-- ═══════════════════════════════════════════ --}}
{{-- RESIDENT DETAIL MODAL                       --}}
{{-- ═══════════════════════════════════════════ --}}
<div class="ur-modal-overlay" id="resident-modal-overlay" onclick="closeResidentModalDirect(event)">
  <div class="ur-modal ur-modal--wide">
    <div class="ur-modal-header">
      <div style="display:flex; align-items:center; gap: 16px;">
        <img id="res-user-photo" src="" alt="Profile" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid #e5e7eb;">
        <div class="ur-modal-header-info">
          <div class="ur-modal-title ur-modal-title--sm" id="account-modal-title">Account Details</div>
          <div class="ur-modal-subtitle" id="account-modal-subtitle">Complete profile information</div>
        </div>
      </div>
      <div class="ur-modal-header-actions">
        <button class="ur-btn-download" onclick="downloadSingleResidentPDF()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download PDF
        </button>
        <button class="ur-modal-close" onclick="closeResidentModal()">✕</button>
      </div>
    </div>

    <div class="ur-modal-grid">
      <div class="ur-modal-field">
        <label class="ur-modal-label ur-modal-label--meta">Full Name</label>
        <p id="res-name" class="ur-modal-value"></p>
      </div>
      <div class="ur-modal-field">
        <label class="ur-modal-label ur-modal-label--meta">Status</label>
        <p class="ur-modal-value--bare"><span id="res-status"></span></p>
      </div>
      <div class="ur-modal-field">
        <label class="ur-modal-label ur-modal-label--meta">Email</label>
        <p id="res-email" class="ur-modal-value ur-modal-value--break"></p>
      </div>
      <div class="ur-modal-field">
        <label class="ur-modal-label ur-modal-label--meta">Contact Number</label>
        <p id="res-contact" class="ur-modal-value"></p>
      </div>
      <div class="ur-modal-field">
        <label class="ur-modal-label ur-modal-label--meta">Gender</label>
        <p id="res-gender" class="ur-modal-value"></p>
      </div>
      <div class="ur-modal-field">
        <label class="ur-modal-label ur-modal-label--meta">Date Registered</label>
        <p id="res-registered" class="ur-modal-value"></p>
      </div>
      <div class="ur-modal-field ur-modal-field--full">
        <label class="ur-modal-label ur-modal-label--meta">Full Address</label>
        <p id="res-address" class="ur-modal-value ur-modal-value--box"></p>
      </div>
      <div class="ur-modal-field ur-modal-field--full" id="res-reject-container">
        <label class="ur-modal-label ur-modal-label--danger">Reason for Rejection</label>
        <p id="res-reject-reason" class="ur-modal-value ur-modal-value--danger"></p>
      </div>
    </div>
    
    <div class="ur-modal-actions" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <button class="ur-btn ur-btn-approve" id="res-btn-approve" onclick="submitResidentApprove()" style="display:none; width: 100%;">
          Approve User
        </button>
        <button class="ur-btn ur-btn-reject" id="res-btn-reject" onclick="showResidentRejectModal()" style="display:none; width: 100%;">
          Reject User
        </button>
    </div>
  </div>
</div>

{{-- Pass PHP data to JS --}}
<script>
    window.pendingUsers = @json(collect($users)->where('status', 'pending')->values());
    window.approvedUsers = @json(collect($users)->whereIn('status', ['approved', 'rejected'])->values());
</script>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>

<script>
document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const viewId = urlParams.get('view');
    if (viewId) {
        setTimeout(() => {
            if (typeof window.openResidentModal === 'function' && window.approvedUsers?.some(user => user.user_id === parseInt(viewId))) {
                window.openResidentModal(parseInt(viewId));
            } else if (typeof window.openPendingResidentModal === 'function') {
                window.openPendingResidentModal(parseInt(viewId));
            }
        }, 500);
    }
});
</script>

@endsection
