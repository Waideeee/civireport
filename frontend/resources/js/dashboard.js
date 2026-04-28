window.addEventListener('load', function () {

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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
    var current = parseInt(el.textContent) || 0;
    if (current === target) return; 
    
    var duration = 600;
    var difference = Math.abs(target - current);
    if (difference === 0) return;

    var stepTime = Math.max(Math.floor(duration / difference), 30);
    var timer = setInterval(function () {
      if (current < target) {
        current++;
      } else {
        current--;
      }
      el.textContent = current;
      if (current === target) {
        clearInterval(timer);
      }
    }, stepTime);
  }

  function getBadgeClass(status) {
    switch ((status || '').toLowerCase()) {
      case 'pending':     return 'badge badge-pending';
      case 'resolved':    return 'badge badge-approved';
      case 'approved':    return 'badge badge-approved';
      case 'active':      return 'badge badge-approved';
      case 'rejected':    return 'badge badge-rejected';
      case 'inactive':
      case 'deactivated': return 'badge badge-rejected';
      case 'in_progress':
      case 'in progress': return 'badge badge-progress';
      default:            return 'badge';
    }
  }

  function formatStatus(status) {
    if (!status) return 'Unknown';
    return status.split(/[ _]/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  // ── MAIN DATA REFRESH ──────────────────────────────────────
  function refreshDashboardData() {
    // 1. Complaint Stats
    fetch('/api/dashboard/complaint-stats')
      .then(r => r.json())
      .then(data => {
        animateCount('stat-pending',    data.pending     || 0);
        animateCount('stat-inprogress', data.in_progress || 0);
        animateCount('stat-resolved',   data.resolved    || 0);
        animateCount('stat-rejected',   data.rejected    || 0);
        animateCount('stat-total',      data.total       || 0);
      })
      .catch(err => console.error("Error fetching complaint stats:", err));

    // 2. Recent Complaints
    fetch('/api/complaints')
      .then(r => r.json())
      .then(complaints => {
        var tbody = document.getElementById('recent-tbody');
        if (!tbody) return;
        if (!complaints.length) {
          tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No complaints found</td></tr>';
          return;
        }
        var latest = complaints.slice(0, 5);
        tbody.innerHTML = '';
        latest.forEach(function (c) {
          var id     = String(c.complaint_id).padStart(3, '0');
          var status = c.complaint_status || 'Pending';
          var tr = document.createElement('tr');
          tr.style.cursor = 'pointer';
          tr.onclick = () => window.location = '/Complaints?view=' + c.complaint_id;
          tr.innerHTML =
            '<td><strong>#' + id + '</strong></td>' +
            '<td>' + escapeHtml(c.complaint_type || '') + '</td>' +
            '<td>' + escapeHtml(c.user_name || '') + '</td>' +
            '<td>' + escapeHtml(c.complaint_location || 'N/A') + '</td>' +
            '<td><span class="' + getBadgeClass(status) + '">' + formatStatus(status) + '</span></td>' +
            '<td>' + escapeHtml(c.complaint_date || '') + '</td>';
          tbody.appendChild(tr);
        });
      })
      .catch(err => console.error("Error fetching complaints:", err));

    // 3. Pending Users
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
            '<td>' + escapeHtml(u.name) + '</td>' +
            '<td>' + escapeHtml(u.email) + '</td>' +
            '<td>' + escapeHtml(u.created_at ? u.created_at.split(' ')[0] : 'N/A') + '</td>' +
            '<td class="actions-cell">' +
              '<button class="btn btn-success" onclick="approveUser(' + u.user_id + ', this)">Approve</button>' +
              '<button class="btn btn-danger"  onclick="rejectUser('  + u.user_id + ', this)">Reject</button>' +
            '</td>';
          tbody.appendChild(tr);
        });
      })
      .catch(err => console.error("Error fetching pending users:", err));

    // 4. Registered Residents
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
          var residentStatus = formatStatus(u.status || 'resident');
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td>' + escapeHtml(u.name) + '</td>' +
            '<td>' + escapeHtml(u.address) + '</td>' +
            '<td><span class="' + getBadgeClass(u.status || 'active') + '">' + escapeHtml(residentStatus) + '</span></td>';
          tbody.appendChild(tr);
        });
      })
      .catch(err => console.error("Error fetching registered users:", err));

    // 5. Recent Activity (Audit Logs)
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
                   '<thead><tr><th>Date</th><th>Admin</th><th>Report ID</th><th>Action</th></tr></thead>' +
                   '<tbody>';
        latest.forEach(function (log) {
          var isEmergency = log.emergency_id !== null && log.emergency_id !== undefined;
          var displayId = isEmergency ? String(log.emergency_id).padStart(3, '0') : String(log.complaint_id).padStart(3, '0');
          var prefix = isEmergency ? '#EMG-' : '#';
          
          var d = log.audit_date ? new Date(log.audit_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A';
          html += '<tr>' +
                    '<td>' + escapeHtml(d) + '</td>' +
                    '<td>' + escapeHtml(log.admin_name || 'System') + '</td>' +
                    '<td><strong>' + prefix + displayId + '</strong></td>' +
                    '<td><span style="color: #6b7280;">Status: </span><span style="font-weight:600; color: #374151;">' + escapeHtml(log.old_status) + '</span> &rarr; <span style="font-weight:600; color: #374151;">' + escapeHtml(log.new_status) + '</span></td>' +
                  '</tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
      })
      .catch(err => {
        console.error("Error fetching audit logs:", err);
        var container = document.getElementById('audit-quick-view');
        if (container && !container.innerHTML) container.innerHTML = '<div class="empty-state" style="padding: 20px; text-align: center; color: #6b7280;">Failed to load recent activity</div>';
      });
  }

  // ── INITIAL LOAD ──────────────────────────────────────────
  refreshDashboardData();

  // ── POLLING (Every 3 Seconds) ─────────────────────────────
  setInterval(refreshDashboardData, 3000);

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
      refreshDashboardData();
    });
  }

});
