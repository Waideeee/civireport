@extends('layouts.app')

@section('content')

@vite(['resources/css/app.css' , 'resources/css/Complaints.css', 'resources/js/app.js', 'resources/js/Complaints.js'])

  <div class="content">
    <div class="page active" id="page-reports">

      {{-- Queue Banner --}}
      <div class="queue-banner">
        <div class="queue card">
          <div class="queue-processing-label">Currently Processing</div>
          <div class="queue-number" id="queue-number">007</div>
          <div class="queue-label">Queue Number</div>
        </div>
        <div class="queue-right">
          <div class="queue-tag" id="queue-status">In Progress</div>
          <div class="queue-next" id="queue-next">Next in line: <strong>#008</strong></div>
          <div class="queue-updated" id="queue-updated">Updated just now</div>
        </div>
      </div>

      {{-- Section Header --}}
      <div class="section-header">
        <div class="section-title no-margin-bottom">All Complaints</div>
      </div>

      {{-- Table Card --}}
      <div class="table-card">

        {{-- Toolbar --}}
        <div class="cr-toolbar">
          <div class="cr-toolbar-left">
            <div class="cr-search-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                id="cr-search"
                class="cr-search"
                placeholder="Search resident, type, location…"
              />
            </div>
            <select id="cr-filter-status" class="cr-select">
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select id="cr-filter-type" class="cr-select">
              <option value="">All Types</option>
              <option value="Peace & Order">Peace &amp; Order</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Health & Sanitation">Health &amp; Sanitation</option>
              <option value="Social Services">Social Services</option>
            </select>
            <select id="cr-filter-urgency" class="cr-select">
              <option value="">All Urgency</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div class="cr-count" id="cr-count">0 records</div>
        </div>

        {{-- Table --}}
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>COMPLAINT TYPE</th>
                <th>SPECIFIC COMPLAINT</th>
                <th>LOCATION</th>
                <th>URGENCY</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody id="reports-tbody"></tbody>
          </table>
        </div>

        {{-- Pagination --}}
        <div class="cr-pagination">
          <button class="cr-page-btn" id="cr-prev" disabled>&#8592; Prev</button>
          <span class="cr-page-info" id="cr-page-info">Page 1 of 1</span>
          <button class="cr-page-btn" id="cr-next">Next &#8594;</button>
        </div>

      </div>

    </div>
  </div>
</div>

{{-- ═══════════════════════════════════════════════════════ --}}
{{-- COMPLAINT DETAIL MODAL                                  --}}
{{-- ═══════════════════════════════════════════════════════ --}}
<div class="modal-overlay" id="modal-overlay" onclick="closeModal(event)">
  <div class="modal">
    <div class="modal-header">
      <div>
        <div class="modal-title" id="modal-ticket"></div>
        <span class="badge" id="modal-badge"></span>
      </div>
      <button class="modal-close" onclick="closeModalDirect()">✕</button>
    </div>
    <div class="modal-body">
      <div class="modal-grid">
        <div>
          <div class="modal-field"><label>Complaint Type</label><p id="md-type"></p></div>
          <div class="modal-field"><label>Specific Complaint</label><p id="md-subtype"></p></div>
          <div class="modal-field"><label>Location</label><p id="md-location"></p></div>
          <div class="modal-field"><label>Contact No.</label><p id="md-contact"></p></div>
          <div class="modal-field"><label>Date Filed</label><p id="md-date"></p></div>
          <div class="modal-field"><label>Updated At</label><p id="md-updated"></p></div>
        </div>
        <div>
          <div class="modal-field"><label>Complainant Name</label><p id="md-name"></p></div>
          <div class="modal-field">
            <label>Urgency Level</label>
            <p><span id="md-urgency" class="urgency-badge"></span></p>
          </div>
          <div class="modal-field">
            <label>Additional Notes</label>
            <p id="md-notes" class="modal-notes-box"></p>
          </div>
          <div class="modal-field" id="md-reject-container" style="display: none;">
            <label style="color:#ef4444;">Reason for Rejection</label>
            <p id="md-reject-reason" class="modal-notes-box" style="background:#fef2f2; border-color:#fee2e2; color:#991b1b;"></p>
          </div>
          <div class="modal-field" id="md-resolution-container" style="display: none; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <label style="color:#16a34a; font-weight: 700; font-size: 0.8rem; margin:0;">Resolution</label>
            </div>
            <p id="md-resolved-notes" style="font-size: 0.85rem; color: #166534; margin-bottom: 10px;"></p>
            <div id="md-resolved-media"></div>
          </div>
          <div class="modal-field">
            <label>Complaint Media</label>
            <div class="modal-media" id="md-media-link"></div>
          </div>
        </div>
      </div>

      {{-- AI Recommendation --}}
      <div class="ai-rec-card">
        <div class="ai-rec-header">
          <div class="ai-rec-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
          </div>
          <span class="ai-rec-title">AI Recommendation</span>
          <span class="ai-rec-tag">Auto-generated</span>
        </div>
        <div class="ai-rec-body">
          <p id="ai-summary" class="ai-rec-summary"></p>
          <ul id="ai-steps" class="ai-rec-steps"></ul>
          <div class="ai-rec-footer">
            <span class="ai-rec-label">Suggested action:</span>
            <span id="ai-action" class="ai-rec-action"></span>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      {{-- Download: calls downloadComplaint() which uses currentComplaint data --}}
      <button class="btn btn-download" onclick="downloadComplaint()">⬇ Download</button>
      {{-- Reject: opens reject confirmation modal --}}
      <button class="btn btn-danger" id="btn-reject" onclick="showComplaintRejectModal()">Reject</button>
      <button class="btn btn-success" id="btn-approve" onclick="showComplaintApproveModal()">Approve</button>
    </div>
  </div>
