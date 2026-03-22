@vite(['resources/css/app.css', 'resources/css/sidebar.css'])
@vite(['resources/js/app.js' ,'resources/js/sidebar.js'])

<!-- SIDEBAR -->
<div class="sidebar">
  <div class="sidebar-brand">
    <h1 class="brand-name">CiviReport</h1>
    <p class="brand-sub">ADMIN PANEL</p>
  </div>

  <div class="sidebar-nav">
    <p class="sidebar-section-label">MAIN</p>
    <a class="nav-item active" href="{{ route('dashboard') }}">Dashboard</a>
    <a class="nav-item" href="{{ route('Complaints')}}">Complaints</a>
    <a href="{{ route('Announcements')}}" class="nav-item">Announcements</a>

    <p class="sidebar-section-label">USER MANAGEMENT</p>
    <a class="nav-item" href="{{ route('UserRecords') }}">User Records</a>

    <p class="sidebar-section-label">LOGS</p>
    <a class="nav-item" href="{{ route('AuditLog') }}">Audit Log</a>

    <p class="sidebar-section-label">ANALYTICS</p>
    <a class="nav-item" href="{{ route('ReportAnalytics') }}">Reports Analytics</a>
  </div>

  <div class="sidebar-footer">
    <span class="sidebar-username">Admin</span>
    <button class="btn btn-logout">Logout</button>
  </div>
</div>