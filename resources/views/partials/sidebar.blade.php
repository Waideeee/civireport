    @vite(['resources/css/app.css', 'resources/css/sidebar.css'])
      <!-- SIDEBAR -->
  <div class="sidebar">
    <div class="sidebar-brand">
      <h1 class="brand-name">CiviReport</h1>
      <p class="brand-sub">ADMIN PANEL</p>
    </div>

    <div class="sidebar-nav">
      <p class="sidebar-section-label">MAIN</p>
      <a class="nav-item active" href="#">Dashboard</a>
      <a class="nav-item" href="{{ route('ViewReport')}}">View Reports</a>
      <a href="{{ route('Announcements')}}" class="nav-item">Announcements</a>

      <p class="sidebar-section-label">ACCOUNTS</p>
      <a class="nav-item" href="{{ route('AccountApproval') }}">Account Approval</a>
      <a class="nav-item" href="{{ route('RegisteredResidents') }}">Registered Residents</a>

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

