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
          <div class="queue-tag" id="queue-status"> In Progress</div>
          <div class="queue-next" id="queue-next">Next in line: <strong>#008</strong></div>
          <div class="queue-updated" id="queue-updated">Updated just now</div>
        </div>
      </div>

      {{-- Section Header --}}
      <div class="section-header">
        <div class="section-title no-margin-bottom">All Complaints</div>
          <div class="filter-group"> 
            <div class="select-wrapper">
              <select id="filter-status" onchange="renderReportsTable()">
                <option value="">Report Status</option>
                <option> Pending</option>
                <option> In Progress</option>
                <option> Approved</option>
                <option> Rejected</option>
              </select> 
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          
            <div class="select-wrapper">
              <select id="filter-type" onchange="renderReportsTable()">
                <option value="">Complaint Types </option> 
                <option>Peace and Order/ Safety </option>
                <option>Sanitation and Waste Management </option>
                <option>Flooding and Drainage </option>
                <option>Traffic and Road Concerns  </option>
                <option>Animal Related Concerns </option>
                <option>Health and Safety</option>
                <option>Social / Family Concerns or Domestic Issues </option>
                <option>legal/property issue </option>
              </select>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
      </div>

      {{-- Table --}}
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>COMPLAINT TYPE</th>
                <th>SPECIFIC COMPLAINT</th>
                <th>LOCATION</th>
                <th>ADDITIONAL NOTES</th>
                <th>MEDIA</th>
                <th>RESIDENT</th>
                <th>CONTACT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody id="reports-tbody"></tbody>
          </table>
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
          <div class="modal-field"><label>Complaint Subtype</label><p id="md-subtype"></p></div>
          <div class="modal-field"><label>Location</label><p id="md-location"></p></div>
          <div class="modal-field"><label>Additional Notes</label><p id="md-notes"></p></div>
          <div class="modal-field"><label>Contact No.</label><p id="md-contact"></p></div>
          <div class="modal-field"><label>Date Filed</label><p id="md-date"></p></div>
          <div class="modal-field"><label>Updated At</label><p id="md-updated"></p></div>
        </div>
        <div>
          <div class="modal-field"><label>Complainant Name</label><p id="md-name"></p></div>
          <div class="modal-field">
            <label>Complaint Media</label>
            <div class="modal-media">📎 View Uploaded File</div>
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