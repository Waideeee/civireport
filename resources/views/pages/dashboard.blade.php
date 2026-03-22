@extends('layouts.admin')

@section('content')

@vite(['resources/css/app.css', 'resources/css/dashboard.css'])
@vite(['resources/js/app.js' ,'resources/js/dashboard.js'])
<div class="main">
  <div class="topbar">
    <div>
      <h2 id="page-title">Dashboard</h2>
      <p id="page-sub">Welcome back, Admin!</p>
    </div>
    <div class="topbar-date" id="topbar-date"></div>
  </div>

  <div class="content">
    <div class="page active" id="page-dashboard">

      <div class="page-title">Overview</div>
      <div class="section-sub">Here's what's happening in your barangay today.</div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-num" id="stat-pending">0</div>
          <div class="stat-label">Pending Complaints</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" id="stat-inprogress">0</div>
          <div class="stat-label">In Progress Complaints</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" id="stat-approved">0</div>
          <div class="stat-label">Resolved Complaints</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" id="stat-rejected">0</div>
          <div class="stat-label">Rejected Complaints</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" id="stat-total">0</div>
          <div class="stat-label">Total This Month</div>
        </div>
      </div>

      <div class="section-header">
        <div class="section-title">Recent Reports</div>
        <a href="{{ route('Complaints') }}" class="see-all">See all</a>
      </div>
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type of Complaint</th>
                <th>Resident</th>
                <th>Status</th>
                <th>Date Filed</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="recent-tbody">
              <tr><td colspan="6" class="empty-state">No data Available</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="section-header">
        <div class="section-title">Pending Account Approvals</div>
        <a href="{{ route('UserRecords') }}" class="see-all">See all</a>
      </div>
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Date Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="tbody-quickview">
              <tr><td colspan="4" class="empty-state">No data Available</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="section-header">
        <div class="section-title">Registered Residents</div>
        <a href="{{ route('UserRecords') }}" class="see-all">See all</a>
      </div>
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="tbody-residents-quickview">
              <tr><td colspan="3" class="empty-state">No data Available</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="section-header">
        <div class="section-title">Recent Activity</div>
        <a href="{{ route('AuditLog') }}" class="see-all">See all</a>
      </div>
      <div class="table-card">
        <div id="audit-quick-view"></div>
      </div>

      <div class="page-title">Quick Actions</div>
      <div class="quick-actions">
        <a href="{{ route('Complaints') }}" class="qa-btn">View All Reports</a>
        <a href="{{ route('UserRecords') }}" class="qa-btn">Approve Accounts</a>
        <a href="{{ route('UserRecords') }}" class="qa-btn">View Analytics</a>
      </div>

    </div>
  </div>
</div>

@endsection