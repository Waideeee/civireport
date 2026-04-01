document.addEventListener('DOMContentLoaded', function () {

  // ===== AI Recommendation Data (NO DUMMY DATA) =====
  const AI_RECOMMENDATIONS = {};

  const DEFAULT_RECOMMENDATION = {
    urgency: 'Medium',
    summary: '',
    steps: [],
    action: '',
  };

  function getAIRecommendation(subtype) {
    return AI_RECOMMENDATIONS[subtype] || DEFAULT_RECOMMENDATION;
  }

  function getUrgency(subtype) {
    return getAIRecommendation(subtype).urgency || 'Medium';
  }

  function urgencyBadgeClass(level) {
    return {
      'Critical': 'urgency-critical',
      'High':     'urgency-high',
      'Medium':   'urgency-medium',
      'Low':      'urgency-low',
    }[level] || 'urgency-medium';
  }

  // ===== State (NO DUMMY DATA) =====
  const complaints = [];

  // ===== Config =====
  const ROWS_PER_PAGE = 8;
  let currentPage    = 1;
  let currentSearch  = "";
  let currentStatus  = "";
  let currentType    = "";
  let currentUrgency = "";
  let filteredData   = [...complaints];

  // ===== Badge class helper =====
  function badgeClass(status) {
    const map = {
      'Pending':     'badge-pending',
      'Approved':    'badge-approved',
      'Rejected':    'badge-rejected',
      'In Progress': 'badge-progress'
    };
    return map[status] || '';
  }

  // ===== Apply Filters =====
  function applyFilters() {
    const q = currentSearch.toLowerCase();

    filteredData = complaints.filter(c => {
      const urgency      = getUrgency(c.subtype);
      const matchSearch  = !q ||
        c.ticket_id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.subtype.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q) ||
        c.contact.includes(q);
      const matchStatus  = !currentStatus  || c.status === currentStatus;
      const matchType    = !currentType    || c.type === currentType;
      const matchUrgency = !currentUrgency || urgency === currentUrgency;
      return matchSearch && matchStatus && matchType && matchUrgency;
    });

    currentPage = 1;
    renderTable();
  }

  // ===== Render Table =====
  function renderTable() {
    const tbody      = document.getElementById('reports-tbody');
    const countEl    = document.getElementById('cr-count');
    const prevBtn    = document.getElementById('cr-prev');
    const nextBtn    = document.getElementById('cr-next');
    const pageInfoEl = document.getElementById('cr-page-info');
    if (!tbody) return;

    const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
    const start      = (currentPage - 1) * ROWS_PER_PAGE;
    const pageData   = filteredData.slice(start, start + ROWS_PER_PAGE);

    if (countEl)    countEl.textContent    = `${filteredData.length} record${filteredData.length !== 1 ? 's' : ''}`;
    if (pageInfoEl) pageInfoEl.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    if (prevBtn)    prevBtn.disabled       = currentPage === 1;
    if (nextBtn)    nextBtn.disabled       = currentPage >= totalPages;

    if (!pageData.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-state">No complaints found.</td></tr>`;
      return;
    }

    tbody.innerHTML = pageData.map(c => {
      const urgency = getUrgency(c.subtype);
      return `
        <tr onclick="openModal('${c.ticket_id}')" style="cursor:pointer;">
          <td><strong>${c.ticket_id}</strong></td>
          <td>${c.type}</td>
          <td>${c.subtype}</td>
          <td>${c.location}</td>
          <td><span class="media-link">📎 View</span></td>
          <td>${c.name}</td>
          <td>${c.contact}</td>
          <td><span class="urgency-badge ${urgencyBadgeClass(urgency)}">${urgency}</span></td>
          <td><span class="badge ${badgeClass(c.status)}">${c.status}</span></td>
        </tr>
      `;
    }).join('');
  }

  // ===== Bind toolbar events =====
  function bindToolbar() {
    document.getElementById('cr-search')?.addEventListener('input', function () {
      currentSearch = this.value;
      applyFilters();
    });
    document.getElementById('cr-filter-status')?.addEventListener('change', function () {
      currentStatus = this.value;
      applyFilters();
    });
    document.getElementById('cr-filter-type')?.addEventListener('change', function () {
      currentType = this.value;
      applyFilters();
    });
    document.getElementById('cr-filter-urgency')?.addEventListener('change', function () {
      currentUrgency = this.value;
      applyFilters();
    });
    document.getElementById('cr-prev')?.addEventListener('click', function () {
      if (currentPage > 1) { currentPage--; renderTable(); }
    });
    document.getElementById('cr-next')?.addEventListener('click', function () {
      const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
      if (currentPage < totalPages) { currentPage++; renderTable(); }
    });
  }

  // ===== Init =====
  bindToolbar();
  applyFilters();
});