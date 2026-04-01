@vite(['resources/css/app.css', 'resources/css/sidebar.css'])
@vite(['resources/js/app.js' ,'resources/js/sidebar.js'])

<!-- SIDEBAR -->
<div class="sidebar">
  <div class="sidebar-brand"> 
    <div class="System-logo">
    <img src="{{ asset ('images/BarangayLogo.png')}}" alt="Barangay Logo" class="barangay-logo">
    </div>
    <h1 class="brand-name">CiviReport</h1>
    <p class="brand-sub">ADMIN PANEL</p>
  </div>

  <div class="sidebar-nav">
    <p class="sidebar-section-label">MAIN</p>
    <a @class(['nav-item', 'active' => request()->routeIs('dashboard')]) href="{{ route('dashboard') }}">Dashboard</a>
    <a @class(['nav-item', 'active' => request()->routeIs('Complaints')]) href="{{ route('Complaints') }}">Complaints</a>
    <a @class(['nav-item', 'active' => request()->routeIs('Announcements')]) href="{{ route('Announcements') }}">Announcements</a>

    <p class="sidebar-section-label">USER MANAGEMENT</p>
    <a @class(['nav-item', 'active' => request()->routeIs('UserRecords')]) href="{{ route('UserRecords') }}">User Records</a>

    <p class="sidebar-section-label">LOGS</p>
    <a @class(['nav-item', 'active' => request()->routeIs('AuditLog')]) href="{{ route('AuditLog') }}">Audit Log</a>

    <p class="sidebar-section-label">ANALYTICS</p>
    <a @class(['nav-item', 'active' => request()->routeIs('ReportAnalytics')]) href="{{ route('ReportAnalytics') }}">Reports Analytics</a>
  </div>

  <div class="sidebar-footer">
    <span class="sidebar-username">Admin</span>
    <button class="btn btn-logout">Logout</button>
  </div>
</div>