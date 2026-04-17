@extends('layouts.app')

@section('content')

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script>
  window.__analytics = {
    categoryLabels: @json($byType->keys()),
    categoryData:   @json($byType->values()),
    statusLabels:   @json($byStatus->keys()),
    statusData:     @json($byStatus->values()),
    monthLabels:    @json($months),
    trendData:      @json($trendData),
    stats: {
      total:    {{ $stats['total_complaints'] ?? 0 }},
      resolved: {{ $stats['resolved_complaints'] ?? 0 }},
      pending:  {{ $stats['pending_complaints'] ?? 0 }},
    }
  };
</script>

@vite(['resources/css/app.css', 'resources/css/ReportAnalytics.css', 'resources/js/ReportAnalytics.js'])

<div class="main">
  <div class="content">

    <div class="analytics-header">
      <div>
        <div class="section-title">Analytics and Charts</div>
        <div class="section-sub">Summary of complaints across all categories.</div>
      </div>
      <button class="btn-download" onclick="downloadAnalytics()">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download Report
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-num" id="stat-total">{{ $stats['total_complaints'] ?? 0 }}</div>
        <div class="stat-label">Total Reports</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" id="stat-resolved">{{ $stats['resolved_complaints'] ?? 0 }}</div>
        <div class="stat-label">Resolved</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" id="stat-pending">{{ $stats['pending_complaints'] ?? 0 }}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" id="stat-rate">
          @php
            $total    = $stats['total_complaints'] ?? 0;
            $resolved = $stats['resolved_complaints'] ?? 0;
            echo $total > 0 ? round(($resolved / $total) * 100) . '%' : '0%';
          @endphp
        </div>
        <div class="stat-label">Resolution Rate</div>
      </div>
    </div>

    <div class="analytics-charts">
      <div class="chart-card">
        <div class="chart-title">Reports by Category</div>
        <canvas id="chartCategory"></canvas>
      </div>
      <div class="chart-card">
        <div class="chart-title">Reports by Status</div>
        <canvas id="chartStatus"></canvas>
      </div>
      <div class="chart-card chart-full">
        <div class="chart-title">Monthly Reports Trend</div>
        <canvas id="chartTrend"></canvas>
      </div>
    </div>

  </div>
</div>

@endsection