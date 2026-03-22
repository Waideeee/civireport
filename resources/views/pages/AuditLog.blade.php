@extends('layouts.app')

@section('content')

@vite([ 'resources/css/app.css', 'resources/css/AuditLog.css'])

        <div class="page" id="page-audit">
          <div class="section-title" style="margin-bottom: 16px">Audit Log</div>
          <div class="table-card" style="padding: 0 24px">
            <div id="audit-log"></div>
          </div>
        </div>

@endsection