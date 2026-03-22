@extends('layouts.app') 
@section('content')

@vite(['resources/css/app.css', 'resources/css/AccountApproval.css'])

        <div class="page" id="page-approval">
            
    {{-- ── Header ── --}}
          <div class="section-title" style="margin-bottom: 16px">
            Pending Account Approvals
          </div>
          <div class="table-card">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Date Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="approval-tbody"></tbody>
            </table>
          </div>
        </div>

@endsection