</div>

{{-- ═══════════════════════════════════════════════════════ --}}
{{-- COMPLAINT APPROVE CONFIRMATION MODAL                    --}}
{{-- ═══════════════════════════════════════════════════════ --}}
<div class="cr-modal-overlay" id="complaint-approve-overlay">
  <div class="cr-confirm-modal">
    <div class="cr-confirm-icon cr-confirm-icon--approve">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    </div>
    <div class="cr-confirm-title">Approve Complaint</div>
    <div class="cr-confirm-message">
      Are you sure you want to approve complaint
      <strong id="approve-complaint-id"></strong>?
      The status will be updated to <em>In Progress</em>.
    </div>

    <div class="cr-confirm-field" style="margin-top: 12px; text-align: left;">
      <label class="cr-confirm-label" for="complaint-action-notes">
        Resolution Notes <span class="cr-confirm-required">*</span>
      </label>
      <textarea
        id="complaint-action-notes"
        class="cr-confirm-textarea"
        placeholder="Detail how this complaint will be or was resolved..."
        rows="3"
      ></textarea>
      <div class="cr-confirm-error" id="complaint-action-error" style="display:none; color:red; font-size:0.8rem; margin-top:4px;">
        Please provide resolution notes.
      </div>
    </div>

    <div class="cr-confirm-field" style="margin-top: 12px; text-align: left;">
      <label class="cr-confirm-label" for="complaint-action-proof">
        Attach Photo Proof <span style="font-weight: normal; color: #9ca3af;">(Optional)</span>
      </label>
      <input type="file" id="complaint-action-proof" accept="image/*" style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.85rem;" />
    </div>
    <div class="cr-confirm-actions">
      <button class="cr-btn cr-btn-ghost" onclick="closeComplaintApproveModal()">Cancel</button>
      <button class="cr-btn cr-btn-approve" id="complaint-approve-btn" onclick="submitComplaintApprove()">
        <span id="c-approve-text">Yes, Approve</span>
        <span id="c-approve-spinner" style="display:none;">Processing…</span>
      </button>
    </div>
  </div>
</div>

{{-- ═══════════════════════════════════════════════════════ --}}
{{-- COMPLAINT REJECT CONFIRMATION MODAL                     --}}
{{-- ═══════════════════════════════════════════════════════ --}}
<div class="cr-modal-overlay" id="complaint-reject-overlay">
  <div class="cr-confirm-modal">
    <div class="cr-confirm-icon cr-confirm-icon--reject">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    </div>
    <div class="cr-confirm-title">Reject Complaint</div>
    <div class="cr-confirm-message">
      Are you sure you want to reject complaint
      <strong id="reject-complaint-id"></strong>?
      Please provide a reason below.
    </div>
    <div class="cr-confirm-field">
      <label class="cr-confirm-label" for="complaint-reject-reason">
        Reason for Rejection <span class="cr-confirm-required">*</span>
      </label>
      <textarea
        id="complaint-reject-reason"
        class="cr-confirm-textarea"
        placeholder="Explain why this complaint is being rejected…"
        rows="4"
      ></textarea>
      <div class="cr-confirm-error" id="complaint-reject-error" style="display:none;">
        Please provide a reason for rejection.
      </div>
    </div>
    <div class="cr-confirm-actions">
      <button class="cr-btn cr-btn-ghost" onclick="closeComplaintRejectModal()">Cancel</button>
      <button class="cr-btn cr-btn-reject" id="complaint-reject-btn" onclick="submitComplaintReject()">
        <span id="c-reject-text">Yes, Reject</span>
        <span id="c-reject-spinner" style="display:none;">Processing…</span>
      </button>
    </div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

@endsection