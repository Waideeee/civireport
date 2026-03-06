@extends('layouts.admin')

@section('content')

@vite(['resources/css/app.css', 'resources/css/dashboard.css'])
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

      <div class="section-title">Overview</div>
      <div class="section-sub">Here's what's happening in your barangay today.</div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-num"></div>
          <div class="stat-label">Pending Reports</div>
        </div>
        <div class="stat-card">
          <div class="stat-num"></div>
          <div class="stat-label">Approved Reports</div>
        </div>
        <div class="stat-card">
          <div class="stat-num"></div>
          <div class="stat-label">Rejected Reports</div>
        </div>
        <div class="stat-card">
          <div class="stat-num"></div>
          <div class="stat-label">Total this Month</div>
        </div>
      </div>

      <div class="section-header">
        <div class="section-title">Recent Reports</div>
        <a href="{{ route('ViewReport') }}" class="see-all">See all</a>
      </div>
      <div class="table-card">
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
          <tbody id="recent-tbody"></tbody>
        </table>
      </div>

      <div class="section-header">
        <div class="section-title">Pending Account Approval</div>
        <a href="{{ route('AccountApproval') }}" class="see-all">See all</a>
      </div>
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Date Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="tbody-quickview"></tbody>
        </table>
      </div>

      <div class="section-header">
        <div class="section-title">Registered Residents</div>
        <a href="{{ route('RegisteredResidents') }}" class="see-all">See all</a>
      </div>
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="tbody-residents-quickview"></tbody>
        </table>
      </div>

      <div class="section-header">
        <div class="section-title">Recent Activity</div>
        <a href="{{ route('AuditLog') }}" class="see-all">See all</a>
      </div>
      <div class="table-card">
        <div id="audit-quick-view"></div>
      </div>

      <div class="section-title" style="margin-bottom: 12px;">Quick Actions</div>
      <div class="quick-actions">
        <a href="{{ route('ViewReport') }}" class="qa-btn">View all Reports</a>
        <a href="{{ route('AccountApproval') }}" class="qa-btn">Approve Accounts</a>
        <a href="{{ route('ReportAnalytics') }}" class="qa-btn">View Analytics</a>
      </div>

    </div>
  </div>
</div>

<script>
  const d = new Date();
  document.getElementById('topbar-date').textContent = d.toLocaleDateString('en-PH', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
</script>

@endsection