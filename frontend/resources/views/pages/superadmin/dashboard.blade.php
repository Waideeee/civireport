@extends('layouts.app')

@section('title', 'Super Admin Dashboard')

@section('content')

@vite(['resources/css/app.css', 'resources/css/dashboard.css', 'resources/css/superadmin.css'])
@vite(['resources/js/superadmin-dashboard.js'])

<div class="main">
    <div class="topbar">
        <div class="topbar-left">
            <h2 id="page-title">SUPER ADMIN PANEL</h2>
            <p id="page-sub">System-wide overview and barangay administrator management.</p>
        </div>
        <div class="topbar-right">
            <div class="topbar-date">{{ now()->format('F d, Y') }}</div>
        </div>
    </div>

    <div class="content">
        <div class="page active">
            @if (session('success'))
                <div style="margin-bottom: 20px; padding: 12px 14px; border-radius: 10px; background: #ecfdf5; color: #166534; border: 1px solid #bbf7d0;">
                    {{ session('success') }}
                </div>
            @endif

            <div class="page-title">Overview Statistics</div>
            <div class="section-sub">Real-time status of the CiviReport ecosystem.</div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-num" id="sa-stat-active-admins">{{ $stats['active_admins'] ?? 0 }}</div>
                    <div class="stat-label">Active Barangay Admins</div>
                </div>
                <div class="stat-card">
                    <div class="stat-num" id="sa-stat-inactive-admins">{{ $stats['inactive_admins'] ?? 0 }}</div>
                    <div class="stat-label">Inactive Barangay Admins</div>
                </div>
                <div class="stat-card">
                    <div class="stat-num" id="sa-stat-total-residents">{{ $stats['total_residents'] ?? 0 }}</div>
                    <div class="stat-label">Total Registered Residents</div>
                </div>
                <div class="stat-card">
                    <div class="stat-num" id="sa-stat-total-complaints">{{ $stats['total_complaints'] ?? 0 }}</div>
                    <div class="stat-label">Total Complaints</div>
                </div>
            </div>

            @livewire('super-admin.create-barangay-admin-form')

            <div class="section-header">
                <div class="section-title">Recent Barangay Admin Accounts</div>
                <a href="{{ route('superadmin.admins') }}" class="see-all">View All Admins</a>
            </div>

            <div class="table-card">
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Date Registered</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="sa-admins-tbody">
                            @forelse($allAdmins as $admin)
                                <tr>
                                    <td>{{ $admin['user_name'] }}</td>
                                    <td>{{ $admin['email'] }}</td>
                                    <td>{{ $admin['date_registered'] }}</td>
                                    <td>
                                        <span class="badge {{ $admin['is_active'] ? 'badge-approved' : 'badge-rejected' }}">
                                            {{ $admin['is_active'] ? 'Active' : 'Inactive' }}
                                        </span>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="4" class="empty-state">No barangay admin accounts found.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

@endsection
