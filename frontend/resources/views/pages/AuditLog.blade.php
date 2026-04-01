@extends('layouts.app')

@section('content')

@vite(['resources/css/app.css', 'resources/css/AuditLog.css', 'resources/js/AuditLog.js'])
<div class="main">
    <div class="content" id="page-audit">  
        <div class="section-title">Audit Log</div>
        <div class="table-card">
            <div id="audit-log"></div>
        </div>
    </div>
</div>

@endsection