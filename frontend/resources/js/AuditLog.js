// ─── Dummy Data ───────────────────────────────────────────────────────────────

const auditLogData = [
  { id: "AUD-001", datetime: "2025-03-23 08:14:02", admin: "Juan dela Cruz",  complaintId: "#001", oldStatus: "Pending",     newStatus: "In Progress" },
  { id: "AUD-002", datetime: "2025-03-23 08:35:11", admin: "Maria Santos",    complaintId: "#002", oldStatus: "In Progress", newStatus: "Approved"    },
  { id: "AUD-003", datetime: "2025-03-23 09:00:58", admin: "Jose Reyes",      complaintId: "#003", oldStatus: "Pending",     newStatus: "Rejected"    },
  { id: "AUD-004", datetime: "2025-03-23 09:42:17", admin: "Juan dela Cruz",  complaintId: "#004", oldStatus: "Pending",     newStatus: "In Progress" },
  { id: "AUD-005", datetime: "2025-03-23 10:05:44", admin: "Rosa Lim",        complaintId: "#005", oldStatus: "In Progress", newStatus: "Approved"    },
  { id: "AUD-006", datetime: "2025-03-23 10:28:03", admin: "Maria Santos",    complaintId: "#001", oldStatus: "In Progress", newStatus: "Approved"    },
  { id: "AUD-007", datetime: "2025-03-23 11:00:00", admin: "Jose Reyes",      complaintId: "#006", oldStatus: "Pending",     newStatus: "In Progress" },
  { id: "AUD-008", datetime: "2025-03-23 11:33:19", admin: "Rosa Lim",        complaintId: "#007", oldStatus: "In Progress", newStatus: "Rejected"    },
  { id: "AUD-009", datetime: "2025-03-23 12:10:55", admin: "Juan dela Cruz",  complaintId: "#008", oldStatus: "Pending",     newStatus: "In Progress" },
  { id: "AUD-010", datetime: "2025-03-23 13:45:22", admin: "Maria Santos",    complaintId: "#009", oldStatus: "In Progress", newStatus: "Approved"    },
  { id: "AUD-011", datetime: "2025-03-23 14:20:08", admin: "Jose Reyes",      complaintId: "#010", oldStatus: "Pending",     newStatus: "Rejected"    },
  { id: "AUD-012", datetime: "2025-03-23 15:05:33", admin: "Rosa Lim",        complaintId: "#011", oldStatus: "Pending",     newStatus: "In Progress" },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 8;
let currentPage   = 1;
let filteredData  = [...auditLogData];
let currentSearch = "";
let currentSort   = "newest"; // "newest" | "oldest"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Badge color map — one source of truth, always consistent.
 *
 *  Pending     → yellow  (.badge-pending)
 *  In Progress → blue    (.badge-inprogress)
 *  Approved    → green   (.badge-approved)
 *  Rejected    → red     (.badge-rejected)
 */
function statusBadge(status) {
  const map = {
    "Pending":     "badge-pending",
    "In Progress": "badge-inprogress",
    "Approved":    "badge-approved",
    "Rejected":    "badge-rejected",
  };
  const cls = map[status] || "badge-pending";
  return `<span class="audit-badge ${cls}">${escapeHtml(status)}</span>`;
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

function sortData(data) {
  return [...data].sort((a, b) => {
    const numA = parseInt(a.id.replace("AUD-", ""), 10);
    const numB = parseInt(b.id.replace("AUD-", ""), 10);
    return currentSort === "newest" ? numB - numA : numA - numB;
  });
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderTable() {
  const container = document.getElementById("audit-log");
  if (!container) return;

  const sorted     = sortData(filteredData);
  const totalPages = Math.ceil(sorted.length / ROWS_PER_PAGE) || 1;
  const start      = (currentPage - 1) * ROWS_PER_PAGE;
  const pageData   = sorted.slice(start, start + ROWS_PER_PAGE);

  const rows = pageData.length
    ? pageData.map((r) => `
      <tr>
        <td class="al-td al-mono">${escapeHtml(r.id)}</td>
        <td class="al-td al-mono">${escapeHtml(r.datetime)}</td>
        <td class="al-td">${escapeHtml(r.admin)}</td>
        <td class="al-td al-mono">${escapeHtml(r.complaintId)}</td>
        <td class="al-td">${statusBadge(r.oldStatus)}</td>
        <td class="al-td">${statusBadge(r.newStatus)}</td>
      </tr>`).join("")
    : `<tr><td colspan="6" class="al-empty">No audit records found.</td></tr>`;

  container.innerHTML = `
    <div class="al-toolbar">
      <div class="al-search-wrap">
        <svg class="al-search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          id="al-search"
          class="al-search"
          placeholder="Search audit ID, admin, complaint…"
          value="${escapeHtml(currentSearch)}"
        />
      </div>
      <div class="al-toolbar-right">
        <select id="al-sort" class="al-select">
          <option value="newest" ${currentSort === "newest" ? "selected" : ""}>Newest First</option>
          <option value="oldest" ${currentSort === "oldest" ? "selected" : ""}>Oldest First</option>
        </select>
        <div class="al-count">${filteredData.length} record${filteredData.length !== 1 ? "s" : ""}</div>
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
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="al-pagination">
      <button class="al-page-btn" id="al-prev" ${currentPage === 1 ? "disabled" : ""}>&#8592; Prev</button>
      <span class="al-page-info">Page ${currentPage} of ${totalPages}</span>
      <button class="al-page-btn" id="al-next" ${currentPage >= totalPages ? "disabled" : ""}>Next &#8594;</button>
    </div>
  `;

  bindEvents();
}

// ─── Filtering & Pagination ───────────────────────────────────────────────────

function applyFilters() {
  const q = currentSearch.toLowerCase();
  filteredData = !q
    ? [...auditLogData]
    : auditLogData.filter((r) =>
        r.id.toLowerCase().includes(q) ||
        r.admin.toLowerCase().includes(q) ||
        r.complaintId.toLowerCase().includes(q) ||
        r.oldStatus.toLowerCase().includes(q) ||
        r.newStatus.toLowerCase().includes(q)
      );
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

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  renderTable();
});