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
                <th>MEDIA</th>
                <th>RESIDENT</th>
                <th>CONTACT</th>
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

{{-- Modal --}}
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
          <div class="modal-field">
            <label>Complaint Media</label>
            <div class="modal-media">📎 View Uploaded File</div>
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
      <button class="btn btn-ghost" onclick="closeModalDirect()">Close</button>
      <button class="btn btn-download" onclick="downloadComplaint()">⬇ Download</button>
      <button class="btn btn-danger">Reject</button>
      <button class="btn btn-success">Approve</button>
    </div>
  </div>
</div>

@endsection