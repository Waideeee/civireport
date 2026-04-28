const ROWS_PER_PAGE = 10;
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

function actionBadge(action) {
  if (!action) return `<span class="audit-badge badge-pending">Unknown</span>`;

  const map = {
    "approved":    "badge-approved",
    "reactivated": "badge-approved",
    "rejected":    "badge-rejected",
    "deactivated": "badge-rejected",
    "pending":     "badge-pending"
  };
  
  const cls = map[action.toLowerCase()] || "badge-pending";
  return `<span class="audit-badge ${cls}">${escapeHtml(action.toUpperCase())}</span>`;
}

function sortData(data) {
  return [...data].sort((a, b) =>
    currentSort === "newest" ? b.id - a.id : a.id - b.id
  );
}

function initLayout() {
  const container = document.getElementById("superadmin-audit-log");
  if (!container) return;

  container.innerHTML = `
    <div class="al-toolbar">
      <div class="al-search-wrap">
        <svg class="al-search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" id="al-search" class="al-search" placeholder="Search admin, target, action…" />
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
            <th class="al-th">TARGET (BARANGAY ADMIN)</th>
            <th class="al-th">OLD STATUS</th>
            <th class="al-th">ACTION / NEW STATUS</th>
            <th class="al-th">SUPER ADMIN</th>
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
          <td class="al-td al-mono">SA-AUD-${String(r.id).padStart(3, '0')}</td>
          <td class="al-td al-mono">${escapeHtml(r.created_at)}</td>
          <td class="al-td">${escapeHtml(r.target_name)}</td>
          <td class="al-td"><span class="audit-badge badge-pending">N/A</span></td>
          <td class="al-td">${actionBadge(r.action)}</td>
          <td class="al-td">${escapeHtml(r.admin_name)}</td>
        </tr>`).join("")
    : `<tr><td colspan="6" class="al-empty">No audit records found.</td></tr>`;

  tbody.innerHTML = rows;

  document.getElementById("al-record-count").textContent = `${filteredData.length} record${filteredData.length !== 1 ? "s" : ""}`;
  document.getElementById("al-page-indicator").textContent = `Page ${currentPage} of ${totalPages}`;

  document.getElementById("al-prev").disabled = currentPage <= 1;
  document.getElementById("al-next").disabled = currentPage >= totalPages;
}

function applyFilters() {
  const q = currentSearch.toLowerCase();
  filteredData = !q
    ? [...auditLogData]
    : auditLogData.filter((r) => {
        return String(r.id).includes(q) ||
        (r.admin_name    || '').toLowerCase().includes(q) ||
        (r.target_name   || '').toLowerCase().includes(q) ||
        (r.action        || '').toLowerCase().includes(q) ||
        (r.created_at    || '').toLowerCase().includes(q);
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
    const tableWrap = document.getElementById("superadmin-audit-log");
    if (!tableWrap) return;
    
    initLayout();
    
    // We'll fetch from the Laravel route that calls our FastApiService
    // But since the controller already fetches logs for the view, we could also just pass them via JSON.
    // However, the instructions say "match the exact same design" which uses JS fetching in AuditLog.js.
    // I'll create a small API route in web.php to proxy the superadmin logs for this JS.
    
    fetch('/superadmin/proxy/audit-logs')
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
