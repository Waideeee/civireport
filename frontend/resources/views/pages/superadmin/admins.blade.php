@extends('layouts.app')

@section('title', 'All Barangay Admins')

@section('content')

@vite(['resources/css/app.css', 'resources/css/dashboard.css', 'resources/css/superadmin.css'])

<div class="main">
    <div class="topbar">
        <div class="topbar-left">
            <h2 id="page-title">BARANGAY ADMINISTRATORS</h2>
            <p id="page-sub">Manage all barangay admin accounts across the system.</p>
        </div>
        <div class="topbar-right">
            <div class="topbar-date">{{ now()->format('F d, Y') }}</div>
        </div>
    </div>

    <div class="content">
        <div class="page active">
            <div class="section-header">
                <div class="section-title">All Barangay Admins</div>
                <div class="toolbar-filters" style="display: flex; gap: 15px;">
                    <select id="admins-status-filter" class="al-select qa-btn">
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="deactivated">Deactivated</option>
                    </select>
                    <div class="search-box">
                        <input type="text" id="admin-search" placeholder="Search by Name or Email..." class="qa-btn" style="padding: 8px 15px; border-radius: 8px; width: 300px;">
                    </div>
                </div>
            </div>
            
            <div class="table-card">
                <div class="table-wrap">
                    <table id="admins-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Barangay</th>
                                <th>Date Registered</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="admins-tbody">
                            @forelse($allAdmins as $admin)
                            <tr class="admin-row" 
                                data-status="{{ $admin['is_active'] ? 'active' : 'deactivated' }}"
                                data-name="{{ strtolower($admin['user_name'] ?? '') }}" 
                                data-email="{{ strtolower($admin['email'] ?? '') }}" 
                                data-details="{{ json_encode([
                                    'user_name' => $admin['user_name'],
                                    'email' => $admin['email'],
                                    'gender' => $admin['gender'] ?? 'N/A',
                                    'contact_num' => $admin['contact_num'] ?? 'N/A',
                                    'barangay' => $admin['barangay'] ?? 'N/A',
                                    'address' => $admin['address'] ?? 'N/A',
                                    'date_registered' => $admin['date_registered'],
                                    'is_active' => $admin['is_active'],
                                    'profile_photo_url' => $admin['profile_photo_url'] ?? null
                                ]) }}">
                                <td>{{ $admin['user_name'] }}</td>
                                <td>{{ $admin['email'] }}</td>
                                <td>{{ $admin['barangay'] ?? $admin['address'] ?? 'N/A' }}</td>
                                <td>{{ $admin['date_registered'] }}</td>
                                <td>
                                    <span class="status-badge-container">
                                        <span class="badge {{ $admin['is_active'] ? 'badge-approved' : 'badge-rejected' }}">
                                            {{ $admin['is_active'] ? 'Active' : 'Inactive' }}
                                        </span>
                                    </span>
                                </td>
                                <td>
                                    <div class="actions-cell">
                                        @if($admin['is_active'])
                                        <button type="button" class="btn-deactivate btn-confirm-deactivate" 
                                                data-id="{{ $admin['user_id'] }}" 
                                                data-name="{{ $admin['user_name'] }}">Deactivate</button>
                                        @else
                                        <form action="{{ route('superadmin.users.activate', $admin['user_id']) }}" method="POST">
                                            @csrf @method('PATCH')
                                            <button type="submit" class="btn-activate">Reactivate</button>
                                        </form>
                                        @endif
                                    </div>
                                </td>
                            </tr>
                            @empty
                            <tr id="empty-row">
                                <td colspan="6" class="empty-state">No barangay admins found.</td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Details Modal -->
<div id="admin-details-modal" class="modal-overlay" style="display: none;">
    <div class="modal">
        <div class="modal-header">
            <h3>Admin Profile Details</h3>
            <span class="modal-close">&times;</span>
        </div>
        <div class="modal-body">
            <div class="admin-profile-header" style="text-align: center; margin-bottom: 20px;">
                <img id="modal-photo" src="" alt="Profile Photo" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #1E3A8A; margin-bottom: 10px;">
                <h2 id="modal-name" style="margin: 0; color: #1E3A8A;"></h2>
                <span id="modal-role-badge" class="badge badge-approved" style="margin-top: 5px; display: inline-block;">Barangay Admin</span>
            </div>
            <div class="admin-details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="detail-item">
                    <label style="font-weight: 600; color: #64748b; font-size: 0.85rem;">EMAIL</label>
                    <p id="modal-email" style="margin: 5px 0 0 0;"></p>
                </div>
                <div class="detail-item">
                    <label style="font-weight: 600; color: #64748b; font-size: 0.85rem;">GENDER</label>
                    <p id="modal-gender" style="margin: 5px 0 0 0;"></p>
                </div>
                <div class="detail-item">
                    <label style="font-weight: 600; color: #64748b; font-size: 0.85rem;">BARANGAY ASSIGNMENT</label>
                    <p id="modal-barangay" style="margin: 5px 0 0 0;"></p>
                </div>
                <div class="detail-item">
                    <label style="font-weight: 600; color: #64748b; font-size: 0.85rem;">CONTACT NUMBER</label>
                    <p id="modal-contact" style="margin: 5px 0 0 0;"></p>
                </div>
                <div class="detail-item" style="grid-column: span 2;">
                    <label style="font-weight: 600; color: #64748b; font-size: 0.85rem;">ADDRESS</label>
                    <p id="modal-address" style="margin: 5px 0 0 0;"></p>
                </div>
                <div class="detail-item">
                    <label style="font-weight: 600; color: #64748b; font-size: 0.85rem;">DATE REGISTERED</label>
                    <p id="modal-date" style="margin: 5px 0 0 0;"></p>
                </div>
                <div class="detail-item">
                    <label style="font-weight: 600; color: #64748b; font-size: 0.85rem;">STATUS</label>
                    <p id="modal-status" style="margin: 5px 0 0 0;"></p>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Deactivate Confirmation Modal -->
<div id="deactivate-modal" class="modal-overlay" style="display: none;">
    <div class="modal">
        <div class="modal-header">
            <h3>Deactivate Admin Account</h3>
            <span class="modal-close">&times;</span>
        </div>
        <div class="modal-body">
            <p>Are you sure you want to deactivate <strong id="deactivate-admin-name"></strong>'s account?</p>
        </div>
        <div class="modal-footer">
            <button class="qa-btn modal-cancel-btn" style="background: #f3f4f6; color: #374151; margin-right: 10px;">Cancel</button>
            <form id="deactivate-form" action="" method="POST" style="display: inline;">
                @csrf @method('PATCH')
                <button type="submit" class="qa-btn" style="background: #ef4444; color: white;">Deactivate</button>
            </form>
        </div>
    </div>
</div>

@vite(['resources/js/superadmin-admins.js'])

@endsection
