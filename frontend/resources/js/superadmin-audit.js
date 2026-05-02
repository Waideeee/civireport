const DEFAULT_PAGE_SIZE = 20;

let currentPage = 1;
let totalRecords = 0;
let totalPages = 1;
let currentSearch = "";
let currentStatus = "";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatAuditDate(value) {
  if (!value) return "-";
  const normalized = String(value).includes("T") ? String(value) : String(value).replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function statusBadge(status) {
  const normalized = String(status || "").toLowerCase();
  const label = normalized ? normalized.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "-";

  let badgeClass = "badge-pending";
  if (normalized === "active" || normalized === "approved" || normalized === "resolved") {
    badgeClass = "badge-approved";
  } else if (normalized === "inactive" || normalized === "deactivated" || normalized === "deleted") {
    badgeClass = "badge-rejected";
  } else if (normalized === "pending") {
    badgeClass = "badge-pending";
  } else if (normalized === "in_progress") {
    badgeClass = "badge-inprogress";
  }

  return `<span class="audit-badge ${badgeClass}">${escapeHtml(label)}</span>`;
}

function initLayout() {
  const container = document.getElementById("superadmin-audit-log");
  if (!container) return;

  container.innerHTML = `
    <div class="al-toolbar">
      <div class="al-toolbar-left">
        <div class="al-search-wrap">
          <svg class="al-search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="al-search" class="al-search" placeholder="Search action..." />
        </div>
        <select id="al-status" class="al-select">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="deactivated">Deactivated</option>
          <option value="rejected">Rejected</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>
      <div class="al-toolbar-right">
        <div class="al-count" id="al-record-count">0 records</div>
      </div>
    </div>

    <div class="al-table-wrap">
      <table class="al-table">
        <thead>
          <tr>
            <th class="al-th">Audit Date</th>
            <th class="al-th">Performed By</th>
            <th class="al-th">Affected User</th>
            <th class="al-th">Action</th>
            <th class="al-th">Old Status</th>
            <th class="al-th">New Status</th>
            <th class="al-th">Created At</th>
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

function renderTable(payload) {
  const tbody = document.getElementById("al-tbody");
  if (!tbody) return;

  const rows = Array.isArray(payload.data) ? payload.data : [];
  totalRecords = Number(payload.total || 0);
  totalPages = Math.max(1, Math.ceil(totalRecords / DEFAULT_PAGE_SIZE));

  tbody.innerHTML = rows.length
    ? rows.map((row) => `
        <tr>
          <td class="al-td al-mono">${escapeHtml(formatAuditDate(row.audit_date))}</td>
          <td class="al-td">${escapeHtml(row.superadmin_name || "Unknown")}</td>
          <td class="al-td">${escapeHtml(row.user_name || "-")}</td>
          <td class="al-td al-desc">${escapeHtml(row.action_notes || "-")}</td>
          <td class="al-td">${escapeHtml(row.old_status || "-")}</td>
          <td class="al-td">${statusBadge(row.new_status || "-")}</td>
          <td class="al-td al-mono">${escapeHtml(formatAuditDate(row.created_at))}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="7" class="al-empty">No audit records found.</td></tr>`;

  document.getElementById("al-record-count").textContent = `${totalRecords} record${totalRecords !== 1 ? "s" : ""}`;
  document.getElementById("al-page-indicator").textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById("al-prev").disabled = currentPage <= 1;
  document.getElementById("al-next").disabled = currentPage >= totalPages;
}

function renderError() {
  const tbody = document.getElementById("al-tbody");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="al-empty" style="color:#b91c1c;">Failed to load audit logs.</td></tr>';
}

function buildQuery() {
  const params = new URLSearchParams({
    page: String(currentPage),
    per_page: String(DEFAULT_PAGE_SIZE),
  });

  if (currentSearch) params.set("search", currentSearch);
  if (currentStatus) params.set("status", currentStatus);
  return params.toString();
}

function fetchAuditLogs() {
  fetch(`/superadmin/proxy/audit-logs?${buildQuery()}`)
    .then((response) => response.json())
    .then((payload) => renderTable(payload))
    .catch(() => renderError());
}

function bindEvents() {
  document.getElementById("al-search")?.addEventListener("input", (event) => {
    currentSearch = event.target.value.trim();
    currentPage = 1;
    fetchAuditLogs();
  });

  document.getElementById("al-status")?.addEventListener("change", (event) => {
    currentStatus = event.target.value;
    currentPage = 1;
    fetchAuditLogs();
  });

  document.getElementById("al-prev")?.addEventListener("click", () => {
    if (currentPage <= 1) return;
    currentPage -= 1;
    fetchAuditLogs();
  });

  document.getElementById("al-next")?.addEventListener("click", () => {
    if (currentPage >= totalPages) return;
    currentPage += 1;
    fetchAuditLogs();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("superadmin-audit-log")) return;
  initLayout();
  fetchAuditLogs();
});
