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
           'resources/css/AuditLog.css', 
           'resources/css/Complaints.css']) 
    <!-- @vite(['resources/js/app.js', 'resources/js/dashboard.js']) -->

    @stack('styles')
</head>
<body>

    @include('partials.sidebar')

    @yield('content')
     @vite(['resources/js/dashboard.js']) 
    @stack('scripts')

</body>
</html>