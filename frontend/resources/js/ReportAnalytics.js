document.addEventListener('DOMContentLoaded', function () {
  const bladeAnalytics = window.__analytics || {};
  const chartEnabled = typeof Chart !== 'undefined';

  if (!chartEnabled) {
    console.error('Chart.js not loaded. Analytics charts will be skipped.');
  } else {
    const fontFamily = "'Inter', 'Helvetica Neue', sans-serif";
    Chart.defaults.font.family = fontFamily;
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#6b7280';
  }

  const categoryLabels = bladeAnalytics.categoryLabels || [];
  const categoryData = bladeAnalytics.categoryData || [];
  const statusLabels = bladeAnalytics.statusLabels || [];
  const statusData = bladeAnalytics.statusData || [];
  const monthLabels = bladeAnalytics.monthLabels || [];
  const trendData = bladeAnalytics.trendData || [];

  let analyticsData = null;
  let insightData = null;
  const chartInstances = {};

  populateStats(bladeAnalytics.summary || bladeAnalytics.stats || {});

  if (chartEnabled) {
    renderCategoryChart(categoryLabels, categoryData);
    renderStatusChart(statusLabels, statusData, (bladeAnalytics.summary || {}).total || null);
    renderTrendChart(monthLabels, trendData);
  }

  renderInsightLoading();
  fetchAnalytics();
  fetchInsight();

  function fetchJson(url) {
    return fetch(url).then(async response => {
      let payload = null;
      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }

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

        if (data.summary) {
          populateStats(data.summary);
        }
        if (chartEnabled && data.by_category) {
          renderCategoryChart(data.by_category.labels || [], data.by_category.values || []);
        }
        if (chartEnabled && data.by_status) {
          renderStatusChart(
            data.by_status.labels || [],
            data.by_status.values || [],
            data.summary?.total ?? null
          );
        }
        if (chartEnabled && data.monthly) {
          renderTrendChart(data.monthly.labels || [], data.monthly.values || []);
        }
      })
      .catch(error => {
        console.error('Failed to refresh analytics data:', error);
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

  function populateStats(summary) {
    const total = summary.total || 0;
    const resolved = summary.resolved || 0;
    const pending = summary.pending || 0;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const set = (id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    };

    set('stat-total', total);
    set('stat-resolved', resolved);
    set('stat-pending', pending);
    set('stat-rate', `${rate}%`);
  }

  function destroyChart(id) {
    if (chartInstances[id]) {
      chartInstances[id].destroy();
      chartInstances[id] = null;
    }

    if (!chartEnabled) {
      return;
    }

    const existing = Chart.getChart(id);
    if (existing) {
      existing.destroy();
    }
  }

  function renderCategoryChart(labels, values) {
    if (!chartEnabled) {
      return;
    }

    const canvas = document.getElementById('chartCategory');
    if (!canvas) {
      return;
    }

    destroyChart('chartCategory');
    const ctx = canvas.getContext('2d');
    chartInstances.chartCategory = new Chart(ctx, {
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
    if (!chartEnabled) {
      return;
    }

    const canvas = document.getElementById('chartStatus');
    if (!canvas) {
      return;
    }

    destroyChart('chartStatus');
    const statusColors = {
      resolved: '#22c55e',
      pending: '#facc15',
      'in progress': '#3b82f6',
      rejected: '#ef4444',
    };
    const bgColors = labels.map(label => statusColors[(label || '').toLowerCase()] || '#9ca3af');

    const ctx = canvas.getContext('2d');
    chartInstances.chartStatus = new Chart(ctx, {
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
              label: item => {
                const datasetTotal = total ?? item.dataset.data.reduce((sum, value) => sum + value, 0);
                const percentage = datasetTotal > 0 ? Math.round((item.parsed / datasetTotal) * 100) : 0;
                return ` ${item.label}: ${item.parsed} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  function renderTrendChart(labels, values) {
    if (!chartEnabled) {
      return;
    }

    const canvas = document.getElementById('chartTrend');
    if (!canvas) {
      return;
    }

    destroyChart('chartTrend');
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(29,78,216,0.20)');
    gradient.addColorStop(1, 'rgba(29,78,216,0)');

    chartInstances.chartTrend = new Chart(ctx, {
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
          tooltip: { callbacks: { label: item => ` ${item.parsed.y} reports` } },
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f3f4f6' }, ticks: { precision: 0, stepSize: 1 }, beginAtZero: true },
        },
      },
    });
  }

  function insightElements() {
    return {
      container: document.getElementById('analyticsInsight'),
      content: document.getElementById('analyticsInsightContent'),
      meta: document.getElementById('analyticsInsightMeta'),
    };
  }

  function renderInsightLoading() {
    const { content, meta } = insightElements();
    if (!content || !meta) {
      return;
    }

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
      renderInsightUnavailable(
        'The charts are still available, but the AI summary returned an unexpected response.'
      );
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
    if (!content || !meta) {
      return;
    }

    const evidence = Array.isArray(data.evidence) ? data.evidence : [];
    const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];

    meta.textContent = formatInsightTimestamp(data.generated_at);
    content.className = 'ai-insight-content';
    content.innerHTML = `
      <div class="ai-insight-summary-card">
        <div class="ai-insight-kicker">AI reading</div>
        <h3 class="ai-insight-headline">${escapeHtml(data.headline || 'Barangay insight')}</h3>
        <p class="ai-insight-summary">${escapeHtml(data.summary || '')}</p>
      </div>

      <div class="ai-insight-panel">
        <div class="ai-insight-panel-label">Common problem</div>
        <p class="ai-insight-common-problem">${escapeHtml(data.common_problem || '')}</p>
      </div>

      <div class="ai-insight-grid">
        <div class="ai-insight-panel">
          <div class="ai-insight-panel-label">Evidence from reports</div>
          <ul class="ai-evidence-list">
            ${evidence.map(item => `
              <li class="ai-evidence-item">
                <div class="ai-evidence-label">${escapeHtml(item.label || '')}</div>
                <div class="ai-evidence-detail">${escapeHtml(item.detail || '')}</div>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="ai-insight-panel">
          <div class="ai-insight-panel-label">Suggested barangay actions</div>
          <ul class="ai-recommendation-list">
            ${recommendations.map((item, index) => `
              <li class="ai-recommendation-item">
                <div class="ai-recommendation-top">
                  <span class="ai-recommendation-index">${index + 1}</span>
                  <span class="ai-recommendation-title">${escapeHtml(item.title || '')}</span>
                  <span class="ai-priority-badge ${priorityClass(item.priority)}">${escapeHtml(item.priority || 'Medium')}</span>
                </div>
                <p class="ai-recommendation-details">${escapeHtml(item.details || '')}</p>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  function renderInsightNotice(title, message, tone) {
    const { content, meta } = insightElements();
    if (!content || !meta) {
      return;
    }

    meta.textContent = tone === 'empty' ? 'Waiting for report data' : '';
    content.className = `ai-insight-content ai-insight-state ai-insight-state-${tone}`;
    content.innerHTML = `
      <div class="ai-insight-state-title">${escapeHtml(title || 'AI insight')}</div>
      <p class="ai-insight-state-message">${escapeHtml(message || '')}</p>
    `;
  }

  function renderInsightUnavailable(message) {
    renderInsightNotice('AI insight unavailable', message, 'error');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function priorityClass(priority) {
    const normalized = String(priority || '').trim().toLowerCase();
    if (normalized === 'critical') return 'is-critical';
    if (normalized === 'high') return 'is-high';
    if (normalized === 'low') return 'is-low';
    return 'is-medium';
  }

  function formatInsightTimestamp(value) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return 'Generated moments ago';
    }

    return `Generated ${date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  window.downloadAnalytics = function () {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF library is still loading. Please try again in a moment.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    const col2 = 220;

    const bladeSummary = bladeAnalytics.summary || bladeAnalytics.stats || {};
    const summary = analyticsData && analyticsData.summary ? analyticsData.summary : bladeSummary;

    const total = summary.total || 0;
    const resolved = summary.resolved || 0;
    const pending = summary.pending || 0;
    const inProg = summary.in_progress || 0;
    const rejected = summary.rejected || 0;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const catLabels = analyticsData && analyticsData.by_category
      ? analyticsData.by_category.labels
      : (bladeAnalytics.categoryLabels || []);
    const catValues = analyticsData && analyticsData.by_category
      ? analyticsData.by_category.values
      : (bladeAnalytics.categoryData || []);
    const stLabels = analyticsData && analyticsData.by_status
      ? analyticsData.by_status.labels
      : (bladeAnalytics.statusLabels || []);
    const stValues = analyticsData && analyticsData.by_status
      ? analyticsData.by_status.values
      : (bladeAnalytics.statusData || []);
    const mLabels = analyticsData && analyticsData.monthly
      ? analyticsData.monthly.labels
      : (bladeAnalytics.monthLabels || []);
    const mValues = analyticsData && analyticsData.monthly
      ? analyticsData.monthly.values
      : (bladeAnalytics.trendData || []);

    const now = new Date().toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      const rowH = 22;
      const tableW = colWidths.reduce((sum, value) => sum + value, 0);
      let x;

      checkPage(rowH + 10);
      doc.setFillColor(26, 54, 126);
      doc.rect(margin, y - 14, tableW, rowH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      x = margin;
      headers.forEach((header, index) => {
        doc.text(header, x + 8, y + 1);
        x += colWidths[index];
      });
      y += rowH - 2;

      rows.forEach((row, index) => {
        checkPage(rowH);
        doc.setFillColor(index % 2 === 0 ? 249 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 251 : 255);
        doc.rect(margin, y - 14, tableW, rowH, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(31, 41, 55);
        x = margin;
        row.forEach((cell, cellIndex) => {
          doc.text(String(cell), x + 8, y + 1);
          x += colWidths[cellIndex];
        });
        y += rowH;
      });

      y += 12;
    }

    drawHeader();
    y = 92;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated on: ${now}`, margin, y);
    y += 26;

    sectionHeading('SUMMARY');
    row('Total Reports', total);
    row('Resolved', resolved);
    row('Pending', pending);
    row('In Progress', inProg);
    row('Rejected', rejected);
    row('Resolution Rate', `${rate}%`);
    y += 8;

    // Add AI Insight Section if available
    if (insightData && insightData.state === 'ok') {
      sectionHeading('AI INSIGHT - BARANGAY REPORT INTERPRETATION');
      
      // Headline
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(26, 54, 126);
      checkPage(30);
      const headlineLines = doc.splitTextToSize(insightData.headline, pageW - (margin * 2));
      doc.text(headlineLines, margin, y);
      y += (headlineLines.length * 5) + 10;
      
      // Summary
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      checkPage(50);
      const summaryLines = doc.splitTextToSize(insightData.summary, pageW - (margin * 2));
      doc.text(summaryLines, margin, y);
      y += (summaryLines.length * 5) + 10;
      
      // Common Problem
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39);
      checkPage(25);
      doc.text('Common Problem:', margin, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);
      checkPage(25);
      const problemLines = doc.splitTextToSize(insightData.common_problem, pageW - (margin * 2));
      doc.text(problemLines, margin, y);
      y += (problemLines.length * 5) + 12;
      
      // Evidence
      if (insightData.evidence && insightData.evidence.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(17, 24, 39);
        checkPage(25);
        doc.text('Evidence:', margin, y);
        y += 8;
        
        insightData.evidence.forEach((item, index) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(26, 54, 126);
          checkPage(20);
          doc.text(`${index + 1}. ${item.label}`, margin + 6, y);
          y += 6;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(55, 65, 81);
          checkPage(20);
          const detailLines = doc.splitTextToSize(item.detail, pageW - (margin * 2) - 6);
          doc.text(detailLines, margin + 6, y);
          y += (detailLines.length * 5) + 4;
        });
        y += 8;
      }
      
      // Recommendations
      if (insightData.recommendations && insightData.recommendations.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(17, 24, 39);
        checkPage(25);
        doc.text('Recommendations:', margin, y);
        y += 8;
        
        insightData.recommendations.forEach((item, index) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(26, 54, 126);
          checkPage(20);
          doc.text(`${index + 1}. ${item.title} [${item.priority}]`, margin + 6, y);
          y += 6;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(55, 65, 81);
          checkPage(20);
          const detailsLines = doc.splitTextToSize(item.details, pageW - (margin * 2) - 6);
          doc.text(detailsLines, margin + 6, y);
          y += (detailsLines.length * 5) + 4;
        });
        y += 8;
      }
    }

    sectionHeading('REPORTS BY CATEGORY');
    table(
      ['Category', 'Count'],
      catLabels.map((label, index) => [label, catValues[index]]),
      [360, 80]
    );

    sectionHeading('REPORTS BY STATUS');
    table(
      ['Status', 'Count', 'Percentage'],
      stLabels.map((label, index) => {
        const percentage = total > 0 ? Math.round((stValues[index] / total) * 100) : 0;
        return [label, stValues[index], `${percentage}%`];
      }),
      [260, 80, 100]
    );

    sectionHeading('MONTHLY REPORTS TREND');
    table(
      ['Month', 'Reports'],
      mLabels.map((label, index) => [label, mValues[index]]),
      [260, 180]
    );

    const totalPages = doc.internal.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `CiviReport  •  Analytics Report  •  Page ${page} of ${totalPages}`,
        pageW / 2,
        pageH - 20,
        { align: 'center' }
      );
    }

    doc.save(`Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };
});
