@vite(['resources/css/app.css', 'resources/css/ReportAnalytics.css', 'resources/js/ReportAnalytics.js'])
@extends('layouts.app')

@section('content')

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script>
  window.__analytics = {
    categoryLabels: @json(data_get($analytics, 'by_category.labels', [])),
    categoryData:   @json(data_get($analytics, 'by_category.values', [])),
    statusLabels:   @json(data_get($analytics, 'by_status.labels', [])),
    statusData:     @json(data_get($analytics, 'by_status.values', [])),
    monthLabels:    @json(data_get($analytics, 'monthly.labels', [])),
    trendData:      @json(data_get($analytics, 'monthly.values', [])),
    summary: {
      total:       {{ data_get($analytics, 'summary.total', 0) }},
      resolved:    {{ data_get($analytics, 'summary.resolved', 0) }},
      pending:     {{ data_get($analytics, 'summary.pending', 0) }},
      in_progress: {{ data_get($analytics, 'summary.in_progress', 0) }},
      rejected:    {{ data_get($analytics, 'summary.rejected', 0) }},
    }
  };
</script>


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
        <div class="stat-num" id="stat-total">{{ data_get($analytics, 'summary.total', 0)}}</div>
        <div class="stat-label">Total Reports</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" id="stat-resolved">{{ data_get($analytics, 'summary.resolved', 0) }}</div>
        <div class="stat-label">Resolved</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" id="stat-pending">{{ data_get($analytics, 'summary.pending', 0) }}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" id="stat-rate">
          @php
           $total    = data_get($analytics, 'summary.total', 0);
            $resolved = data_get($analytics, 'summary.resolved', 0);
            echo $total > 0 ? round(($resolved / $total) * 100) . '%' : '0%';
          @endphp
        </div>
        <div class="stat-label">Resolution Rate</div>
      </div>
    </div>

        <section class="ai-insight-card" id="analyticsInsight" aria-live="polite">
      <div class="ai-insight-header">
        <div class="ai-insight-header-top">
          <div class="ai-insight-eyebrow">AI Insight</div>
          <div class="ai-insight-meta" id="analyticsInsightMeta">Generating analysis...</div>
        </div>
        <div class="ai-insight-heading">Barangay Report Interpretation</div>
      </div>

      <div class="ai-insight-content ai-insight-loading" id="analyticsInsightContent">
        <div class="ai-skeleton ai-skeleton-title"></div>
        <div class="ai-skeleton ai-skeleton-line"></div>
        <div class="ai-skeleton ai-skeleton-line ai-skeleton-line-short"></div>
        <div class="ai-skeleton ai-skeleton-card"></div>
        <div class="ai-skeleton ai-skeleton-card"></div>
      </div>
    </section>

    <div class="analytics-charts">
      <div class="chart-card">
        <div class="chart-title">Reports by Category</div>
        <div class="chart-container">
          <canvas id="chartCategory"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Reports by Status</div>
        <div class="chart-container">
          <canvas id="chartStatus"></canvas>
        </div>
      </div>
      <div class="chart-card chart-full">
        <div class="chart-title">Monthly Reports Trend</div>
        <div class="chart-container trend">
          <canvas id="chartTrend"></canvas>
        </div>
      </div>
    </div>

  </div>
</div>

@endsection 