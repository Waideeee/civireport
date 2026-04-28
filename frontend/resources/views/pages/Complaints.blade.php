@extends('layouts.app')

@section('content')

@vite(['resources/css/app.css' , 'resources/css/Complaints.css', 'resources/js/app.js', 'resources/js/Complaints.js'])

  <div class="content">
    <div class="page active" id="page-reports">

      {{-- Queue Banner --}}
      <div class="queue-banner">
        <div class="queue card">
          <div class="queue-processing-label">Currently Processing</div>
          <div class="queue-number" id="queue-number">000</div>
          <div class="queue-label">Queue Number</div>
        </div>
        <div class="queue-right">
          <div class="queue-tag" id="queue-status">--</div>
          <div class="queue-next" id="queue-next">Next in line: <strong>--</strong></div>
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
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
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
          
          {{-- Rejection Reason --}}
          <div class="modal-field" id="md-reject-container" style="display: none;">
            <label style="color:#ef4444;">Reason for Rejection</label>
            <div class="modal-notes-box" style="background:#fef2f2; border: 1px solid #fee2e2;">
              <p id="md-reject-reason" style="color:#991b1b; margin: 0 !important;"></p>
            </div>
          </div>

          {{-- Service Rating --}}
          <div class="modal-field" id="md-rating-container" style="display: none;">
            <label style="color:#0284c7;">User Service Rating</label>
            <div class="modal-notes-box" style="background:#f0f9ff; border: 1px solid #bae6fd; padding: 12px !important;">
              <div id="md-rating-stars" style="color: #0ea5e9; font-size: 1.2rem; margin-bottom: 4px;"></div>
              <p id="md-rating-feedback" style="font-size: 0.85rem !important; color: #0369a1 !important; margin: 0 !important; font-weight: 500 !important; font-style: italic !important;"></p>
              <p id="md-rating-submitted" style="font-size: 0.78rem !important; color: #0369a1 !important; margin: 6px 0 0 0 !important; font-weight: 500 !important;"></p>
            </div>
          </div>

          {{-- Resolution History --}}
          <div class="modal-field" id="md-resolution-container" style="display: none;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <label style="color:#16a34a; margin: 0;">Resolution Notes</label>
            </div>
            <div class="modal-notes-box" style="background:#f0fdf4; border: 1px solid #bbf7d0; padding: 12px !important;">
              <p id="md-resolved-notes" style="font-size: 0.85rem !important; color: #166534 !important; margin: 0 0 8px 0 !important; font-weight: 400 !important;"></p>
              <div id="md-resolved-media"></div>
            </div>
          </div>

          <div class="modal-field">
            <label>Complaint Media</label>
            <div class="modal-media" id="md-media-link"></div>
          </div>
        </div>
      </div>

      {{-- Revision Feedback --}}
      <div class="modal-field modal-section-card" id="md-feedback-container">
        <div class="modal-section-header modal-section-header--warning">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 9v4"/>
            <path d="M12 17h.01"/>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          </svg>
          <label style="color:#d97706; margin: 0;">Revision Feedback From Resident</label>
        </div>
        <div class="modal-notes-box modal-notes-box--warning">
          <p id="md-revision-feedback" style="color:#92400e; margin: 0 !important;">No revision feedback submitted yet.</p>
        </div>
      </div>

      <div class="modal-field modal-section-card" id="md-history-container">
        <div class="modal-section-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v5h5"/>
            <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
            <path d="M12 7v5l3 3"/>
          </svg>
          <label style="color:#2563eb; margin: 0;">Complaint History</label>
        </div>
        <div id="md-history-list" class="history-list"></div>
      </div>

      {{-- AI Recommendation --}}
      <div class="ai-rec-card">
        <div class="ai-rec-header">
          <div class="ai-rec-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
          </div>
          <span class="ai-rec-title">AI Recommendation</span>
          <span class="ai-rec-tag">Auto-generated</span>
        </div>
        <div class="ai-rec-body">
          <p id="ai-recommendation-content" class="ai-rec-summary"></p>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-download" onclick="downloadComplaint()">⬇ Download</button>
      <button class="btn btn-danger" id="btn-reject" onclick="showComplaintRejectModal()">Reject</button>
      <button class="btn btn-warning" id="btn-inprogress" onclick="showComplaintInProgressModal()" style="background:#f59e0b; color:white; border:none; display:none;">Mark In Progress</button>
      <div id="btn-waiting-user" style="display:none; font-size: 0.85rem; color: #6b7280; font-style: italic; background: #f3f4f6; padding: 8px 16px; border-radius: 6px;">Waiting for resident rating...</div>
    </div>
  </div>
