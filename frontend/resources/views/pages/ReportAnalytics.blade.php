@vite(['resources/css/app.css', 'resources/css/ReportAnalytics.css', 'resources/js/app.js', 'resources/js/ReportAnalytics.js'])
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
    serviceRatingLabels: @json(data_get($analytics, 'service_rating_distribution.labels', [])),
    serviceRatingData:   @json(data_get($analytics, 'service_rating_distribution.values', [])),
    summary: {
      total:       {{ data_get($analytics, 'summary.total', 0) }},
      resolved:    {{ data_get($analytics, 'summary.resolved', 0) }},
      pending:     {{ data_get($analytics, 'summary.pending', 0) }},
      in_progress: {{ data_get($analytics, 'summary.in_progress', 0) }},
      rejected:    {{ data_get($analytics, 'summary.rejected', 0) }},
    }
  };
</script>


@php
  // ── Category chart explanation ──────────────────────────────────────────
  $catLabels = data_get($analytics, 'by_category.labels', []);
  $catValues = data_get($analytics, 'by_category.values', []);
  if (!empty($catValues) && array_sum($catValues) > 0) {
    $maxCatVal = max($catValues);
    $maxCatIdx = array_search($maxCatVal, $catValues);
    $minCatVal = min($catValues);
    $minCatIdx = array_search($minCatVal, $catValues);
    $catExplanation = 'The "' . ($catLabels[$maxCatIdx] ?? '') . '" category has the highest number of complaints with ' . $maxCatVal . ' cases.';
    if ($maxCatIdx !== $minCatIdx) {
      $catExplanation .= ' The lowest is "' . ($catLabels[$minCatIdx] ?? '') . '" with ' . $minCatVal . ' cases.';
    }
  } else {
    $catExplanation = 'No sufficient complaints yet to identify the leading category.';
  }

  // ── Status chart explanation ─────────────────────────────────────────────
  $summTotal    = (int) data_get($analytics, 'summary.total', 0);
  $summResolved = (int) data_get($analytics, 'summary.resolved', 0);
  $summPending  = (int) data_get($analytics, 'summary.pending', 0);
  $summInProg   = (int) data_get($analytics, 'summary.in_progress', 0);
  $summRejected = (int) data_get($analytics, 'summary.rejected', 0);
  $resRate      = $summTotal > 0 ? round(($summResolved / $summTotal) * 100) : 0;
  if ($summTotal > 0) {
    $statusExplanation = "Out of {$summTotal} total complaints, {$summResolved} have been resolved ({$resRate}% resolution rate). There are still {$summPending} pending and {$summInProg} currently in progress.";
    if ($summRejected > 0) {
      $statusExplanation .= " {$summRejected} were rejected.";
    }
  } else {
    $statusExplanation = 'No complaints have been received yet.';
  }

  // ── Trend chart explanation ──────────────────────────────────────────────
  $mLabels = data_get($analytics, 'monthly.labels', []);
  $mValues = data_get($analytics, 'monthly.values', []);
  if (!empty($mValues) && array_sum($mValues) > 0) {
    $peakMVal  = max($mValues);
    $peakMIdx  = array_search($peakMVal, $mValues);
    $lastIdx   = count($mValues) - 1;
    $lastVal   = $mValues[$lastIdx];
    $lastLabel = $mLabels[$lastIdx] ?? '';
    $trendExplanation = 'The highest number of complaints was received in ' . ($mLabels[$peakMIdx] ?? '') . ' with ' . $peakMVal . ' cases.';
    if ($peakMIdx !== $lastIdx && $lastLabel !== '') {
      $trendExplanation .= " In {$lastLabel}, {$lastVal} " . ($lastVal === 1 ? 'complaint' : 'complaints') . ' were received.';
    }
  } else {
    $trendExplanation = 'No sufficient data yet to show the monthly complaints trend.';
  }

  // ── Service rating chart explanation ─────────────────────────────────────
  $srLabels = data_get($analytics, 'service_rating_distribution.labels', []);
  $srValues = data_get($analytics, 'service_rating_distribution.values', []);
  $srTotal  = !empty($srValues) ? array_sum($srValues) : 0;
  if ($srTotal > 0) {
    $maxSrVal  = max($srValues);
    $maxSrIdx  = array_search($maxSrVal, $srValues);
    $rawSrLbl  = (string) ($srLabels[$maxSrIdx] ?? ($maxSrIdx + 1));
    $ratingNum = str_replace('STAR_', '', $rawSrLbl) ?: (string) ($maxSrIdx + 1);
    $wSum = 0;
    foreach ($srValues as $i => $v) {
      $stars = (int) (str_replace('STAR_', '', (string) ($srLabels[$i] ?? ($i + 1))) ?: ($i + 1));
      $wSum += $stars * $v;
    }
    $avgRating     = round($wSum / $srTotal, 1);
    $srExplanation = "Most residents gave a {$ratingNum}-star rating ({$maxSrVal} votes). The average service rating is {$avgRating} stars from {$srTotal} residents who provided feedback.";
  } else {
    $srExplanation = 'No service ratings have been submitted by residents yet.';
  }
@endphp

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
        <div class="stat-num" id="stat-pending">{{ data_get($analytics, 'summary.pending', 0) }}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" id="stat-in-progress">{{ data_get($analytics, 'summary.in_progress', 0) }}</div>
        <div class="stat-label">In Progress</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" id="stat-resolved">{{ data_get($analytics, 'summary.resolved', 0) }}</div>
        <div class="stat-label">Resolved</div>
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
        <p class="chart-explanation" id="explanation-category">{{ $catExplanation }}</p>
      </div>
      <div class="chart-card">
        <div class="chart-title">Reports by Status</div>
        <div class="chart-container">
          <canvas id="chartStatus"></canvas>
        </div>
        <p class="chart-explanation" id="explanation-status">{{ $statusExplanation }}</p>
      </div>
      <div class="chart-card">
        <div class="chart-title">Monthly Reports Trend</div>
        <div class="chart-container">
          <canvas id="chartTrend"></canvas>
        </div>
        <p class="chart-explanation" id="explanation-trend">{{ $trendExplanation }}</p>
      </div>
      <div class="chart-card">
        <div class="chart-title">Service Rating Distribution</div>
        <div class="chart-container">
          <canvas id="chartServiceRating"></canvas>
        </div>
        <p class="chart-explanation" id="explanation-service-rating">{{ $srExplanation }}</p>
      </div>
    </div>

  </div>
</div>

@endsection 
