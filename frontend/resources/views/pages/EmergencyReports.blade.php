@extends('layouts.app')

@section('content')

@vite(['resources/css/app.css' , 'resources/css/EmergencyReports.css', 'resources/js/app.js', 'resources/js/EmergencyReports.js'])

  <div class="content">
    <div class="page active" id="page-reports">

      {{-- Section Header --}}
      <div class="section-header">
        <div class="section-title no-margin-bottom">Emergency Reports</div>
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
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
              <option value="false_alarm">False Alarm</option>
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
                <th>RESIDENT</th>
                <th>LOCATION</th>
                <th>REPORTED AT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody id="emergency-tbody"></tbody>
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

{{-- ═══════════════════════════════════════════════════════ --}}
{{-- EMERGENCY DETAIL MODAL                                  --}}
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
          <div class="modal-field"><label>Resident Name</label><p id="md-name"></p></div>
          <div class="modal-field"><label>Contact No.</label><p id="md-contact"></p></div>
          <div class="modal-field"><label>Location</label><p id="md-location"></p></div>
        </div>
        <div>
          <div class="modal-field"><label>Date Reported</label><p id="md-date"></p></div>
          <div class="modal-field"><label>Resolved At</label><p id="md-resolved"></p></div>
        </div>
      </div>
      <div class="modal-field" style="margin-top: 15px;">
        <label>Acknowledge Notes</label>
        <p id="md-notes" class="modal-notes-box"></p>
      </div>
      <div class="modal-field" style="margin-top: 15px;" id="md-resolution-container">
        <label>Resolution Notes</label>
        <p id="md-resolution-notes" class="modal-notes-box"></p>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-download" onclick="downloadEmergencyReport()">Download PDF</button>
      <button class="btn btn-danger" id="btn-false-alarm" onclick="showEmergencyFalseAlarmModal()">False Alarm</button>
      <button class="btn btn-success" id="btn-resolve" onclick="showEmergencyResolveModal()">Mark as Resolved</button>
    </div>
  </div>
</div>

{{-- ═══════════════════════════════════════════════════════ --}}
{{-- EMERGENCY RESOLVE CONFIRMATION MODAL                    --}}
{{-- ═══════════════════════════════════════════════════════ --}}
<div class="cr-modal-overlay" id="emergency-resolve-overlay">
  <div class="cr-confirm-modal">
    <div class="cr-confirm-icon cr-confirm-icon--approve">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    </div>
    <div class="cr-confirm-title">Resolve Emergency</div>
    <div class="cr-confirm-message">
      Are you sure you want to mark emergency
      <strong id="resolve-emergency-id"></strong> as resolved?
    </div>

    <div class="cr-confirm-field" style="margin-top: 12px; text-align: left;">
      <label class="cr-confirm-label" for="emergency-action-notes">
        Resolution Notes <span class="cr-confirm-required">*</span>
      </label>
      <textarea
        id="emergency-action-notes"
        class="cr-confirm-textarea"
        placeholder="Detail how this emergency was resolved..."
        rows="3"
      ></textarea>
      <div class="cr-confirm-error" id="emergency-action-error" style="display:none; color:red; font-size:0.8rem; margin-top:4px;">
        Please provide resolution notes.
      </div>
    </div>

    <div class="cr-confirm-actions">
      <button class="cr-btn cr-btn-ghost" onclick="closeEmergencyResolveModal()">Cancel</button>
      <button class="cr-btn cr-btn-approve" id="emergency-resolve-btn" onclick="submitEmergencyResolve()">
        <span id="e-resolve-text">Yes, Resolve</span>
        <span id="e-resolve-spinner" style="display:none;">Processing…</span>
      </button>
    </div>
  </div>
</div>

{{-- ═══════════════════════════════════════════════════════ --}}
{{-- EMERGENCY FALSE ALARM CONFIRMATION MODAL                --}}
{{-- ═══════════════════════════════════════════════════════ --}}
<div class="cr-modal-overlay" id="emergency-falsealarm-overlay">
  <div class="cr-confirm-modal">
    <div class="cr-confirm-icon cr-confirm-icon--reject">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    </div>
    <div class="cr-confirm-title">Mark as False Alarm</div>
    <div class="cr-confirm-message">
      Are you sure you want this to update the status of emergency
      <strong id="falsealarm-emergency-id"></strong> as false alarm?
    </div>

    <div class="cr-confirm-field" style="margin-top: 12px; text-align: left;">
      <label class="cr-confirm-label" for="emergency-falsealarm-notes">
        Reason <span class="cr-confirm-required">*</span>
      </label>
      <textarea
        id="emergency-falsealarm-notes"
        class="cr-confirm-textarea"
        placeholder="Detail the reason for marking this as a false alarm..."
        rows="3"
      ></textarea>
      <div class="cr-confirm-error" id="emergency-falsealarm-error" style="display:none; color:red; font-size:0.8rem; margin-top:4px;">
        Please provide a reason.
      </div>
    </div>

    <div class="cr-confirm-actions" style="margin-top: 20px;">
      <button class="cr-btn cr-btn-ghost" onclick="closeEmergencyFalseAlarmModal()">Cancel</button>
      <button class="cr-btn cr-btn-reject" id="emergency-falsealarm-btn" onclick="submitEmergencyFalseAlarm()">
        <span id="e-falsealarm-text">Yes, Mark as False Alarm</span>
        <span id="e-falsealarm-spinner" style="display:none;">Processing…</span>
      </button>
    </div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>

@endsection
