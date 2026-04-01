@extends('layouts.app') 
@section('content')

@vite(['resources/css/app.css', 'resources/css/UserRecords.css', 'resources/js/app.js', 'resources/js/UserRecords.js'])

<div class="main">
  <div class="content">

    {{-- ── Pending Account Approvals ── --}}
    <div class="approval-wrapper">
      <div class="approval-title">Pending Account Approvals</div>
      <div class="approval-table">

        {{-- Toolbar --}}
        <div class="ur-toolbar">
          <div class="ur-search-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" id="approval-search" class="ur-search" placeholder="Search name, email…" />
          </div>
          <div class="ur-count" id="approval-count">0 records</div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Gender</th>
                <th>Date Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="approval-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>

    {{-- ── Registered Residents ── --}}
    <div class="residents-wrapper">
      <div class="residents-title">Registered Residents</div>
      <div class="residents-table">

        {{-- Toolbar --}}
        <div class="ur-toolbar">
          <div class="ur-search-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" id="residents-search" class="ur-search" placeholder="Search name, email…" />
          </div>
          <div class="ur-count" id="residents-count">0 records</div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Gender</th>
                <th>Address</th>
                <th>Date Registered</th> <th>Date Approved</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="residents-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</div>
{{-- Pass PHP data to JS --}}
<script>
    window.pendingUsers = @json(collect($users)->where('status', 'pending')->values());
    window.approvedUsers = @json(collect($users)->where('status', 'approved')->values());
    window.pendingUsers = @json(collect($users)->where('status', 'pending')->values());
    window.approvedUsers = @json(collect($users)->where('status', 'approved')->values());
    
</script>
@endsection