</div>

{{-- ═══════════════════════════════════════════════════════ --}}
{{-- MARK AS IN PROGRESS MODAL                               --}}
{{-- ═══════════════════════════════════════════════════════ --}}
<div class="cr-modal-overlay" id="complaint-inprogress-overlay">
  <div class="cr-confirm-modal">
    <div class="cr-confirm-icon cr-confirm-icon--approve" style="background: #fffbeb; border-color: #fef3c7;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    </div>
    <div class="cr-confirm-title" style="color: #92400e;">Mark In Progress</div>
    <div class="cr-confirm-message">
      Provide action taken details for complaint
      <strong id="inprogress-complaint-id"></strong>.
    </div>

    <div class="cr-confirm-field" style="margin-top: 12px; text-align: left;">
      <label class="cr-confirm-label" for="complaint-inprogress-notes">
        Action Taken <span class="cr-confirm-required">*</span>
      </label>
      <textarea
        id="complaint-inprogress-notes"
        class="cr-confirm-textarea"
        placeholder="Explain what steps have been taken or how the complaint is resolved..."
        rows="3"
      ></textarea>
      <div class="cr-confirm-error" id="complaint-inprogress-error" style="display:none; color:red; font-size:0.8rem; margin-top:4px;">
        Notes are required to notify the user.
      </div>
    </div>

    <div class="cr-confirm-field" style="margin-top: 12px; text-align: left;">
      <label class="cr-confirm-label" for="complaint-inprogress-proof">
        Attach Photo Proof <span style="font-weight: normal; color: #9ca3af;">(Optional)</span>
      </label>
      <input type="file" id="complaint-inprogress-proof" accept="image/*" style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.85rem;" />
    </div>
    <div class="cr-confirm-actions">
      <button class="cr-btn cr-btn-ghost" onclick="closeComplaintInProgressModal()">Cancel</button>
      <button class="cr-btn cr-btn-approve" id="complaint-inprogress-btn" onclick="showComplaintInProgressConfirmModal()" style="background: #d97706; border-color: #d97706;">
        Continue
      </button>
    </div>
  </div>
</div>

<div class="cr-modal-overlay" id="complaint-inprogress-confirm-overlay">
  <div class="cr-confirm-modal">
    <div class="cr-confirm-icon cr-confirm-icon--approve" style="background: #fffbeb; border-color: #fef3c7;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    </div>
    <div class="cr-confirm-title" style="color: #92400e;">Confirm In Progress</div>
    <div class="cr-confirm-message">
      Are you sure you want this to be marked as In Progress?
    </div>
    <div class="cr-confirm-error" id="complaint-inprogress-confirm-error" style="display:none;">
      Failed to mark complaint as in progress.
    </div>
    <div class="cr-confirm-actions">
      <button class="cr-btn cr-btn-ghost" onclick="closeComplaintInProgressConfirmModal()">Cancel</button>
      <button class="cr-btn cr-btn-approve" id="complaint-inprogress-confirm-btn" onclick="submitComplaintInProgress()" style="background: #d97706; border-color: #d97706;">
        <span id="c-inprogress-text">Confirm</span>
        <span id="c-inprogress-spinner" style="display:none;">Notifying Resident…</span>
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

<script>
document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const viewId = urlParams.get('view');
    if (viewId) {
        setTimeout(() => {
            if (typeof window.openModal === 'function') {
                window.openModal(parseInt(viewId));
            }
        }, 300);
    }
});
</script>

@endsection
