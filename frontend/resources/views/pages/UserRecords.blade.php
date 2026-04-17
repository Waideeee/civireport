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
          <div class="ur-search-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" id="residents-search" class="ur-search" placeholder="Search name, email…" />
          </div>
          <div style="display: flex; gap: 12px; align-items: center;">
            <button onclick="downloadResidentsPDF()" style="padding: 6px 12px; border-radius: 6px; border: 1.5px solid #e5e7eb; background: #fff; color: #374151; font-weight: 600; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='#fff'">
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
                <th></th>
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
    <div class="ur-modal-icon ur-modal-icon--approve">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
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
        <span id="approve-btn-spinner" style="display:none;">Processing…</span>
      </button>
    </div>
  </div>
</div>

{{-- ═══════════════════════════════════════════ --}}
{{-- REJECT CONFIRMATION MODAL                   --}}
{{-- ═══════════════════════════════════════════ --}}
<div class="ur-modal-overlay" id="reject-modal-overlay">
  <div class="ur-modal">
    <div class="ur-modal-icon ur-modal-icon--reject">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
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
      <div class="ur-modal-error" id="reject-reason-error" style="display:none;">
        Please provide a reason for rejection.
      </div>
    </div>
    <div class="ur-modal-actions">
      <button class="ur-btn ur-btn-ghost" onclick="closeRejectModal()">Cancel</button>
      <button class="ur-btn ur-btn-reject" id="reject-confirm-btn" onclick="submitRejection()">
        <span id="reject-btn-text">Yes, Reject</span>
        <span id="reject-btn-spinner" style="display:none;">Processing…</span>
      </button>
    </div>
  </div>
</div>
{{-- ═══════════════════════════════════════════ --}}
{{-- RESIDENT DETAIL MODAL                       --}}
{{-- ═══════════════════════════════════════════ --}}
<div class="ur-modal-overlay" id="resident-modal-overlay" onclick="closeResidentModalDirect(event)">
  <div class="ur-modal" style="max-width: 500px; text-align: left;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
      <div>
        <div class="ur-modal-title" style="margin-bottom: 4px;">Resident Details</div>
        <div style="font-size:0.85rem; color:#6b7280;">Complete profile information</div>
      </div>
      <div style="display:flex; gap:12px; align-items:center;">
        <button onclick="downloadSingleResidentPDF()" style="background:#fff; color:#374151; font-size:0.75rem; font-weight:600; padding:6px 10px; border-radius:6px; border:1px solid #e5e7eb; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='#fff'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download PDF
        </button>
        <button onclick="closeResidentModal()" style="background:none; border:none; font-size:1.4rem; cursor:pointer; color:#9ca3af;">✕</button>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div class="ur-modal-field">
        <label class="ur-modal-label" style="font-size:0.7rem; text-transform:uppercase; color:#9ca3af;">Full Name</label>
        <p id="res-name" style="margin:0; font-size:0.9rem; font-weight:500; color:#111827;"></p>
      </div>
      <div class="ur-modal-field">
        <label class="ur-modal-label" style="font-size:0.7rem; text-transform:uppercase; color:#9ca3af;">Status</label>
        <p style="margin:0;"><span id="res-status" style="font-size:0.75rem; padding:3px 10px; border-radius:20px; font-weight:600;"></span></p>
      </div>
      <div class="ur-modal-field">
        <label class="ur-modal-label" style="font-size:0.7rem; text-transform:uppercase; color:#9ca3af;">Email</label>
        <p id="res-email" style="margin:0; font-size:0.9rem; font-weight:500; color:#111827; word-break:break-all;"></p>
      </div>
      <div class="ur-modal-field">
        <label class="ur-modal-label" style="font-size:0.7rem; text-transform:uppercase; color:#9ca3af;">Contact Number</label>
        <p id="res-contact" style="margin:0; font-size:0.9rem; font-weight:500; color:#111827;"></p>
      </div>
      <div class="ur-modal-field">
        <label class="ur-modal-label" style="font-size:0.7rem; text-transform:uppercase; color:#9ca3af;">Gender</label>
        <p id="res-gender" style="margin:0; font-size:0.9rem; font-weight:500; color:#111827;"></p>
      </div>
      <div class="ur-modal-field">
        <label class="ur-modal-label" style="font-size:0.7rem; text-transform:uppercase; color:#9ca3af;">Date Registered</label>
        <p id="res-registered" style="margin:0; font-size:0.9rem; font-weight:500; color:#111827;"></p>
      </div>
      <div class="ur-modal-field" style="grid-column: 1 / -1;">
        <label class="ur-modal-label" style="font-size:0.7rem; text-transform:uppercase; color:#9ca3af;">Full Address</label>
        <p id="res-address" style="margin:0; font-size:0.9rem; font-weight:500; color:#111827; padding:10px; background:#f9fafb; border-radius:8px; border:1px solid #f3f4f6;"></p>
      </div>
    </div>
  </div>
</div>

{{-- Pass PHP data to JS --}}
<script>
    window.pendingUsers = @json(collect($users)->where('status', 'pending')->values());
    window.approvedUsers = @json(collect($users)->where('status', 'approved')->values());
    window.pendingUsers = @json(collect($users)->where('status', 'pending')->values());
    window.approvedUsers = @json(collect($users)->where('status', 'approved')->values());
</script>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>

@endsection