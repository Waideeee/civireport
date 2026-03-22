@extends('layouts.app') 
@section('content')

@vite(['resources/css/app.css', 'resources/css/UserRecords.css'])

<div class="main">
  <div class="content">

    {{-- ── Pending Account Approvals ── --}}
    <div class="approval-wrapper">
      <div class="approval-title">Pending Account Approvals</div>
      <div class="approval-table">
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

    {{-- ── Registered Residents ── --}}
    <div class="residents-wrapper">
      <div class="residents-title">Registered Residents</div>
      <div class="residents-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Gender</th>
              <th>Address</th>
              <th>Date Approved</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="residents-tbody"></tbody>
        </table>
      </div>
    </div>

  </div>
</div>

@endsection