document.addEventListener('DOMContentLoaded', function () {

  // ===== Topbar Date =====
 const dateEl = document.getElementById('topbar-date');
if (dateEl) {  // ← check muna bago i-set
  const d = new Date();
  dateEl.textContent = d.toLocaleDateString('en-PH', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
}

  // ===== Sample Data =====
  const reports = [
    {
      id: "TKT-001",
      type: "Peace & Order",
      name: "Juan Dela Cruz",
      status: "Pending",
      filed: "02/19/2026"
    },
    {
      id: "TKT-002",
      type: "Infrastructure",
      name: "Maria Santos",
      status: "Approved",
      filed: "02/18/2026"
    },
    {
      id: "TKT-003",
      type: "Health & Sanitation",
      name: "Pedro Reyes",
      status: "In Progress",
      filed: "02/17/2026"
    }
  ];

  const pendingAccounts = [
    { name: "Roberto Cruz", email: "roberto@email.com", date: "02/19/2026" },
    { name: "Linda Go", email: "linda@email.com", date: "02/20/2026" }
  ];

  const residents = [
    { name: "Juan Dela Cruz", address: "Quezon City", status: "Active" },
    { name: "Maria Santos", address: "Quezon City", status: "Active" },
    { name: "Ana Lim", address: "Quezon City", status: "Active" }
  ];

  const activityLog = [
    { text: 'Admin approved account of <strong>Maria Santos</strong>', time: 'Feb 19, 2026 – 10:32 AM' },
    { text: 'Admin rejected report <strong>TKT-005</strong> (Illegal Parking)', time: 'Feb 18, 2026 – 3:14 PM' },
    { text: 'Admin approved report <strong>TKT-004</strong> (Financial Aid Request)', time: 'Feb 17, 2026 – 9:00 AM' }
  ];

  // ===== Helper: get badge class =====
  function getBadgeClass(status) {
    switch (status.toLowerCase()) {
      case 'pending': return 'badge badge-pending';
      case 'approved': return 'badge badge-approved';
      case 'rejected': return 'badge badge-rejected';
      case 'in progress': return 'badge badge-progress';
      default: return 'badge';
    }
  }

  // ===== Populate Stats =====
  var pending = reports.filter(function (r) { return r.status === 'Pending'; }).length;
  var inprogress = reports.filter(function (r) { return r.status === 'In Progress'; }).length;
  var approved = reports.filter(function (r) { return r.status === 'Approved'; }).length;
  var rejected = reports.filter(function (r) { return r.status === 'Rejected'; }).length;
  var total = reports.length;

  animateCount('stat-pending', pending);
  animateCount('stat-inprogress', inprogress);
  animateCount('stat-approved', approved);
  animateCount('stat-rejected', rejected);
  animateCount('stat-total', total);

  // ===== Animate count up =====
  function animateCount(elementId, target) {
    var el = document.getElementById(elementId);
    if (!el) return;
    var current = 0;
    var duration = 600;
    var stepTime = Math.max(Math.floor(duration / (target || 1)), 30);
    var timer = setInterval(function () {
      current++;
      el.textContent = current;
      if (current >= target) {
        clearInterval(timer);
        el.textContent = target;
      }
    }, stepTime);
  }

  // ===== Populate Recent Reports =====
  var recentTbody = document.getElementById('recent-tbody');
  if (recentTbody && reports.length > 0) {
    recentTbody.innerHTML = '';
    reports.forEach(function (r) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><strong>' + r.id + '</strong></td>' +
        '<td>' + r.type + '</td>' +
        '<td>' + r.name + '</td>' +
        '<td><span class="' + getBadgeClass(r.status) + '">' + r.status + '</span></td>' +
        '<td>' + r.filed + '</td>' +
        '<td><button class="btn-view">View</button></td>';
      recentTbody.appendChild(tr);
    });
  }

  // ===== Populate Pending Account Approvals =====
  var accountTbody = document.getElementById('tbody-quickview');
  if (accountTbody && pendingAccounts.length > 0) {
    accountTbody.innerHTML = '';
    pendingAccounts.forEach(function (a) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + a.name + '</td>' +
        '<td>' + a.email + '</td>' +
        '<td>' + a.date + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn btn-success">Approve</button>' +
          '<button class="btn btn-danger">Reject</button>' +
        '</td>';
      accountTbody.appendChild(tr);
    });
  }

  // ===== Populate Registered Residents =====
  var residentsTbody = document.getElementById('tbody-residents-quickview');
  if (residentsTbody && residents.length > 0) {
    residentsTbody.innerHTML = '';
    residents.forEach(function (r) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + r.name + '</td>' +
        '<td>' + r.address + '</td>' +
        '<td><span class="badge badge-active">' + r.status + '</span></td>';
      residentsTbody.appendChild(tr);
    });
  }

  // ===== Populate Recent Activity =====
  var auditDiv = document.getElementById('audit-quick-view');
  if (auditDiv && activityLog.length > 0) {
    auditDiv.innerHTML = '';
    activityLog.forEach(function (log) {
      var item = document.createElement('div');
      item.className = 'log-item';
      item.innerHTML =
        '<div class="log-dot"></div>' +
        '<div>' +
          '<div class="log-text">' + log.text + '</div>' +
          '<div class="log-time">' + log.time + '</div>' +
        '</div>';
      auditDiv.appendChild(item);
    });
  }

});