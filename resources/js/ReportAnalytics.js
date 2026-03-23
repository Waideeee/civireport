document.addEventListener('DOMContentLoaded', function () {

  // ===== Dummy Data =====
  const analyticsData = {
    total: 128,
    resolved: 94,
    pending: 21,
    inProgress: 13,
    rejected: 8,

    byCategory: {
      labels: [
        'Peace & Order',
        'Sanitation & Waste',
        'Flooding & Drainage',
        'Traffic & Roads',
        'Animal Concerns',
        'Health & Safety',
        'Social / Family',
        'Legal / Property',
      ],
      values: [32, 24, 15, 12, 8, 14, 17, 6],
    },

    byStatus: {
      labels: ['Approved', 'Pending', 'In Progress', 'Rejected'],
      values: [94, 21, 13, 8],
    },

    monthly: {
      labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
      values: [14, 18, 22, 19, 27, 31, 24],
    },
  };

  // ===== Populate Stat Cards =====
  const resolutionRate = Math.round((analyticsData.resolved / analyticsData.total) * 100);

  document.getElementById('stat-total').textContent     = analyticsData.total;
  document.getElementById('stat-resolved').textContent  = analyticsData.resolved;
  document.getElementById('stat-pending').textContent   = analyticsData.pending;
  document.getElementById('stat-rate').textContent      = resolutionRate + '%';

  // ===== Chart Defaults =====
  const fontFamily = "'Inter', 'Helvetica Neue', sans-serif";

  Chart.defaults.font.family = fontFamily;
  Chart.defaults.font.size   = 12;
  Chart.defaults.color       = '#6b7280';

  // ===== Chart: Reports by Category (Horizontal Bar) =====
  const ctxCategory = document.getElementById('chartCategory').getContext('2d');
  new Chart(ctxCategory, {
    type: 'bar',
    data: {
      labels: analyticsData.byCategory.labels,
      datasets: [{
        label: 'Complaints',
        data: analyticsData.byCategory.values,
        backgroundColor: [
          '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
          '#f59e0b', '#10b981', '#14b8a6', '#f97316',
        ],
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.x} complaints`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: '#f3f4f6' },
          ticks: { precision: 0 },
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
      },
    },
  });

  // ===== Chart: Reports by Status (Doughnut) =====
  const ctxStatus = document.getElementById('chartStatus').getContext('2d');
  new Chart(ctxStatus, {
    type: 'doughnut',
    data: {
      labels: analyticsData.byStatus.labels,
      datasets: [{
        data: analyticsData.byStatus.values,
        backgroundColor: ['#22c55e', '#facc15', '#3b82f6', '#ef4444'],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed} (${Math.round((ctx.parsed / analyticsData.total) * 100)}%)`,
          },
        },
      },
    },
  });

  // ===== Chart: Monthly Trend (Line) =====
  const ctxTrend = document.getElementById('chartTrend').getContext('2d');

  const gradientTrend = ctxTrend.createLinearGradient(0, 0, 0, 220);
  gradientTrend.addColorStop(0, 'rgba(59,130,246,0.25)');
  gradientTrend.addColorStop(1, 'rgba(59,130,246,0)');

  new Chart(ctxTrend, {
    type: 'line',
    data: {
      labels: analyticsData.monthly.labels,
      datasets: [{
        label: 'Reports',
        data: analyticsData.monthly.values,
        fill: true,
        backgroundColor: gradientTrend,
        borderColor: '#3b82f6',
        borderWidth: 2.5,
        pointBackgroundColor: '#3b82f6',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} reports`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
        },
        y: {
          grid: { color: '#f3f4f6' },
          ticks: { precision: 0 },
          beginAtZero: true,
        },
      },
    },
  });

  // ===== Download Report =====
  window.downloadAnalytics = function () {
    const line     = '='.repeat(46);
    const divider  = '-'.repeat(46);
    const now      = new Date().toLocaleString('en-PH');

    const categoryRows = analyticsData.byCategory.labels
      .map((label, i) => `  ${label.padEnd(30)} ${String(analyticsData.byCategory.values[i]).padStart(4)}`)
      .join('\n');

    const statusRows = analyticsData.byStatus.labels
      .map((label, i) => {
        const pct = Math.round((analyticsData.byStatus.values[i] / analyticsData.total) * 100);
        return `  ${label.padEnd(20)} ${String(analyticsData.byStatus.values[i]).padStart(4)}   (${pct}%)`;
      })
      .join('\n');

    const trendRows = analyticsData.monthly.labels
      .map((month, i) => `  ${month.padEnd(10)} ${String(analyticsData.monthly.values[i]).padStart(4)} reports`)
      .join('\n');

    const content = [
      line,
      '       BARANGAY COMPLAINT ANALYTICS REPORT',
      line,
      '',
      `  Generated on : ${now}`,
      '',
      divider,
      '  SUMMARY',
      divider,
      `  Total Reports     : ${analyticsData.total}`,
      `  Resolved          : ${analyticsData.resolved}`,
      `  Pending           : ${analyticsData.pending}`,
      `  In Progress       : ${analyticsData.inProgress}`,
      `  Rejected          : ${analyticsData.rejected}`,
      `  Resolution Rate   : ${resolutionRate}%`,
      '',
      divider,
      '  REPORTS BY CATEGORY',
      divider,
      categoryRows,
      '',
      divider,
      '  REPORTS BY STATUS',
      divider,
      statusRows,
      '',
      divider,
      '  MONTHLY TREND',
      divider,
      trendRows,
      '',
      line,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Analytics_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

});