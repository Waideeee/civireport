document.addEventListener('DOMContentLoaded', function () {

  // ===== Safety: ensure globals are available =====
  if (typeof Chart === 'undefined') {
    console.error('Chart.js not loaded. Check script order in blade.');
    return;
  }
  if (!window.__analytics) {
    console.error('window.__analytics not set. Check blade script order.');
    return;
  }

  const fontFamily = "'Inter', 'Helvetica Neue', sans-serif";
  Chart.defaults.font.family = fontFamily;
  Chart.defaults.font.size   = 12;
  Chart.defaults.color       = '#6b7280';

  // ===== Blade-injected data =====
  const categoryLabels = window.__analytics.categoryLabels || [];
  const categoryData   = window.__analytics.categoryData   || [];
  const statusLabels   = window.__analytics.statusLabels   || [];
  const statusData     = window.__analytics.statusData     || [];
  const monthLabels    = window.__analytics.monthLabels    || [];
  const trendData      = window.__analytics.trendData      || [];

  let analyticsData = null;

  // ===== Chart instances (stored on canvas elements to survive re-render) =====
  const chartInstances = {};

  function destroyChart(id) {
    if (chartInstances[id]) {
      chartInstances[id].destroy();
      chartInstances[id] = null;
    }
    // Belt-and-suspenders: also check Chart.js registry
    const existing = Chart.getChart(id);
    if (existing) existing.destroy();
  }

  // ===== Initial render from Blade data =====
  renderCategoryChart(categoryLabels, categoryData);
  renderStatusChart(statusLabels, statusData, null);
  renderTrendChart(monthLabels, trendData);

  // ===== Fetch from FastAPI (updates charts if available) =====
  fetch('/api/analytics')
    .then(r => r.json())
    .then(data => {
      analyticsData = data;
      if (data.summary)      populateStats(data.summary);
      if (data.by_category)  renderCategoryChart(data.by_category.labels, data.by_category.values);
      if (data.by_status)    renderStatusChart(data.by_status.labels, data.by_status.values, data.summary?.total ?? null);
      if (data.monthly)      renderTrendChart(data.monthly.labels, data.monthly.values);
    })
    .catch(() => {
      // API unavailable — blade data already rendered, nothing more to do
    });

  // ===== Stat Cards =====
  function populateStats(summary) {
    const total    = summary.total    || 0;
    const resolved = summary.resolved || 0;
    const pending  = summary.pending  || 0;
    const rate     = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-total',    total);
    set('stat-resolved', resolved);
    set('stat-pending',  pending);
    set('stat-rate',     rate + '%');
  }

  // ===== Chart Renderers =====

  function renderCategoryChart(labels, values) {
    destroyChart('chartCategory');
    const ctx = document.getElementById('chartCategory').getContext('2d');
    chartInstances['chartCategory'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Complaints',
          data: values,
          backgroundColor: [
            '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe',
            '#6366f1', '#8b5cf6',
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
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} complaints` } },
        },
        scales: {
          x: { grid: { color: '#f3f4f6' }, ticks: { precision: 0, stepSize: 1 } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });
  }

  function renderStatusChart(labels, values, total) {
    destroyChart('chartStatus');
    const statusColors = {
      'resolved':    '#22c55e',
      'pending':     '#facc15',
      'in progress': '#3b82f6',
      'rejected':    '#ef4444',
    };
    const bgColors = labels.map(l => statusColors[l.toLowerCase()] || '#9ca3af');

    const ctx = document.getElementById('chartStatus').getContext('2d');
    chartInstances['chartStatus'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: bgColors,
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
            labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10 },
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const t   = total ?? ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = t > 0 ? Math.round((ctx.parsed / t) * 100) : 0;
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  function renderTrendChart(labels, values) {
    destroyChart('chartTrend');
    const ctx      = document.getElementById('chartTrend').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(29,78,216,0.20)');
    gradient.addColorStop(1, 'rgba(29,78,216,0)');

    chartInstances['chartTrend'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Reports',
          data: values,
          fill: true,
          backgroundColor: gradient,
          borderColor: '#1d4ed8',
          borderWidth: 2.5,
          pointBackgroundColor: '#1d4ed8',
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} reports` } },
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f3f4f6' }, ticks: { precision: 0, stepSize: 1 }, beginAtZero: true },
        },
      },
    });
  }

  // ===== Download Report (CiviReport-branded PDF) =====
  window.downloadAnalytics = function () {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF library is still loading. Please try again in a moment.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc  = new jsPDF({ unit: 'pt', format: 'a4' });

    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const margin = 40;
    const col2   = 220;

    // ── Resolve data: prefer API response, fall back to Blade ──
    const bladeStats = window.__analytics.stats || {};
    const summary    = (analyticsData && analyticsData.summary) ? analyticsData.summary : bladeStats;

    const total    = summary.total       || 0;
    const resolved = summary.resolved    || 0;
    const pending  = summary.pending     || 0;
    const inProg   = summary.in_progress || 0;
    const rejected = summary.rejected    || 0;
    const rate     = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const catLabels = (analyticsData && analyticsData.by_category) ? analyticsData.by_category.labels : (window.__analytics.categoryLabels || []);
    const catValues = (analyticsData && analyticsData.by_category) ? analyticsData.by_category.values : (window.__analytics.categoryData   || []);
    const stLabels  = (analyticsData && analyticsData.by_status)   ? analyticsData.by_status.labels   : (window.__analytics.statusLabels   || []);
    const stValues  = (analyticsData && analyticsData.by_status)   ? analyticsData.by_status.values   : (window.__analytics.statusData     || []);
    const mLabels   = (analyticsData && analyticsData.monthly)     ? analyticsData.monthly.labels      : (window.__analytics.monthLabels    || []);
    const mValues   = (analyticsData && analyticsData.monthly)     ? analyticsData.monthly.values      : (window.__analytics.trendData      || []);

    const now = new Date().toLocaleString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    let y = 0;

    function checkPage(needed = 60) {
      if (y + needed > pageH - margin) {
        doc.addPage();
        drawHeader();
        y = 100;
      }
    }

    function drawHeader() {
      doc.setFillColor(26, 54, 126);
      doc.rect(0, 0, pageW, 68, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text('CiviReport', margin, 43);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Complaint Analytics Report', pageW - margin, 43, { align: 'right' });
    }

    function sectionHeading(label) {
      checkPage(50);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text(label, margin, y);
      y += 5;
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 14;
    }

    function row(label, value) {
      checkPage(22);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(String(value), col2, y);
      y += 20;
    }

    function table(headers, rows, colWidths) {
      const rowH   = 22;
      const tableW = colWidths.reduce((a, b) => a + b, 0);
      let x;

      checkPage(rowH + 10);
      doc.setFillColor(26, 54, 126);
      doc.rect(margin, y - 14, tableW, rowH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      x = margin;
      headers.forEach((h, i) => {
        doc.text(h, x + 8, y + 1);
        x += colWidths[i];
      });
      y += rowH - 2;

      rows.forEach((r, ri) => {
        checkPage(rowH);
        doc.setFillColor(ri % 2 === 0 ? 249 : 255, ri % 2 === 0 ? 250 : 255, ri % 2 === 0 ? 251 : 255);
        doc.rect(margin, y - 14, tableW, rowH, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(31, 41, 55);
        x = margin;
        r.forEach((cell, i) => {
          doc.text(String(cell), x + 8, y + 1);
          x += colWidths[i];
        });
        y += rowH;
      });

      y += 12;
    }

    // ── Build PDF ──
    drawHeader();
    y = 92;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated on: ${now}`, margin, y);
    y += 26;

    sectionHeading('SUMMARY');
    row('Total Reports',   total);
    row('Resolved',        resolved);
    row('Pending',         pending);
    row('In Progress',     inProg);
    row('Rejected',        rejected);
    row('Resolution Rate', rate + '%');
    y += 8;

    sectionHeading('REPORTS BY CATEGORY');
    table(
      ['Category', 'Count'],
      catLabels.map((l, i) => [l, catValues[i]]),
      [360, 80]
    );

    sectionHeading('REPORTS BY STATUS');
    table(
      ['Status', 'Count', 'Percentage'],
      stLabels.map((l, i) => {
        const pct = total > 0 ? Math.round((stValues[i] / total) * 100) : 0;
        return [l, stValues[i], pct + '%'];
      }),
      [260, 80, 100]
    );

    sectionHeading('MONTHLY REPORTS TREND');
    table(
      ['Month', 'Reports'],
      mLabels.map((m, i) => [m, mValues[i]]),
      [260, 180]
    );

    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `CiviReport  •  Analytics Report  •  Page ${p} of ${totalPages}`,
        pageW / 2, pageH - 20, { align: 'center' }
      );
    }

    doc.save(`Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

});