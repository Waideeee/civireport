<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'CiviReport')</title>

    @vite(['resources/css/app.css', 'resources/css/sidebar.css', 'resources/css/dashboard.css', 'resources/css/Announcements.css', 'resources/css/Complaints.css', 'resources/css/AccountApproval.css', 'resources/css/RegisteredResidents.css', 'resources/css/AuditLog.css'])
    @vite([
    'resources/css/Complaints.css',
    'resources/css/UserRecords.css',
    'resources/js/app.js'
    
])

    @stack('styles')
</head>
<body>

    <div class="app-wrapper">
        @include('partials.sidebar')

        <div class="main-content">
            @yield('content')
        </div>
    </div>

    @stack('scripts')

</body>
</html>