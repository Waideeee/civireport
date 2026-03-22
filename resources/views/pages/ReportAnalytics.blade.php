@extends('layouts.app')

@section('content')

@vite(['resources/css/app.css', 'resources/css/ReportAnalytics.css'])

<div class="main">
  <div class="content">

    <div class="section-title">Analytics and Charts</div>
    <div class="section-sub">Summary of complaints across all categories.</div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-num"></div>
        <div class="stat-label">Total Reports</div>
      </div>
      <div class="stat-card">
        <div class="stat-num"></div>
        <div class="stat-label">Resolved</div>
      </div>
      <div class="stat-card">
        <div class="stat-num"></div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-num"></div>
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
        <canvas id="chartTrend" style="height: 200px"></canvas>
      </div>
    </div>

  </div>
</div>

@endsection