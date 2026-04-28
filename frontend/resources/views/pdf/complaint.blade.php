<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Complaint Report #{{ str_pad($complaint['complaint_id'] ?? 0, 3, '0', STR_PAD_LEFT) }}</title>
    <style>
        @page {
            margin: 34px 36px 70px;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: DejaVu Sans, Helvetica, Arial, sans-serif;
            color: #1f2937;
            font-size: 12px;
            line-height: 1.45;
            background: #ffffff;
        }

        .report-shell {
            width: 100%;
        }

        .report-header {
            border-bottom: 2px solid #1d4ed8;
            padding-bottom: 16px;
            margin-bottom: 22px;
        }

        .report-brand {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #1d4ed8;
            margin-bottom: 6px;
        }

        .report-title {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 6px;
        }

        .report-subtitle {
            margin: 0;
            font-size: 11px;
            color: #64748b;
        }

        .summary-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 18px;
        }

        .summary-card {
            width: 48%;
            vertical-align: top;
            border: 1px solid #dbe4f0;
            background: #f8fbff;
            padding: 14px 16px;
        }

        .summary-spacer {
            width: 4%;
        }

        .summary-label {
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 4px;
        }

        .summary-value {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 12px;
        }

        .meta-line {
            margin: 0 0 4px;
            font-size: 11px;
            color: #475569;
        }

        .meta-line strong {
            color: #0f172a;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border: 1px solid transparent;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
        }

        .status-pending {
            background: #fef3c7;
            border-color: #fcd34d;
            color: #92400e;
        }

        .status-progress {
            background: #dbeafe;
            border-color: #93c5fd;
            color: #1d4ed8;
        }

        .status-resolved {
            background: #dcfce7;
            border-color: #86efac;
            color: #166534;
        }

        .status-rejected {
            background: #fee2e2;
            border-color: #fca5a5;
            color: #991b1b;
        }

        .section {
            margin-bottom: 18px;
            page-break-inside: avoid;
        }

        .section-title {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            padding: 0 0 8px;
            margin: 0 0 10px;
            border-bottom: 1px solid #dbe4f0;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .data-table tr:nth-child(odd) td,
        .data-table tr:nth-child(odd) th {
            background: #f8fafc;
        }

        .data-table th,
        .data-table td {
            padding: 9px 10px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
            text-align: left;
            word-wrap: break-word;
        }

        .data-table th {
            width: 30%;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            background: #f1f5f9;
        }

        .data-table td {
            font-size: 12px;
            color: #0f172a;
        }

        .note-block {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            padding: 12px 14px;
            color: #334155;
            white-space: pre-line;
        }

        .note-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            margin: 0 0 6px;
        }

        .history-list {
            margin: 0;
            padding: 0;
            list-style: none;
        }

        .history-item {
            border: 1px solid #dbe4f0;
            background: #ffffff;
            padding: 12px 14px;
            margin-bottom: 10px;
            page-break-inside: avoid;
        }

        .history-top {
            margin-bottom: 8px;
        }

        .history-title {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 3px;
        }

        .history-meta {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
        }

        .history-arrow {
            color: #1d4ed8;
            font-weight: 700;
        }

        .footer {
            position: fixed;
            left: 0;
            right: 0;
            bottom: -36px;
            border-top: 1px solid #dbe4f0;
            padding-top: 8px;
            font-size: 10px;
            color: #64748b;
            text-align: center;
        }
    </style>
</head>
<body>
@php
    $complaintId = str_pad($complaint['complaint_id'] ?? 0, 3, '0', STR_PAD_LEFT);
    $status = $complaint['complaint_status'] ?? 'pending';
    $statusLabel = strtoupper(str_replace('_', ' ', $status));
    $statusClass = match ($status) {
        'pending' => 'status-pending',
        'in_progress' => 'status-progress',
        'resolved', 'approved' => 'status-resolved',
        default => 'status-rejected',
    };
    $generatedAt = now()->format('M d, Y h:i A');
@endphp

