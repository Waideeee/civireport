// ─── Dummy Data ───────────────────────────────────────────────────────────────

const auditLogData = [
  {
    id: 1,
    timestamp: "2025-03-23 08:14:02",
    user: "admin@example.com",
    role: "Admin",
    action: "LOGIN",
    module: "Auth",
    description: "User logged in successfully.",
    ip: "192.168.1.10",
    status: "success",
  },
  {
    id: 2,
    timestamp: "2025-03-23 08:20:45",
    user: "juan.dela.cruz@example.com",
    role: "Manager",
    action: "CREATE",
    module: "Inventory",
    description: "Added new item: 'Paracetamol 500mg x100'.",
    ip: "192.168.1.22",
    status: "success",
  },
  {
    id: 3,
    timestamp: "2025-03-23 08:35:11",
    user: "maria.santos@example.com",
    role: "Staff",
    action: "UPDATE",
    module: "Orders",
    description: "Updated order #ORD-2045 status to 'Processing'.",
    ip: "192.168.1.31",
    status: "success",
  },
  {
    id: 4,
    timestamp: "2025-03-23 09:00:58",
    user: "jose.reyes@example.com",
    role: "Staff",
    action: "DELETE",
    module: "Inventory",
    description: "Deleted expired item: 'Amoxicillin 250mg'.",
    ip: "192.168.1.45",
    status: "warning",
  },
  {
    id: 5,
    timestamp: "2025-03-23 09:15:30",
    user: "unknown",
    role: "—",
    action: "LOGIN",
    module: "Auth",
    description: "Failed login attempt for 'admin@example.com'.",
    ip: "203.0.113.55",
    status: "danger",
  },
  {
    id: 6,
    timestamp: "2025-03-23 09:42:17",
    user: "admin@example.com",
    role: "Admin",
    action: "EXPORT",
    module: "Reports",
    description: "Exported monthly sales report (March 2025).",
    ip: "192.168.1.10",
    status: "success",
  },
  {
    id: 7,
    timestamp: "2025-03-23 10:05:44",
    user: "rosa.lim@example.com",
    role: "Pharmacist",
    action: "DISPENSE",
    module: "Prescription",
    description: "Dispensed Rx #RX-8821 to patient ID P-1042.",
    ip: "192.168.1.66",
    status: "success",
  },
  {
    id: 8,
    timestamp: "2025-03-23 10:28:03",
    user: "juan.dela.cruz@example.com",
    role: "Manager",
    action: "UPDATE",
    module: "Users",
    description: "Changed role of 'rosa.lim' from Staff to Pharmacist.",
    ip: "192.168.1.22",
    status: "warning",
  },
  {
    id: 9,
    timestamp: "2025-03-23 11:00:00",
    user: "jose.reyes@example.com",
    role: "Staff",
    action: "VIEW",
    module: "Reports",
    description: "Viewed inventory shortage report.",
    ip: "192.168.1.45",
    status: "success",
  },
  {
    id: 10,
    timestamp: "2025-03-23 11:33:19",
    user: "admin@example.com",
    role: "Admin",
    action: "DELETE",
    module: "Users",
    description: "Deactivated user account: 'temp.user@example.com'.",
    ip: "192.168.1.10",
    status: "danger",
  },
  {
    id: 11,
    timestamp: "2025-03-23 12:10:55",
    user: "maria.santos@example.com",
    role: "Staff",
    action: "CREATE",
    module: "Prescription",
    description: "Created new prescription Rx #RX-8830 for patient P-1055.",
    ip: "192.168.1.31",
    status: "success",
  },
  {
    id: 12,
    timestamp: "2025-03-23 13:45:22",
    user: "rosa.lim@example.com",
    role: "Pharmacist",
    action: "UPDATE",
    module: "Inventory",
    description: "Restocked 'Metformin 500mg' — quantity updated to 300.",
    ip: "192.168.1.66",
    status: "success",
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 8;
let currentPage = 1;
let filteredData = [...auditLogData];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status) {
  const map = {
    success: { label: "Success", cls: "badge-success" },
    warning: { label: "Warning", cls: "badge-warning" },
    danger:  { label: "Failed",  cls: "badge-danger"  },
  };
  const s = map[status] || { label: status, cls: "" };
  return `<span class="audit-badge ${s.cls}">${s.label}</span>`;
}

function actionChip(action) {
  const cls = {
    LOGIN:    "chip-blue",
    LOGOUT:   "chip-gray",
    CREATE:   "chip-green",
    UPDATE:   "chip-yellow",
    DELETE:   "chip-red",
    EXPORT:   "chip-purple",
    VIEW:     "chip-gray",
    DISPENSE: "chip-teal",
  }[action] || "chip-gray";
  return `<span class="audit-chip ${cls}">${action}</span>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderTable() {
  const container = document.getElementById("audit-log");
  if (!container) return;

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
  const start = (currentPage - 1) * ROWS_PER_PAGE;
  const pageData = filteredData.slice(start, start + ROWS_PER_PAGE);

  const rows = pageData.length
    ? pageData
        .map(
          (r) => `
      <tr>
        <td class="al-td al-mono">${escapeHtml(r.timestamp)}</td>
        <td class="al-td">
          <div class="al-user">${escapeHtml(r.user)}</div>
          <div class="al-role">${escapeHtml(r.role)}</div>
        </td>
        <td class="al-td">${actionChip(r.action)}</td>
        <td class="al-td al-module">${escapeHtml(r.module)}</td>
        <td class="al-td al-desc">${escapeHtml(r.description)}</td>
        <td class="al-td al-mono al-ip">${escapeHtml(r.ip)}</td>
        <td class="al-td">${statusBadge(r.status)}</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="7" class="al-empty">No audit records found.</td></tr>`;

  container.innerHTML = `
    <div class="al-toolbar">
      <div class="al-toolbar-left">
        <input
          type="text"
          id="al-search"
          class="al-search"
          placeholder="Search user, action, module…"
          value="${escapeHtml(currentSearch)}"
        />
        <select id="al-filter-status" class="al-select">
          <option value="">All Status</option>
          <option value="success" ${currentStatusFilter === "success" ? "selected" : ""}>Success</option>
          <option value="warning" ${currentStatusFilter === "warning" ? "selected" : ""}>Warning</option>
          <option value="danger"  ${currentStatusFilter === "danger"  ? "selected" : ""}>Failed</option>
        </select>
        <select id="al-filter-action" class="al-select">
          <option value="">All Actions</option>
          ${["LOGIN","CREATE","UPDATE","DELETE","EXPORT","VIEW","DISPENSE"]
            .map(a => `<option value="${a}" ${currentActionFilter === a ? "selected" : ""}>${a}</option>`)
            .join("")}
        </select>
      </div>
      <div class="al-count">${filteredData.length} record${filteredData.length !== 1 ? "s" : ""}</div>
    </div>

    <div class="al-table-wrap">
      <table class="al-table">
        <thead>
          <tr>
            <th class="al-th">Timestamp</th>
            <th class="al-th">User</th>
            <th class="al-th">Action</th>
            <th class="al-th">Module</th>
            <th class="al-th">Description</th>
            <th class="al-th">IP Address</th>
            <th class="al-th">Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="al-pagination">
      <button class="al-page-btn" id="al-prev" ${currentPage === 1 ? "disabled" : ""}>&#8592; Prev</button>
      <span class="al-page-info">Page ${currentPage} of ${totalPages || 1}</span>
      <button class="al-page-btn" id="al-next" ${currentPage >= totalPages ? "disabled" : ""}>Next &#8594;</button>
    </div>
  `;

  bindEvents();
}

// ─── Filtering & Pagination ───────────────────────────────────────────────────

let currentSearch       = "";
let currentStatusFilter = "";
let currentActionFilter = "";

function applyFilters() {
  const q = currentSearch.toLowerCase();
  filteredData = auditLogData.filter((r) => {
    const matchSearch =
      !q ||
      r.user.toLowerCase().includes(q) ||
      r.action.toLowerCase().includes(q) ||
      r.module.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.ip.includes(q);
    const matchStatus = !currentStatusFilter || r.status === currentStatusFilter;
    const matchAction = !currentActionFilter || r.action === currentActionFilter;
    return matchSearch && matchStatus && matchAction;
  });
  currentPage = 1;
  renderTable();
}

function bindEvents() {
  document.getElementById("al-search")?.addEventListener("input", (e) => {
    currentSearch = e.target.value;
    applyFilters();
  });

  document.getElementById("al-filter-status")?.addEventListener("change", (e) => {
    currentStatusFilter = e.target.value;
    applyFilters();
  });

  document.getElementById("al-filter-action")?.addEventListener("change", (e) => {
    currentActionFilter = e.target.value;
    applyFilters();
  });

  document.getElementById("al-prev")?.addEventListener("click", () => {
    if (currentPage > 1) { currentPage--; renderTable(); }
  });

  document.getElementById("al-next")?.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
    if (currentPage < totalPages) { currentPage++; renderTable(); }
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  renderTable();
});