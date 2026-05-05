document.addEventListener('DOMContentLoaded', function () {

  // ===== Page Check =====
  // Only execute this script if we are on the ReportAnalytics page
  if (!document.getElementById('chartCategory') && !window.__analytics) {
    return;
  }

  // ===== Safety: ensure globals are available =====
  const chartEnabled = typeof Chart !== 'undefined';
  if (!chartEnabled) {
    console.error('Chart.js not loaded. Analytics charts will be skipped.');
  }
  if (!window.__analytics) {
    console.error('window.__analytics not set. Check blade script order.');
  }

  if (chartEnabled) {
    const fontFamily = "'Montserrat', sans-serif";
    Chart.defaults.font.family = fontFamily;
    Chart.defaults.font.size   = 12;
    Chart.defaults.font.weight = '400';
    Chart.defaults.color       = '#000000';
  }

  // ===== Blade-injected data =====
  const bladeAnalytics   = window.__analytics || {};
  const categoryLabels   = bladeAnalytics.categoryLabels || [];
  const categoryData     = bladeAnalytics.categoryData   || [];
  const statusLabels     = bladeAnalytics.statusLabels   || [];
  const statusData       = bladeAnalytics.statusData     || [];
  const monthLabels      = bladeAnalytics.monthLabels    || [];
  const trendData        = bladeAnalytics.trendData      || [];
  const serviceRatingLabels = bladeAnalytics.serviceRatingLabels || [];
  const serviceRatingData   = bladeAnalytics.serviceRatingData   || [];

  let analyticsData = null;
  let insightData   = null;

  // ===== Chart instances =====
  const chartInstances = {};

  function destroyChart(id) {
    if (chartInstances[id]) {
      chartInstances[id].destroy();
      chartInstances[id] = null;
    }
    if (!chartEnabled) return;
    const existing = Chart.getChart(id);
    if (existing) existing.destroy();
  }

  // ===== Initial render from Blade data =====
  populateStats(bladeAnalytics.summary || bladeAnalytics.stats || {});

  if (chartEnabled) {
    renderCategoryChart(categoryLabels, categoryData);
    renderStatusChart(statusLabels, statusData, (bladeAnalytics.summary || {}).total || null);
    renderTrendChart(monthLabels, trendData);
    renderServiceRatingChart(serviceRatingLabels, serviceRatingData);
  }

  renderInsightLoading();
  fetchAnalytics();
  fetchInsight();

  // ===== Fetch helpers =====
  function fetchJson(url) {
    return fetch(url).then(async response => {
      let payload = null;
      try { payload = await response.json(); } catch (e) { payload = null; }
      if (!response.ok) {
        const message =
          (payload && (payload.detail || payload.error || payload.message)) ||
          `Request failed with status ${response.status}`;
        throw new Error(message);
      }
      return payload || {};
    });
  }

  function fetchAnalytics() {
    fetchJson('/api/analytics')
      .then(data => {
        analyticsData = data;
        if (data.summary)     populateStats(data.summary);
        if (chartEnabled && data.by_category) renderCategoryChart(data.by_category.labels || [], data.by_category.values || []);
        if (chartEnabled && data.by_status)   renderStatusChart(data.by_status.labels || [], data.by_status.values || [], data.summary?.total ?? null);
        if (chartEnabled && data.monthly)     renderTrendChart(data.monthly.labels || [], data.monthly.values || []);
        if (chartEnabled && data.service_rating_distribution) {
          renderServiceRatingChart(
            data.service_rating_distribution.labels || [],
            data.service_rating_distribution.values || []
          );
        }
        updateExplanations(data);
      })
      .catch(error => {
        console.error('Failed to refresh analytics data:', error);
        // Blade data already rendered — nothing more to do
      });
  }

  function fetchInsight() {
    fetchJson('/api/analytics/insight')
      .then(data => {
        insightData = data;
        renderInsight(data);
      })
      .catch(error => {
        console.error('Failed to load analytics insight:', error);
        renderInsightUnavailable(
          'The charts are still available, but the AI summary could not be generated right now.'
        );
      });
  }

  // ===== Stat Cards =====
  function populateStats(summary) {
    const total    = summary.total    || 0;
    const resolved = summary.resolved || 0;
    const inProgress = summary.in_progress || 0;
    const pending  = summary.pending  || 0;
    const rate     = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-total',    total);
    set('stat-resolved', resolved);
    set('stat-in-progress', inProgress);
    set('stat-pending',  pending);
    set('stat-rate',     `${rate}%`);
  }

  // ===== Chart Renderers =====

  function renderCategoryChart(labels, values) {
    if (!chartEnabled) return;
    const canvas = document.getElementById('chartCategory');
    if (!canvas) return;
    destroyChart('chartCategory');
    const ctx = canvas.getContext('2d');
    chartInstances['chartCategory'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Complaints',
          data: values,
          backgroundColor: [
            '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa',
            '#93c5fd', '#bfdbfe', '#6366f1', '#8b5cf6',
          ],
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: item => ` ${item.parsed.x} complaints` } },
        },
        scales: {
          x: { grid: { color: '#f3f4f6' }, ticks: { precision: 0, stepSize: 1 } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });
  }

  function renderStatusChart(labels, values, total) {
    if (!chartEnabled) return;
    const canvas = document.getElementById('chartStatus');
    if (!canvas) return;
    destroyChart('chartStatus');
    const statusColors = {
      'resolved':    '#22c55e',
      'pending':     '#facc15',
      'in progress': '#3b82f6',
      'rejected':    '#ef4444',
    };
    const bgColors = labels.map(l => statusColors[(l || '').toLowerCase()] || '#9ca3af');
    const ctx = canvas.getContext('2d');
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
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 10,
              boxHeight: 10,
            },
          },
          tooltip: {
            callbacks: {
              label: item => {
                const datasetTotal = total ?? item.dataset.data.reduce((a, b) => a + b, 0);
                const pct = datasetTotal > 0 ? Math.round((item.parsed / datasetTotal) * 100) : 0;
                return ` ${item.label}: ${item.parsed} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  function renderTrendChart(labels, values) {
    if (!chartEnabled) return;
    const canvas = document.getElementById('chartTrend');
    if (!canvas) return;
    destroyChart('chartTrend');
    const ctx      = canvas.getContext('2d');
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
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: item => ` ${item.parsed.y} reports` } },
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f3f4f6' }, ticks: { precision: 0, stepSize: 1 }, beginAtZero: true },
        },
      },
    });
  }

  function renderServiceRatingChart(labels, values) {
    if (!chartEnabled) return;
    const canvas = document.getElementById('chartServiceRating');
    if (!canvas) return;
    destroyChart('chartServiceRating');

    const normalizedLabels = labels.map((label, index) => {
      const rating = String(label || '').replace('STAR_', '') || String(index + 1);
      const count = values[index] || 0;
      return `${rating} Star: ${count}`;
    });

    const ctx = canvas.getContext('2d');
    chartInstances['chartServiceRating'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: normalizedLabels,
        datasets: [{
          label: 'Rated complaints',
          data: values,
          backgroundColor: ['#f59e0b', '#fbbf24', '#facc15', '#84cc16', '#22c55e'],
          borderRadius: 8,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: item => ` ${item.label} complaints`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              callback: (_, index) => `${index + 1} Star`,
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f3f4f6' },
            ticks: { precision: 0, stepSize: 1 },
          },
        },
      },
    });
  }

  // ===== AI Insight Renderers =====

  function insightElements() {
    return {
      container: document.getElementById('analyticsInsight'),
      content:   document.getElementById('analyticsInsightContent'),
      meta:      document.getElementById('analyticsInsightMeta'),
    };
  }

  function renderInsightLoading() {
    const { content, meta } = insightElements();
    if (!content || !meta) return;
    meta.textContent = 'Generating analysis...';
    content.className = 'ai-insight-content ai-insight-loading';
    content.innerHTML = `
      <div class="ai-skeleton ai-skeleton-title"></div>
      <div class="ai-skeleton ai-skeleton-line"></div>
      <div class="ai-skeleton ai-skeleton-line ai-skeleton-line-short"></div>
      <div class="ai-skeleton ai-skeleton-card"></div>
      <div class="ai-skeleton ai-skeleton-card"></div>
    `;
  }

  function renderInsight(data) {
    if (!data || !data.state) {
      renderInsightUnavailable('The charts are still available, but the AI summary returned an unexpected response.');
      return;
    }
    if (data.state === 'no_data') {
      renderInsightNotice(data.headline, data.summary, 'empty');
      return;
    }
    if (data.state !== 'ok') {
      renderInsightUnavailable(data.summary || 'The AI summary could not be generated right now.');
      return;
    }

    const { content, meta } = insightElements();
    if (!content || !meta) return;

    const evidence        = Array.isArray(data.evidence)        ? data.evidence        : [];
    const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];

    meta.textContent  = formatInsightTimestamp(data.generated_at);
    content.className = 'ai-insight-content';
    content.innerHTML = `
      <div class="ai-insight-summary-card">
        <div class="ai-insight-kicker">AI Reading</div>
        <h3 class="ai-insight-headline">${escapeHtml(data.headline || 'Barangay insight')}</h3>
        <p class="ai-insight-summary">${escapeHtml(data.summary || '')}</p>
      </div>

      <div class="ai-insight-panel">
        <div class="ai-insight-panel-label">Common Problem</div>
        <p class="ai-insight-common-problem">${escapeHtml(data.common_problem || '')}</p>
      </div>

      <div class="ai-insight-grid">
        <div class="ai-insight-column">
          <div class="ai-insight-column-label">Evidence from Reports</div>
          <div class="ai-evidence-list">
            ${evidence.map(item => `
              <div class="ai-evidence-card">
                <div class="ai-evidence-label">${escapeHtml(item.label || '')}</div>
                <div class="ai-evidence-detail">${escapeHtml(item.detail || '')}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="ai-insight-column">
          <div class="ai-insight-column-label">Suggested Barangay Actions</div>
          <div class="ai-recommendation-list">
            ${recommendations.map((item, index) => `
              <div class="ai-recommendation-card">
                <div class="ai-recommendation-top">
                  <span class="ai-recommendation-index">${index + 1}</span>
                  <span class="ai-recommendation-title">${escapeHtml(item.title || '')}</span>
                  <span class="ai-priority-badge ${priorityClass(item.priority)}">${escapeHtml(item.priority || 'Medium')}</span>
                </div>
                <p class="ai-recommendation-details">${escapeHtml(item.details || '')}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderInsightNotice(title, message, tone) {
    const { content, meta } = insightElements();
    if (!content || !meta) return;
    meta.textContent  = tone === 'empty' ? 'Waiting for report data' : '';
    content.className = `ai-insight-content ai-insight-state ai-insight-state-${tone}`;
    content.innerHTML = `
      <div class="ai-insight-state-title">${escapeHtml(title || 'AI insight')}</div>
      <p class="ai-insight-state-message">${escapeHtml(message || '')}</p>
    `;
  }

  function renderInsightUnavailable(message) {
    renderInsightNotice('AI insight unavailable', message, 'error');
  }

  // ===== Helpers =====

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

  function priorityClass(priority) {
    const normalized = String(priority || '').trim().toLowerCase();
    if (normalized === 'critical') return 'is-critical';
    if (normalized === 'high')     return 'is-high';
    if (normalized === 'low')      return 'is-low';
    return 'is-medium';
  }

  function formatInsightTimestamp(value) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return 'Generated moments ago';
    return `Generated ${date.toLocaleString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })}`;
  }

  // ===== Chart Explanation Updaters =====

  function updateExplanations(data) {
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    if (data.by_category) {
      set('explanation-category', buildCategoryExplanation(data.by_category.labels || [], data.by_category.values || []));
    }
    if (data.summary) {
      set('explanation-status', buildStatusExplanation(data.summary));
    }
    if (data.monthly) {
      set('explanation-trend', buildTrendExplanation(data.monthly.labels || [], data.monthly.values || []));
    }
    if (data.service_rating_distribution) {
      set('explanation-service-rating', buildServiceRatingExplanation(
        data.service_rating_distribution.labels || [],
        data.service_rating_distribution.values || []
      ));
    }
  }

  function buildCategoryExplanation(labels, values) {
    const total = values.reduce((a, b) => a + b, 0);
    if (!total) return 'No sufficient complaints yet to identify the leading category.';
    const maxVal = Math.max(...values);
    const maxIdx = values.indexOf(maxVal);
    const minVal = Math.min(...values);
    const minIdx = values.indexOf(minVal);
    let text = `The "${labels[maxIdx]}" category has the highest number of complaints with ${maxVal} cases.`;
    if (maxIdx !== minIdx) text += ` The lowest is "${labels[minIdx]}" with ${minVal} cases.`;
    return text;
  }

  function buildStatusExplanation(summary) {
    const total    = summary.total       || 0;
    const resolved = summary.resolved    || 0;
    const pending  = summary.pending     || 0;
    const inProg   = summary.in_progress || 0;
    const rejected = summary.rejected    || 0;
    if (!total) return 'No complaints have been received yet.';
    const rate = Math.round((resolved / total) * 100);
    let text = `Out of ${total} total complaints, ${resolved} have been resolved (${rate}% resolution rate). There are still ${pending} pending and ${inProg} currently in progress.`;
    if (rejected > 0) text += ` ${rejected} were rejected.`;
    return text;
  }

  function buildTrendExplanation(labels, values) {
    const total = values.reduce((a, b) => a + b, 0);
    if (!total) return 'No sufficient data yet to show the monthly complaints trend.';
    const peakVal   = Math.max(...values);
    const peakIdx   = values.indexOf(peakVal);
    const lastIdx   = values.length - 1;
    const lastVal   = values[lastIdx];
    const lastLabel = labels[lastIdx] || '';
    let text = `The highest number of complaints was received in ${labels[peakIdx]} with ${peakVal} cases.`;
    if (peakIdx !== lastIdx && lastLabel) text += ` In ${lastLabel}, ${lastVal} ${lastVal === 1 ? 'complaint' : 'complaints'} were received.`;
    return text;
  }

  function buildServiceRatingExplanation(labels, values) {
    const total = values.reduce((a, b) => a + b, 0);
    if (!total) return 'No service ratings have been submitted by residents yet.';
    const maxVal    = Math.max(...values);
    const maxIdx    = values.indexOf(maxVal);
    const rawLbl    = String(labels[maxIdx] ?? (maxIdx + 1));
    const ratingNum = rawLbl.replace('STAR_', '') || String(maxIdx + 1);
    let wSum = 0;
    values.forEach((v, i) => {
      const stars = parseInt(String(labels[i] ?? (i + 1)).replace('STAR_', ''), 10) || (i + 1);
      wSum += stars * v;
    });
    const avg = (wSum / total).toFixed(1);
    return `Most residents gave a ${ratingNum}-star rating (${maxVal} votes). The average service rating is ${avg} stars from ${total} residents who provided feedback.`;
  }

  // ===== Download Report (CiviReport-branded PDF) =====
  window.downloadAnalytics = function () {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF library is still loading. Please try again in a moment.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc    = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const margin = 40;
    const col2   = 220;

    // Resolve data: prefer API response, fall back to Blade
    const bladeSummary = bladeAnalytics.summary || bladeAnalytics.stats || {};
    const summary      = (analyticsData && analyticsData.summary) ? analyticsData.summary : bladeSummary;

    const total    = summary.total       || 0;
    const resolved = summary.resolved    || 0;
    const pending  = summary.pending     || 0;
    const inProg   = summary.in_progress || 0;
    const rejected = summary.rejected    || 0;
    const rate     = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const catLabels = (analyticsData && analyticsData.by_category) ? analyticsData.by_category.labels : (bladeAnalytics.categoryLabels || []);
    const catValues = (analyticsData && analyticsData.by_category) ? analyticsData.by_category.values : (bladeAnalytics.categoryData   || []);
    const stLabels  = (analyticsData && analyticsData.by_status)   ? analyticsData.by_status.labels   : (bladeAnalytics.statusLabels   || []);
    const stValues  = (analyticsData && analyticsData.by_status)   ? analyticsData.by_status.values   : (bladeAnalytics.statusData     || []);
    const mLabels   = (analyticsData && analyticsData.monthly)     ? analyticsData.monthly.labels      : (bladeAnalytics.monthLabels    || []);
    const mValues   = (analyticsData && analyticsData.monthly)     ? analyticsData.monthly.values      : (bladeAnalytics.trendData      || []);

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

    // Build PDF
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
    row('Resolution Rate', `${rate}%`);
    y += 8;

    // AI Insight section in PDF
    if (insightData && insightData.state === 'ok') {
      sectionHeading('AI INSIGHT');

      const wrap = (text, w) => doc.splitTextToSize(text || '', w);

      // AI READING Kicker
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(37, 99, 235); // blue-600
      checkPage(20);
      doc.text('AI READING', margin, y);
      y += 14;

      // Headline
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); // slate-900
      const headlineLines = wrap(insightData.headline, pageW - (margin * 2));
      checkPage(headlineLines.length * 18);
      doc.text(headlineLines, margin, y);
      y += (headlineLines.length * 18) + 8;

      // Summary
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      const summaryLines = wrap(insightData.summary, pageW - (margin * 2));
      checkPage(summaryLines.length * 14);
      doc.text(summaryLines, margin, y);
      y += (summaryLines.length * 14) + 18;

      // COMMON PROBLEM Kicker
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      checkPage(20);
      doc.text('COMMON PROBLEM', margin, y);
      y += 14;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const problemLines = wrap(insightData.common_problem, pageW - (margin * 2));
      checkPage(problemLines.length * 14);
      doc.text(problemLines, margin, y);
      y += (problemLines.length * 14) + 24;

      // Draw subtle separator
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(margin, y - 8, pageW - margin, y - 8);

      if (insightData.evidence && insightData.evidence.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        checkPage(20);
        doc.text('EVIDENCE FROM REPORTS', margin, y);
        y += 16;

        insightData.evidence.forEach((item) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42);
          checkPage(20);
          doc.text(`•  ${item.label}`, margin + 4, y);
          y += 14;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          const detailLines = wrap(item.detail, pageW - (margin * 2) - 16);
          checkPage(detailLines.length * 13);
          doc.text(detailLines, margin + 16, y);
          y += (detailLines.length * 13) + 12;
        });
        y += 4;
      }

      if (insightData.recommendations && insightData.recommendations.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        checkPage(20);
        doc.text('SUGGESTED BARANGAY ACTIONS', margin, y);
        y += 16;

        insightData.recommendations.forEach((item, index) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42);
          checkPage(20);
          
          const titleStr = `${index + 1}.  ${item.title}`;
          const titleWidth = doc.getTextWidth(titleStr);
          doc.text(titleStr, margin + 4, y);
          
          // Badge
          const priority = (item.priority || 'Medium').toUpperCase();
          let bgR = 254, bgG = 243, bgB = 199; 
          let txtR = 180, txtG = 83, txtB = 9;  
          if (priority === 'HIGH' || priority === 'CRITICAL') {
            bgR = 255; bgG = 237; bgB = 213; 
            txtR = 194; txtG = 65; txtB = 12; 
          } else if (priority === 'LOW') {
            bgR = 220; bgG = 252; bgB = 231; 
            txtR = 21; txtG = 128; txtB = 61; 
          }
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          const badgeW = doc.getTextWidth(priority) + 12;
          
          doc.setFillColor(bgR, bgG, bgB);
          doc.roundedRect(margin + 4 + titleWidth + 8, y - 9, badgeW, 12, 3, 3, 'F');
          
          doc.setTextColor(txtR, txtG, txtB);
          doc.text(priority, margin + 4 + titleWidth + 14, y - 1);

          y += 14;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          const detailsLines = wrap(item.details, pageW - (margin * 2) - 16);
          checkPage(detailsLines.length * 13);
          doc.text(detailsLines, margin + 16, y);
          y += (detailsLines.length * 13) + 12;
        });
        y += 8;
      }
    }

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
        return [l, stValues[i], `${pct}%`];
      }),
      [260, 80, 100]
    );

    sectionHeading('MONTHLY REPORTS TREND');
    if (chartInstances['chartTrend']) {
      try {
        const chartImg = chartInstances['chartTrend'].toBase64Image();
        const imgWidth = pageW - (margin * 2);
        const imgHeight = 160;
        checkPage(imgHeight + 20);
        doc.addImage(chartImg, 'PNG', margin, y, imgWidth, imgHeight);
        y += imgHeight + 20;
      } catch (e) {
        console.error("Could not capture chart as image", e);
        table(
          ['Month', 'Reports'],
          mLabels.map((m, i) => [m, mValues[i]]),
          [260, 180]
        );
      }
    } else {
      table(
        ['Month', 'Reports'],
        mLabels.map((m, i) => [m, mValues[i]]),
        [260, 180]
      );
    }

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
