<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'CiviReport')</title>

    @vite(['resources/css/app.css',
     'resources/css/sidebar.css',
      'resources/css/dashboard.css', 
      'resources/css/Announcements.css', 
      'resources/css/Complaints.css', 
       'resources/css/AuditLog.css', 
       'resources/css/UserRecords.css',
       'resources/css/emergency-alert.css'
       ])
    @vite([
    'resources/js/app.js',
    'resources/js/sidebar.js',
    'resources/js/emergency-alert.js',
    'resources/js/global-notifications.js'
])

    <script>
        window.CiviReport = {
            user: {
                role: '{{ strtolower(auth()->user()->role ?? "") }}'
            }
        };
    </script>
    @livewireStyles
    @stack('styles')
</head>
<body>

    <div class="app-wrapper">
        @include('partials.sidebar')

        <div class="main-content">
            @auth
                @if(in_array(strtolower(auth()->user()->role ?? ''), ['barangay_admin', 'superadmin']) && !auth()->user()->two_factor_confirmed_at)
                    <div style="
                        width: 100%;
                        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                        border-bottom: 2px solid #f59e0b;
                        padding: 12px 24px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        font-family: 'Montserrat', sans-serif;
                        font-size: 13px;
                        color: #78350f;
                        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
                        flex-shrink: 0;
                    ">
                        <span style="
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            width: 32px;
                            height: 32px;
                            background: #f59e0b;
                            border-radius: 50%;
                            flex-shrink: 0;
                            font-size: 15px;
                            line-height: 1;
                        ">⚠️</span>
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span style="font-weight: 700; color: #92400e; letter-spacing: 0.01em;">Security Notice:</span>
                            <span style="color: #78350f;">Two-factor authentication is not enabled on your account.</span>
                            <a href="/user/two-factor-authentication" style="
                                display: inline-flex;
                                align-items: center;
                                gap: 5px;
                                background: #f59e0b;
                                color: #ffffff;
                                font-weight: 600;
                                font-size: 12px;
                                padding: 5px 14px;
                                border-radius: 6px;
                                text-decoration: none;
                                letter-spacing: 0.02em;
                                transition: background 0.15s;
                                white-space: nowrap;
                            "
                            onmouseover="this.style.background='#d97706'"
                            onmouseout="this.style.background='#f59e0b'">
                                Enable 2FA
                            </a>
                        </div>
                    </div>
                @endif
            @endauth

            @yield('content')
            {{ $slot ?? '' }}
        </div>
    </div>

    <!-- Global Emergency Alert Modal -->
    <div id="global-emergency-modal" class="emergency-modal-overlay" style="display: none;">
        <div class="emergency-modal-container">
            <div class="emergency-modal-header">
                <div class="pulsing-red-circle"></div>
                <h2>EMERGENCY ALERT</h2>
            </div>
            <div class="emergency-modal-body">
                <div class="emergency-resident-photo">
                    <img id="emergency-resident-img" src="" alt="Resident Photo" />
                </div>
                <div class="emergency-details">
                    <p><strong>Resident:</strong> <span id="emergency-resident-name"></span></p>
                    <p><strong>Contact:</strong> <span id="emergency-resident-contact"></span></p>
                    <p><strong>Location:</strong> <span id="emergency-location"></span></p>
                    <p><strong>Reported At:</strong> <span id="emergency-time"></span></p>
                </div>
            </div>
            <div class="emergency-modal-footer">
                <button id="btn-respond-emergency" class="btn-respond">Acknowledge & Respond</button>
            </div>
        </div>
    </div>

    @livewireScripts
    @stack('scripts')

</body>
</html>