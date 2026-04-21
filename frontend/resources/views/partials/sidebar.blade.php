@vite(['resources/css/app.css', 'resources/css/sidebar.css'])
@vite(['resources/js/app.js' ,'resources/js/sidebar.js'])

<!-- SIDEBAR -->
<div class="sidebar">
  <div class="sidebar-brand"> 
    <div class="system-logo">
      <img src="{{ asset('images/BarangayLogo.png') }}" alt="Barangay Logo" class="barangay-logo">
    </div>
    <div class="brand-text">
      <h1 class="brand-name">CiviReport</h1>
      <p class="brand-sub">ADMIN PANEL</p>
    </div>
  </div>

  <div class="sidebar-nav">
    <p class="sidebar-section-label">MAIN</p>
    <a @class(['nav-item', 'active' => request()->routeIs('dashboard')]) href="{{ route('dashboard') }}">
      Dashboard
      <span id="sidebar-dashboard-badge" class="sidebar-badge" style="display: none;">0</span>
    </a>
    <a @class(['nav-item', 'active' => request()->routeIs('Complaints')]) href="{{ route('Complaints') }}">Complaints</a>
    <a @class(['nav-item', 'active' => request()->routeIs('Announcements')]) href="{{ route('Announcements') }}">Announcements</a>
    <a @class(['nav-item', 'active' => request()->routeIs('EmergencyReports')]) href="{{ route('EmergencyReports') }}">Emergency Reports</a>

    <p class="sidebar-section-label">USER MANAGEMENT</p>
    <a @class(['nav-item', 'active' => request()->routeIs('UserRecords')]) href="{{ route('UserRecords') }}">User Records</a>

    <p class="sidebar-section-label">LOGS</p>
    <a @class(['nav-item', 'active' => request()->routeIs('AuditLog')]) href="{{ route('AuditLog') }}">Audit Log</a>

    <p class="sidebar-section-label">ANALYTICS</p>
    <a @class(['nav-item', 'active' => request()->routeIs('ReportAnalytics')]) href="{{ route('ReportAnalytics') }}">Report Analytics</a>
  </div>

  <div class="sidebar-footer">
    <div class="sidebar-user-profile" onclick="window.location.href='{{ route('profile.show') }}'">
        @if (Laravel\Jetstream\Jetstream::managesProfilePhotos())
            <img class="profile-photo" src="{{ Auth::user()->profile_photo_url }}" alt="{{ Auth::user()->name }}" />
        @else
            <div class="profile-initial">
                @php
                    $name = Auth::user()->name ?? 'Admin';
                    $words = explode(' ', $name);
                    $initials = count($words) > 1 ? substr($words[0], 0, 1) . substr($words[1], 0, 1) : substr($name, 0, 2);
                @endphp
                {{ strtoupper($initials) }}
            </div>
        @endif
        <div class="profile-details">
            <span class="sidebar-username">{{ Auth::user()->name ?? 'Admin' }}</span>
            <span class="sidebar-role">Administrator</span>
        </div>
    </div>
    
    <form method="POST" action="{{ route('logout') }}" class="logout-form">
        @csrf
        <button type="submit" class="btn-icon-logout" title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
        </button>
    </form>
  </div>
</div>