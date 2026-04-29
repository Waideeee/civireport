@extends('layouts.app')

@section('title', 'Audit Logs')

@section('content')

@vite(['resources/css/app.css', 'resources/css/AuditLog.css', 'resources/js/superadmin-audit.js'])

<div class="main">
    <div class="content" id="page-audit">
        <div class="section-title">Audit Logs</div>
        <div class="table-card">
            <div id="superadmin-audit-log"></div>
        </div>
    </div>
</div>

@endsection
