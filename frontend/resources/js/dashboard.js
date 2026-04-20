window.addEventListener('load', function () {

  const dateEl = document.getElementById('topbar-date');
  if (dateEl) {
    const d = new Date();
    dateEl.textContent = d.toLocaleDateString('en-PH', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
  }

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

  function getBadgeClass(status) {
    switch ((status || '').toLowerCase()) {
      case 'pending':     return 'badge badge-pending';
      case 'approved':    return 'badge badge-approved';
      case 'rejected':    return 'badge badge-rejected';
      case 'in progress': return 'badge badge-progress';
      default:            return 'badge';
    }
  }

  // ── Complaint Stats ──────────────────────────────────────
  fetch('/api/dashboard/complaint-stats')
    .then(r => r.json())
    .then(data => {
      animateCount('stat-pending',    data.pending     || 0);
      animateCount('stat-inprogress', data.in_progress || 0);
      animateCount('stat-approved',   data.approved    || 0);
      animateCount('stat-rejected',   data.rejected    || 0);
      animateCount('stat-total',      data.total       || 0);
    })
    .catch(() => {
      ['stat-pending','stat-inprogress','stat-approved','stat-rejected','stat-total']
        .forEach(id => animateCount(id, 0));
    });

  // ── Recent Complaints ────────────────────────────────────
  fetch('/api/complaints')
    .then(r => r.json())
    .then(complaints => {
      var tbody = document.getElementById('recent-tbody');
      if (!tbody) return;
      if (!complaints.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No complaints found</td></tr>';
        return;
      }
      var latest = complaints.slice(0, 5);
      tbody.innerHTML = '';
      latest.forEach(function (c) {
        var id     = String(c.complaint_id).padStart(3, '0');
        var status = c.complaint_status || 'Pending';
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><strong>#' + id + '</strong></td>' +
          '<td>' + (c.complaint_type || '') + '</td>' +
          '<td>' + (c.user_name      || '') + '</td>' +
          '<td><span class="' + getBadgeClass(status) + '">' + status + '</span></td>' +
          '<td>' + (c.complaint_date || '') + '</td>' +
          '<td><button class="btn-view" onclick="window.location=\'/Complaints\'">View</button></td>';
        tbody.appendChild(tr);
      });
    })
    .catch(() => {
      var tbody = document.getElementById('recent-tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Failed to load complaints</td></tr>';
    });

  // ── Pending Users ────────────────────────────────────────
  fetch('/api/dashboard/pending-users')
    .then(r => r.json())
    .then(users => {
      var tbody = document.getElementById('tbody-quickview');
      if (!tbody) return;
      if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No pending accounts</td></tr>';
        return;
      }
      tbody.innerHTML = '';
      users.forEach(function (u) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + u.name + '</td>' +
          '<td>' + u.email + '</td>' +
          '<td>' + (u.created_at ? u.created_at.split('T')[0] : 'N/A') + '</td>' +
          '<td class="actions-cell">' +
            '<button class="btn btn-success" onclick="approveUser(' + u.user_id + ', this)">Approve</button>' +
            '<button class="btn btn-danger"  onclick="rejectUser('  + u.user_id + ', this)">Reject</button>' +
          '</td>';
        tbody.appendChild(tr);
      });
    });

  // ── Registered Users ─────────────────────────────────────
  fetch('/api/dashboard/registered-users')
    .then(r => r.json())
    .then(users => {
      var tbody = document.getElementById('tbody-residents-quickview');
      if (!tbody) return;
      if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">No registered residents</td></tr>';
        return;
      }
      tbody.innerHTML = '';
      users.forEach(function (u) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + u.name + '</td>' +
          '<td>' + u.address + '</td>' +
          '<td><span class="' + getBadgeClass(u.status) + '">' + u.status + '</span></td>';
        tbody.appendChild(tr);
      });
    });

  // ── Recent Activity (Audit Logs) ─────────────────────────
  fetch('/api/audit-logs')
    .then(r => r.json())
    .then(logs => {
      var container = document.getElementById('audit-quick-view');
      if (!container) return;
      if (!logs.length) {
        container.innerHTML = '<div class="empty-state" style="padding: 20px; text-align: center; color: #6b7280;">No recent activity</div>';
        return;
      }
      var latest = logs.slice(0, 5);
      var html = '<table class="cr-table">' +
                 '<thead><tr><th>Date</th><th>Admin</th><th>Complaint ID</th><th>Action</th></tr></thead>' +
                 '<tbody>';
      latest.forEach(function (log) {
        var idStr = String(log.complaint_id).padStart(3, '0');
        var d = log.audit_date ? new Date(log.audit_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A';
        html += '<tr>' +
                  '<td>' + d + '</td>' +
                  '<td>' + (log.admin_name || 'System') + '</td>' +
                  '<td><strong>#' + idStr + '</strong></td>' +
                  '<td><span style="color: #6b7280;">Status: </span><span style="font-weight:600; color: #374151;">' + log.old_status + '</span> &rarr; <span style="font-weight:600; color: #3b82f6;">' + log.new_status + '</span></td>' +
                '</tr>';
      });
      html += '</tbody></table>';
      container.innerHTML = html;
    })
    .catch(() => {
      var container = document.getElementById('audit-quick-view');
      if (container) container.innerHTML = '<div class="empty-state" style="padding: 20px; text-align: center; color: #6b7280;">Failed to load recent activity</div>';
    });

  // ── Approve / Reject handlers ────────────────────────────
  window.approveUser = function(userId, btn) {
    updateUserStatus(userId, 'approved', btn);
  };
  window.rejectUser = function(userId, btn) {
    updateUserStatus(userId, 'rejected', btn);
  };

  function updateUserStatus(userId, status, btn) {
    var row = btn.closest('tr');
    fetch('/UserRecords/users/' + userId + '/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
      },
      body: JSON.stringify({ status: status })
    })
    .then(r => r.json())
    .then(() => {
      if (row) row.remove();
    });
  }

  // ── Notifications ────────────────────────────────────────
  var notifBtn      = document.getElementById('notif-btn');
  var notifDropdown = document.getElementById('notif-dropdown');
  var notifCount    = document.getElementById('notif-count');
  var notifMarkAll  = document.getElementById('notif-mark-all');

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      notifDropdown.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.classList.remove('open');
      }
    });
  }

  if (notifMarkAll) {
    notifMarkAll.addEventListener('click', function () {
      document.querySelectorAll('.notif-dot').forEach(d => d.classList.add('read'));
      if (notifCount) notifCount.style.display = 'none';
    });
  }

});