<div class="report-shell">
    <div class="report-header">
        <div class="report-brand">CiviReport</div>
        <h1 class="report-title">Official Complaint Report</h1>
        <p class="report-subtitle">Prepared for barangay case documentation and complaint status tracking.</p>

        <table class="summary-table">
            <tr>
                <td class="summary-card">
                    <div class="summary-label">Complaint Reference</div>
                    <div class="summary-value">#{{ $complaintId }}</div>
                    <p class="meta-line"><strong>Date Filed:</strong> {{ $complaint['complaint_date'] ?? 'N/A' }}</p>
                    <p class="meta-line"><strong>Urgency Level:</strong> {{ $complaint['urgency_level'] ?? 'N/A' }}</p>
                </td>
                <td class="summary-spacer"></td>
                <td class="summary-card">
                    <div class="summary-label">Current Status</div>
                    <div class="summary-value">
                        <span class="status-badge {{ $statusClass }}">{{ $statusLabel }}</span>
                    </div>
                    <p class="meta-line"><strong>Generated:</strong> {{ $generatedAt }}</p>
                    <p class="meta-line"><strong>System:</strong> Barangay Complaint Monitoring</p>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">Complainant Details</h2>
        <table class="data-table">
            <tr>
                <th>Name</th>
                <td>{{ $complaint['user_name'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <th>Contact Number</th>
                <td>{{ $complaint['contact_num'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <th>Complaint Location</th>
                <td>{{ $complaint['complaint_location'] ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">Complaint Information</h2>
        <table class="data-table">
            <tr>
                <th>Complaint Type</th>
                <td>{{ $complaint['complaint_type'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <th>Complaint Subtype</th>
                <td>{{ $complaint['complaint_subtype'] ?? 'N/A' }}</td>
            </tr>
        </table>
        <div style="margin-top: 10px;">
            <p class="note-label">Additional Notes</p>
            <div class="note-block">{{ $complaint['additional_notes'] ?: 'No additional notes provided.' }}</div>
        </div>
    </div>

    @if(!empty($complaint['resolved_notes']))
        <div class="section">
            <h2 class="section-title">Resolution Details</h2>
            <div class="note-block">{{ $complaint['resolved_notes'] }}</div>
        </div>
    @endif

    @if(!empty($complaint['service_rating']) || !empty($complaint['revision_feedback']))
        <div class="section">
            <h2 class="section-title">Resident Feedback</h2>
            <table class="data-table">
                <tr>
                    <th>Service Rating</th>
                    <td>{{ $complaint['service_rating'] ? $complaint['service_rating'].' / 5 Stars' : 'No rating submitted.' }}</td>
                </tr>
            </table>
            <div style="margin-top: 10px;">
                <p class="note-label">Feedback Notes</p>
                <div class="note-block">{{ $complaint['revision_feedback'] ?: 'No feedback provided.' }}</div>
            </div>
        </div>
    @endif

    <div class="section">
        <h2 class="section-title">Complaint History</h2>
        @if(!empty($history))
            <ul class="history-list">
                @foreach($history as $entry)
                    <li class="history-item">
                        <div class="history-top">
                            <p class="history-title">{{ $entry['admin_name'] ?: 'System' }}</p>
                            <div class="history-meta">
                                {{ $entry['audit_date'] ?: 'No date recorded' }}
                                |
                                {{ strtoupper(str_replace('_', ' ', $entry['old_status'] ?: 'N/A')) }}
                                <span class="history-arrow">-></span>
                                {{ strtoupper(str_replace('_', ' ', $entry['new_status'] ?: 'N/A')) }}
                            </div>
                        </div>
                        <div class="note-block">{{ $entry['action_notes'] ?: 'No notes provided.' }}</div>
                    </li>
                @endforeach
            </ul>
        @else
            <div class="note-block">No complaint history recorded yet.</div>
        @endif
    </div>
</div>

<div class="footer">
    This is a computer-generated document from CiviReport. Generated on {{ $generatedAt }}.
</div>
</body>
</html>
