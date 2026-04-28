@extends('layouts.app')

@section('title', 'Super Admin Audit Log')

@section('content')

@vite(['resources/css/app.css', 'resources/css/AuditLog.css', 'resources/js/superadmin-audit.js'])

<div class="main">
    <div class="content" id="page-audit">  
        <div class="section-title">Super Admin Audit Log</div>
        <div class="table-card">
            <div id="superadmin-audit-log"></div>
        </div>
    </div>
</div>

@endsection
