const ROWS_PER_PAGE = 8;
let currentPage   = 1;
let auditLogData  = [];
let filteredData  = [];
let currentSearch = "";
let currentSort   = "newest";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function statusBadge(status) {
  if (!status) return `<span class="audit-badge badge-pending">Unknown</span>`;

  let baseStatus = status;
  let extraText = "";
  if (status.includes(" (")) {
    const parts = status.split(" (");
    baseStatus = parts[0];
    extraText = " (" + parts[1];
  }

  const map = {
    "Pending":     "badge-pending",
    "In Progress": "badge-inprogress",
    "in progress": "badge-inprogress",
    "Approved":    "badge-approved",
    "Rejected":    "badge-rejected",
    "Resolved":    "badge-approved"
  };
  
  // Try exact match first, or case-insensitive fallback
  let cls = map[baseStatus];
  if (!cls) {
    const key = Object.keys(map).find(k => k.toLowerCase() === baseStatus.toLowerCase());
    cls = key ? map[key] : "badge-pending";
  }

  let html = `<span class="audit-badge ${cls}">${escapeHtml(baseStatus)}</span>`;
  if (extraText) {
    html += `<div style="font-size: 0.75rem; color: #6b7280; margin-top: 4px; font-weight: 500;">${escapeHtml(extraText)}</div>`;
  }
  return html;
}

function sortData(data) {
  return [...data].sort((a, b) =>
    currentSort === "newest" ? b.audit_id - a.audit_id : a.audit_id - b.audit_id
  );
}

function initLayout() {
  const container = document.getElementById("audit-log");
  if (!container) return;

  container.innerHTML = `
    <div class="al-toolbar">
      <div class="al-search-wrap">
        <svg class="al-search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" id="al-search" class="al-search" placeholder="Search admin, complaint…" />
      </div>
      <div class="al-toolbar-right">
        <select id="al-sort" class="al-select">
          <option value="newest" selected>Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        <div class="al-count" id="al-record-count">0 records</div>
      </div>
    </div>

    <div class="al-table-wrap">
      <table class="al-table">
        <thead>
          <tr>
            <th class="al-th">AUDIT ID</th>
            <th class="al-th">DATE AND TIME</th>
            <th class="al-th">ADMIN</th>
            <th class="al-th">COMPLAINT ID</th>
            <th class="al-th">OLD STATUS</th>
            <th class="al-th">NEW STATUS</th>
          </tr>
        </thead>
        <tbody id="al-tbody"></tbody>
      </table>
    </div>

    <div class="al-pagination">
      <button class="al-page-btn" id="al-prev" disabled>&#8592; Prev</button>
      <span class="al-page-info" id="al-page-indicator">Page 1 of 1</span>
      <button class="al-page-btn" id="al-next" disabled>Next &#8594;</button>
    </div>
  `;

  bindEvents();
}

function renderTable() {
  const tbody = document.getElementById("al-tbody");
  if (!tbody) return;

  const sorted     = sortData(filteredData);
  const totalPages = Math.ceil(sorted.length / ROWS_PER_PAGE) || 1;
  const start      = (currentPage - 1) * ROWS_PER_PAGE;
  const pageData   = sorted.slice(start, start + ROWS_PER_PAGE);

  const rows = pageData.length
    ? pageData.map((r) => `
        <tr>
          <td class="al-td al-mono">AUD-${String(r.audit_id).padStart(3, '0')}</td>
          <td class="al-td al-mono">${escapeHtml(r.audit_date)}</td>
          <td class="al-td">${escapeHtml(r.admin_name)}</td>
          <td class="al-td al-mono">#${String(r.complaint_id).padStart(3, '0')}</td>
          <td class="al-td">${statusBadge(r.old_status)}</td>
          <td class="al-td">${statusBadge(r.new_status)}</td>
        </tr>`).join("")
    : `<tr><td colspan="6" class="al-empty">No audit records found.</td></tr>`;

  tbody.innerHTML = rows;

  // Update dynamic counters
  document.getElementById("al-record-count").textContent = `${filteredData.length} record${filteredData.length !== 1 ? "s" : ""}`;
  document.getElementById("al-page-indicator").textContent = `Page ${currentPage} of ${totalPages}`;

  // Update pagination buttons state
  document.getElementById("al-prev").disabled = currentPage <= 1;
  document.getElementById("al-next").disabled = currentPage >= totalPages;
}

function applyFilters() {
  const q = currentSearch.toLowerCase();
  filteredData = !q
    ? [...auditLogData]
    : auditLogData.filter((r) => {
        const audIdStr = `aud-${String(r.audit_id).padStart(3, '0')}`.toLowerCase();
        const compIdStr = `#${String(r.complaint_id).padStart(3, '0')}`.toLowerCase();
        
        return audIdStr.includes(q) ||
        compIdStr.includes(q) ||
        String(r.audit_id).includes(q) ||
        String(r.complaint_id).includes(q) ||
        (r.admin_name    || '').toLowerCase().includes(q) ||
        (r.audit_date    || '').toLowerCase().includes(q) ||
        (r.old_status    || '').toLowerCase().includes(q) ||
        (r.new_status    || '').toLowerCase().includes(q);
      });
  currentPage = 1;
  renderTable();
}

function bindEvents() {
  document.getElementById("al-search")?.addEventListener("input", (e) => {
    currentSearch = e.target.value;
    applyFilters();
  });
  document.getElementById("al-sort")?.addEventListener("change", (e) => {
    currentSort = e.target.value;
    currentPage = 1;
    renderTable();
  });
  document.getElementById("al-prev")?.addEventListener("click", () => {
    if (currentPage > 1) { currentPage--; renderTable(); }
  });
  document.getElementById("al-next")?.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE) || 1;
    if (currentPage < totalPages) { currentPage++; renderTable(); }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLayout();
  
  fetch('/api/audit-logs')
    .then(r => r.json())
    .then(data => {
      auditLogData = data;
      filteredData = [...auditLogData];
      renderTable();
    })
    .catch(() => {
      const tbody = document.getElementById("al-tbody");
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="al-empty" style="color:red;">Failed to load audit logs.</td></tr>';
    });
});