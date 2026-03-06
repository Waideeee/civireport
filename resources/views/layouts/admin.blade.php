<!DOCTYPE html>
<html lang="en">
<head>
  @vite(['resources/css/app.css', 'resources/css/sidebar.css', 'resources/css/dashboard.css'])
</head>
<body>

  @include('partials.sidebar')
  @yield('content')   {{-- ← tanggalin ang .main at .content wrapper dito --}}

</body>
</html>