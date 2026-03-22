@extends('layouts.app')

@section('content')

@vite([ 'resources/css/app.css', 'resources/css/RegisteredResidents.css'])

 <div class="page" id="page-residents">
          <div class="section-title" style="margin-bottom: 16px">
            Registered Residents
          </div>
          <div class="table-card">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Address</th>
                  <th>Date Approved</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="residents-tbody"></tbody>
            </table>
          </div>
        </div>
@endsection