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
    'resources/js/emergency-alert.js',
    'resources/js/global-notifications.js'
])

    @livewireStyles
    @stack('styles')
</head>
<body>

    <div class="app-wrapper">
        @include('partials.sidebar')

        <div class="main-content">
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