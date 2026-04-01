document.addEventListener('DOMContentLoaded', function () {

  // ===== State =====
  let pendingList      = [];
  let residentsList    = [];
  let approvalSearch   = '';
  let residentsSearch  = '';

  // ===== Toast =====
  function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed; bottom: 28px; right: 28px;
        display: flex; flex-direction: column; gap: 10px;
        z-index: 9999; pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const bg = type === 'success' ? '#22c55e' : '#ef4444';
    toast.style.cssText = `
      background: ${bg}; color: #fff;
      padding: 12px 20px; border-radius: 10px;
      font-size: 0.84rem; font-weight: 600;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      opacity: 0; transform: translateY(10px);
      transition: opacity 0.25s ease, transform 0.25s ease;
      pointer-events: none;
    `;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ===== Confirm Dialog =====
  function showConfirm(message, onConfirm) {
    let overlay = document.getElementById('confirm-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'confirm-overlay';
      overlay.style.cssText = `
        display:none; position:fixed; inset:0;
        background:rgba(0,0,0,0.45); z-index:200;
        align-items:center; justify-content:center;
      `;
      overlay.innerHTML = `
        <div style="background:#fff; border-radius:14px; padding:28px 28px 20px; width:360px;
                    max-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,0.2);">
          <div id="confirm-msg" style="font-size:0.95rem; font-weight:600; color:#111827; margin-bottom:18px;"></div>
          <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button id="confirm-cancel" style="padding:8px 18px; border-radius:8px; border:none;
              background:#f3f4f6; color:#374151; font-weight:600; font-size:0.82rem; cursor:pointer;">Cancel</button>
            <button id="confirm-ok" style="padding:8px 18px; border-radius:8px; border:none;
              background:#3b82f6; color:#fff; font-weight:600; font-size:0.82rem; cursor:pointer;">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      document.getElementById('confirm-cancel').addEventListener('click', () => {
        overlay.style.display = 'none';
      });
    }
    document.getElementById('confirm-msg').textContent = message;
    overlay.style.display = 'flex';
    const okBtn = document.getElementById('confirm-ok');
    const newOk = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOk, okBtn);
    newOk.addEventListener('click', () => {
      overlay.style.display = 'none';
      onConfirm();
    });
  }

  // ===== Render Pending Approvals =====
  function renderApprovals() {
    const tbody    = document.getElementById('approval-tbody');
    const countEl  = document.getElementById('approval-count');
    if (!tbody) return;

    const q = approvalSearch.toLowerCase();
    const filtered = pendingList.filter(u =>
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );

    if (countEl) countEl.textContent = `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No pending approvals found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(u => `
      <tr data-id="${u.id}">
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.contact}</td>
        <td>${u.gender}</td>
        <td>${u.date_registered}</td>
        <td class="actions-cell">
          <button class="btn btn-success btn-approve" data-id="${u.id}">Approve</button>
          <button class="btn btn-danger btn-reject" data-id="${u.id}">Reject</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', function () {
        const id   = parseInt(this.dataset.id);
        const user = pendingList.find(u => u.id === id);
        if (!user) return;
        showConfirm(`Approve account of ${user.name}?`, () => {
          fetch(`/UserRecords/users/${id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
            },
            body: JSON.stringify({ status: 'approved' })
          })
          .then(res => res.json())
          .then(() => {
            pendingList = pendingList.filter(u => u.id !== id);
            const today = new Date().toLocaleDateString('en-PH', { month: '2-digit', day: '2-digit', year: 'numeric' });
            residentsList.unshift({
              id: user.id, name: user.name, email: user.email,
              contact: user.contact, gender: user.gender,
              address: user.address ?? '—',
              date_registered: user.date_registered,
              date_approved: today,
              status: 'Active'
            });
            renderApprovals();
            renderResidents();
            showToast(`✓ ${user.name}'s account approved.`, 'success');
          });
        });
      });
    });

    tbody.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', function () {
        const id   = parseInt(this.dataset.id);
        const user = pendingList.find(u => u.id === id);
        if (!user) return;
        showConfirm(`Reject account of ${user.name}? This cannot be undone.`, () => {
          fetch(`/admin/users/${id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
            },
            body: JSON.stringify({ status: 'rejected' })
          })
          .then(res => res.json())
          .then(() => {
            pendingList = pendingList.filter(u => u.id !== id);
            renderApprovals();
            showToast(`✗ ${user.name}'s account rejected.`, 'danger');
          });
        });
      });
    });
  }

  // ===== Render Registered Residents =====
  function renderResidents() {
    const tbody   = document.getElementById('residents-tbody');
    const countEl = document.getElementById('residents-count');
    if (!tbody) return;

    const q = residentsSearch.toLowerCase();
    const filtered = residentsList.filter(r =>
      !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );

    if (countEl) countEl.textContent = `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No residents found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => `
      <tr data-id="${r.id}">
        <td><strong>${r.name}</strong></td>
        <td>${r.email}</td>
        <td>${r.contact}</td>
        <td>${r.gender}</td>
        <td>${r.address}</td>
        <td>${r.date_registered}</td>
        <td>${r.date_approved}</td>
        <td><span class="badge ${r.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${r.status}</span></td>
      </tr>
    `).join('');
  }

  // ===== Bind Search Events =====
  document.getElementById('approval-search')?.addEventListener('input', function () {
    approvalSearch = this.value;
    renderApprovals();
  });

  document.getElementById('residents-search')?.addEventListener('input', function () {
    residentsSearch = this.value;
    renderResidents();
  });

  // ===== Init =====
  if (window.pendingUsers) {
    pendingList = window.pendingUsers.map(u => ({
      id: u.user_id,
      name: u.user_name,
      email: u.email,
      contact: u.contact_num,
      gender: u.gender,
      address: u.address,
      date_registered: u.date_registered,
    }));
  }

  if (window.approvedUsers) {
    residentsList = window.approvedUsers.map(u => ({
      id: u.user_id,
      name: u.user_name,
      email: u.email,
      contact: u.contact_num,
      gender: u.gender,
      address: u.address,
      date_registered: u.date_registered,
      date_approved: u.approved_at,
      status: u.is_active ? 'Active' : 'Inactive',
    }));
  }

  renderApprovals();
  renderResidents();
});