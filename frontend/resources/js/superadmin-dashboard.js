window.addEventListener('load', function () {
  let refreshInterval = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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

  function formatDateTime(value) {
    if (!value) return 'N/A';
    return String(value).replace('T', ' ').split('.')[0];
  }

  function statusBadge(isActive) {
    return `<span class="badge ${isActive ? 'badge-approved' : 'badge-rejected'}">${isActive ? 'Active' : 'Inactive'}</span>`;
  }

  function refreshDashboardData() {
    fetch('/superadmin/proxy/stats')
      .then(r => r.json())
      .then(data => {
        animateCount('sa-stat-active-admins', data.active_admins || 0);
        animateCount('sa-stat-inactive-admins', data.inactive_admins || 0);
        animateCount('sa-stat-total-residents', data.total_residents || 0);
        animateCount('sa-stat-total-complaints', data.total_complaints || 0);
      })
      .catch(err => console.error('Error fetching superadmin stats:', err));

    fetch('/superadmin/proxy/admins')
      .then(r => r.json())
      .then(admins => {
        var tbody = document.getElementById('sa-admins-tbody');
        if (!tbody) return;

        if (!Array.isArray(admins) || !admins.length) {
          tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No barangay admin accounts found.</td></tr>';
          return;
        }

        var latest = admins
          .filter(admin => {
            var status = String(admin.status || '').toLowerCase();
            return ['active', 'approved', 'deactivated', 'inactive', 'resolved'].includes(status) || !!admin.is_active;
          })
          .slice(0, 5);

        tbody.innerHTML = latest.map(admin => `
          <tr>
            <td>${escapeHtml(admin.user_name || '')}</td>
            <td>${escapeHtml(admin.email || '')}</td>
            <td>${escapeHtml(formatDateTime(admin.date_registered))}</td>
            <td>${statusBadge(!!admin.is_active)}</td>
          </tr>
        `).join('');
      })
      .catch(err => console.error('Error fetching recent barangay admins:', err));
  }

  function startRefreshInterval() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(refreshDashboardData, 1000);
  }

  refreshDashboardData();
  startRefreshInterval();

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    } else {
      refreshDashboardData();
      startRefreshInterval();
    }
  });
});
