document.addEventListener('DOMContentLoaded', function () {

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getProfilePhoto(user) {
    const photoPath = user.profile_photo_url || user.profile_photo_path;
    const defaultPic = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=1E3A8A&color=fff&size=128`;

    if (!photoPath) return defaultPic;
    if (String(photoPath).startsWith('http')) return photoPath;

    return `/storage/${String(photoPath).replace(/^\/+/, '')}`;
  }

  function setButtonLoading(buttonId, textId, spinnerId, isLoading) {
    const button = document.getElementById(buttonId);
    const text = document.getElementById(textId);
    const spinner = document.getElementById(spinnerId);
    if (!button || !text || !spinner) return;

    button.disabled = isLoading;
    text.style.display = isLoading ? 'none' : 'inline';
    spinner.style.display = isLoading ? 'inline' : 'none';
  }

  function createResidentEntry(user, overrides = {}) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      contact: user.contact,
      gender: user.gender,
      address: user.address ?? '—',
      date_registered: user.date_registered,
      date_approved: overrides.date_approved ?? user.date_approved ?? formatDT(new Date().toISOString()),
      status: overrides.status ?? user.status,
      rejection_reason: overrides.rejection_reason ?? user.rejection_reason ?? null,
      profile_photo_path: user.profile_photo_path ?? null,
      profile_photo_url: user.profile_photo_url ?? null,
    };
  }

  function upsertResident(user) {
    const index = residentsList.findIndex(r => r.id === user.id);

    if (index >= 0) {
      residentsList[index] = {
        ...residentsList[index],
        ...user,
      };
      return;
    }

    residentsList.unshift(user);
  }

  function reopenUserModalIfNeeded() {
    const context = window.returnModalContext;
    window.returnModalContext = null;

    if (!context) return;

    openAccountModal(context.userId, context.source);
  }

  function openApproveConfirmation(user, options = {}) {
    if (!user) return;

    window.currentApproveUserId = user.id;
    window.returnModalContext = options.returnToModal ? { userId: user.id, source: options.source } : null;

    document.getElementById('approve-user-name').textContent = user.name;
    document.getElementById('approve-user-photo').src = getProfilePhoto(user);
    setButtonLoading('approve-confirm-btn', 'approve-btn-text', 'approve-btn-spinner', false);
    document.getElementById('approve-modal-overlay').classList.add('active');
  }

  function openRejectConfirmation(user, options = {}) {
    if (!user) return;

    window.currentRejectUserId = user.id;
    window.returnModalContext = options.returnToModal ? { userId: user.id, source: options.source } : null;

    document.getElementById('reject-user-name').textContent = user.name;
    document.getElementById('reject-user-photo').src = getProfilePhoto(user);
    document.getElementById('reject-reason').value = '';
    document.getElementById('reject-reason-error').style.display = 'none';
    setButtonLoading('reject-confirm-btn', 'reject-btn-text', 'reject-btn-spinner', false);
    document.getElementById('reject-modal-overlay').classList.add('active');
  }

  // ===== State =====
  let pendingList      = [];
  let residentsList    = [];
  let approvalSearch   = '';
  let residentsSearch  = '';
  let residentsFilterStatus = '';

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

  // ===== Render Pending Approvals =====
  function renderApprovals() {
    const tbody    = document.getElementById('approval-tbody');
    const countEl  = document.getElementById('approval-count');
    if (!tbody) return;

    const q = approvalSearch.toLowerCase();
    const filtered = pendingList.filter(u =>
      !q || 
      String(u.id).includes(q) ||
      (u.name && u.name.toLowerCase().includes(q)) || 
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.contact && u.contact.toLowerCase().includes(q)) ||
      (u.date_registered && u.date_registered.toLowerCase().includes(q))
    );

    if (countEl) countEl.textContent = `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No pending approvals found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(u => `
      <tr data-id="${u.id}" class="approval-row">
        <td><strong>${escapeHtml(u.name)}</strong></td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.contact)}</td>
        <td>${escapeHtml(u.date_registered)}</td>
        <td class="actions-cell">
          <button class="btn btn-success btn-row-approve" data-id="${u.id}">Approve</button>
          <button class="btn btn-danger btn-row-reject" data-id="${u.id}">Reject</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.approval-row').forEach(row => {
      row.addEventListener('click', function () {
        openAccountModal(parseInt(this.dataset.id, 10), 'pending');
      });
    });

    tbody.querySelectorAll('.btn-row-approve').forEach(btn => {
      btn.addEventListener('click', function (event) {
        event.stopPropagation();
        const user = pendingList.find(u => u.id === parseInt(this.dataset.id, 10));
        if (!user) return;
        openApproveConfirmation(user);
      });
    });

    tbody.querySelectorAll('.btn-row-reject').forEach(btn => {
      btn.addEventListener('click', function (event) {
        event.stopPropagation();
        const user = pendingList.find(u => u.id === parseInt(this.dataset.id, 10));
        if (!user) return;
        openRejectConfirmation(user);
      });
    });
  }

  window.closeApproveModal = function() {
    document.getElementById('approve-modal-overlay').classList.remove('active');
    reopenUserModalIfNeeded();
  };

  window.closeRejectModal = function(reopen = true) {
    document.getElementById('reject-modal-overlay').classList.remove('active');
    if (reopen) {
      reopenUserModalIfNeeded();
      return;
    }

    window.returnModalContext = null;
  };

  window.submitApproval = function() {
    const id = window.currentApproveUserId;
    let user = pendingList.find(u => u.id === id);
    let source = 'pending';

    if (!user) {
      user = residentsList.find(u => u.id === id);
      source = 'resident';
    }

    if (!user) return;

    setButtonLoading('approve-confirm-btn', 'approve-btn-text', 'approve-btn-spinner', true);

    fetch(`/UserRecords/users/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ status: 'approved' })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to approve user.');
      }

      if (source === 'pending') {
        pendingList = pendingList.filter(u => u.id !== id);
      }

      const updatedUser = createResidentEntry(user, {
        status: 'Active',
        rejection_reason: null,
      });

      upsertResident(updatedUser);
      renderApprovals();
      renderResidents();
      window.returnModalContext = null;
      document.getElementById('approve-modal-overlay').classList.remove('active');
      showToast(`✓ ${user.name}'s account approved.`, 'success');
    })
    .catch(error => {
      showToast(error.message || 'Failed to approve user.', 'danger');
    })
    .finally(() => {
      setButtonLoading('approve-confirm-btn', 'approve-btn-text', 'approve-btn-spinner', false);
      window.returnModalContext = null;
    });
  };

  window.submitRejection = function() {
    const reason = document.getElementById('reject-reason').value.trim();
    if (!reason) {
      document.getElementById('reject-reason-error').style.display = 'block';
      return;
    }
    
    document.getElementById('reject-reason-error').style.display = 'none';
    const id = window.currentRejectUserId;
    let listType = 'pending';
    let user = pendingList.find(u => u.id === id);
    
    if (!user) {
      user = residentsList.find(u => u.id === id);
      listType = 'resident';
    }
    
    if (!user) return;

    setButtonLoading('reject-confirm-btn', 'reject-btn-text', 'reject-btn-spinner', true);

    fetch(`/UserRecords/users/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ status: 'rejected', rejection_reason: reason })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to reject user.');
      }

      if (listType === 'pending') {
        pendingList = pendingList.filter(u => u.id !== id);
      }

      upsertResident(createResidentEntry(user, {
        status: 'Rejected',
        rejection_reason: reason,
      }));

      renderApprovals();
      renderResidents();
      closeRejectModal(false);
      showToast(`✗ ${user.name}'s account rejected.`, 'danger');
    })
    .catch(error => {
      showToast(error.message || 'Failed to reject user.', 'danger');
    })
    .finally(() => {
      setButtonLoading('reject-confirm-btn', 'reject-btn-text', 'reject-btn-spinner', false);
      window.returnModalContext = null;
    });
  };

  // ===== Render Registered Residents =====
  function renderResidents() {
    const tbody   = document.getElementById('residents-tbody');
    const countEl = document.getElementById('residents-count');
    if (!tbody) return;

    const q = residentsSearch.toLowerCase();
    const filtered = residentsList.filter(r =>
      !q || 
      String(r.id).includes(q) ||
      (r.name && r.name.toLowerCase().includes(q)) || 
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.contact && r.contact.toLowerCase().includes(q)) ||
      (r.date_registered && r.date_registered.toLowerCase().includes(q)) ||
      (r.status && r.status.toLowerCase().includes(q)) ||
      (r.gender && r.gender.toLowerCase().includes(q))
    ).filter(r => {
      if (!residentsFilterStatus) return true;
      return r.status.toLowerCase() === residentsFilterStatus.toLowerCase();
    });

    if (countEl) countEl.textContent = `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No residents found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => `
      <tr data-id="${r.id}">
        <td><strong>${escapeHtml(r.name)}</strong></td>
        <td>${escapeHtml(r.email)}</td>
        <td>${escapeHtml(r.contact)}</td>
        <td>${escapeHtml(r.date_registered)}</td>
        <td><span class="badge ${r.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${escapeHtml(r.status)}</span></td>
        <td class="actions-cell">
          ${r.status === 'Rejected'
            ? `<button class="btn btn-success btn-resident-approve" data-id="${r.id}">Approve</button>`
            : `<button class="btn btn-danger btn-resident-reject" data-id="${r.id}">Reject</button>`}
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('tr[data-id]').forEach(row => {
      row.addEventListener('click', function () {
        openResidentModal(parseInt(this.dataset.id, 10));
      });
    });

    tbody.querySelectorAll('.btn-resident-approve').forEach(btn => {
      btn.addEventListener('click', function (event) {
        event.stopPropagation();
        const user = residentsList.find(r => r.id === parseInt(this.dataset.id, 10));
        if (!user) return;
        openApproveConfirmation(user);
      });
    });

    tbody.querySelectorAll('.btn-resident-reject').forEach(btn => {
      btn.addEventListener('click', function (event) {
        event.stopPropagation();
        const user = residentsList.find(r => r.id === parseInt(this.dataset.id, 10));
        if (!user) return;
        openRejectConfirmation(user);
      });
    });
  }
  
  // ===== Resident Detail Modal =====
  function openAccountModal(id, source = 'resident') {
    const list = source === 'pending' ? pendingList : residentsList;
    const user = list.find(r => r.id === id);
    if (!user) return;

    window.currentResident = user;
    window.currentResidentSource = source;

    document.getElementById('res-user-photo').src = getProfilePhoto(user);
    document.getElementById('res-name').textContent = user.name;
    document.getElementById('res-email').textContent = user.email;
    document.getElementById('res-contact').textContent = user.contact || '—';
    document.getElementById('res-gender').textContent = user.gender || '—';
    document.getElementById('res-registered').textContent = user.date_registered;
    document.getElementById('res-address').textContent = user.address || '—';

    const titleEl = document.getElementById('account-modal-title');
    const subtitleEl = document.getElementById('account-modal-subtitle');
    const statusEl = document.getElementById('res-status');
    const normalizedStatus = source === 'pending' ? 'Pending' : user.status;
    statusEl.textContent = normalizedStatus;
    statusEl.className = normalizedStatus === 'Active'
      ? 'badge-active'
      : normalizedStatus === 'Pending'
        ? 'badge-pending'
        : 'badge-inactive';

    titleEl.textContent = source === 'pending' ? 'Pending Account Details' : 'Resident Details';
    subtitleEl.textContent = source === 'pending'
      ? 'Review the pending resident information before taking action'
      : 'Complete profile information';

    const rejectContainer = document.getElementById('res-reject-container');
    const rejectReasonEl = document.getElementById('res-reject-reason');
    if (normalizedStatus === 'Rejected' && user.rejection_reason) {
        rejectContainer.style.display = 'block';
        rejectReasonEl.textContent = user.rejection_reason;
    } else {
        rejectContainer.style.display = 'none';
        rejectReasonEl.textContent = '';
    }
    
    const btnApprove = document.getElementById('res-btn-approve');
    const btnReject = document.getElementById('res-btn-reject');

    if (source === 'pending') {
        btnApprove.style.display = 'block';
        btnReject.style.display = 'block';
        btnApprove.textContent = 'Approve User';
        btnReject.textContent = 'Reject User';
    } else if (user.status === 'Rejected') {
        btnApprove.style.display = 'block';
        btnReject.style.display = 'none';
        btnApprove.textContent = 'Approve User';
    } else {
        btnApprove.style.display = 'none';
        btnReject.style.display = 'block';
        btnReject.textContent = 'Reject User';
    }

    document.getElementById('resident-modal-overlay').classList.add('active');
  }

  window.openResidentModal = function(id) {
    openAccountModal(id, 'resident');
  };

  window.openPendingResidentModal = function(id) {
    openAccountModal(id, 'pending');
  };
  
  window.closeResidentModal = function() {
    document.getElementById('resident-modal-overlay').classList.remove('active');
  };
  
  window.closeResidentModalDirect = function(e) {
    if (e.target.id === 'resident-modal-overlay') {
      closeResidentModal();
    }
  };

  window.submitResidentApprove = function() {
    const user = window.currentResident;
    if (!user) return;

    const source = window.currentResidentSource || 'resident';
    closeResidentModal();
    openApproveConfirmation(user, { returnToModal: true, source });
  };

  window.showResidentRejectModal = function() {
    const user = window.currentResident;
    if (!user) return;

    const source = window.currentResidentSource || 'resident';
    closeResidentModal();
    openRejectConfirmation(user, { returnToModal: true, source });
  };

  // ===== Bind Search Events =====
  document.getElementById('approval-search')?.addEventListener('input', function () {
    approvalSearch = this.value;
    renderApprovals();
  });

  document.getElementById('residents-search')?.addEventListener('input', function () {
    residentsSearch = this.value;
    renderResidents();
  });

  document.getElementById('residents-filter-status')?.addEventListener('change', function () {
    residentsFilterStatus = this.value;
    renderResidents();
  });

  // ===== Init =====
  // Fallback: ensure window data is always defined
  // (actual values are set via @json in the blade <script> block)
  if (typeof window.pendingUsers  === 'undefined') window.pendingUsers  = [];
  if (typeof window.approvedUsers === 'undefined') window.approvedUsers = [];

  // Helper to format ISO datetimes from backend cleanly
  function formatDT(str) {
    if (!str) return '—';
    return str.split('.')[0].replace('T', ' ');
  }

  if (window.pendingUsers) {
    pendingList = window.pendingUsers.map(u => ({
      id: u.user_id,
      name: u.user_name,
      email: u.email,
      contact: u.contact_num,
      gender: u.gender,
      address: u.address,
      date_registered: formatDT(u.date_registered),
      status: 'Pending',
      profile_photo_path: u.profile_photo_path,
      profile_photo_url: u.profile_photo_url,
      rejection_reason: u.rejection_reason,
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
      date_registered: formatDT(u.date_registered),
      date_approved: formatDT(u.approved_at),
      status: u.status === 'rejected' ? 'Rejected' : (u.is_active ? 'Active' : 'Inactive'),
      rejection_reason: u.rejection_reason,
      profile_photo_path: u.profile_photo_path,
      profile_photo_url: u.profile_photo_url,
    }));
  }

  renderApprovals();
  renderResidents();

  // ===== Download Residents PDF =====
  window.downloadResidentsPDF = function() {
    if (!residentsList || residentsList.length === 0) {
        showToast('No residents available to download.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    // Use landscape mode for the table to fit better
    const doc = new jsPDF('landscape');

    // --- Header Background ---
    doc.setFillColor(30, 58, 138); 
    doc.rect(0, 0, 297, 30, 'F'); 

    // --- Header Title ---
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.text("CiviReport", 15, 20);

    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text("Registered Residents Report", 225, 20);

    // --- Table Content ---
    const tableHeaders = [["Name", "Email", "Contact", "Gender", "Date Registered", "Date Approved", "Status"]];
    const tableData = residentsList.map(r => [
        r.name,
        r.email,
        r.contact || 'N/A',
        r.gender || 'N/A',
        r.date_registered || 'N/A',
        r.date_approved || 'N/A',
        r.status || 'N/A'
    ]);

    doc.autoTable({
        head: tableHeaders,
        body: tableData,
        startY: 38,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] },
        styles: { fontSize: 9 },
        margin: { top: 38, left: 15, right: 15 },
        didDrawPage: function (data) {
            // Footer
            const now = new Date();
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Document generated securely by CiviReport Admin System on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 15, 200);
        }
    });

    doc.save(`Registered_Residents_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // ===== Download Single Resident PDF =====
  window.downloadSingleResidentPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const r = window.currentResident;
    if (!r) return;

    // --- Header Background ---
    doc.setFillColor(30, 58, 138); 
    doc.rect(0, 0, 210, 30, 'F'); 

    // --- Header Title ---
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.text("CiviReport", 15, 20);

    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text("Official Resident Profile", 145, 20);

    let y = 45;

    // --- Helper ---
    const printRow = (label, value) => {
      doc.setFont("times", "bold");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(label, 15, y);
      
      doc.setFont("times", "normal");
      doc.setTextColor(20, 20, 20);
      // Ensure long text (like addresses) break correctly
      const lines = doc.splitTextToSize(String(value || 'N/A'), 120);
      doc.text(lines, 60, y);
      
      y += (lines.length * 5) + 5;
    };

    doc.setTextColor(0, 0, 0);
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("RESIDENT INFORMATION", 15, y);
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y + 3, 195, y + 3);
    y += 12;

    printRow("Full Name:", r.name);
    printRow("Status:", r.status);
    printRow("Email:", r.email);
    printRow("Contact Number:", r.contact);
    printRow("Gender:", r.gender);
    printRow("Date Registered:", r.date_registered);
    if(r.date_approved) printRow("Date Approved:", r.date_approved);
    
    y += 5;
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("ADDRESS DETAILS", 15, y);
    doc.line(15, y + 3, 195, y + 3);
    y += 12;
    printRow("Full Address:", r.address);

    // --- Footer ---
    const now = new Date();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Document generated securely by CiviReport Admin System on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 15, 285);

    doc.save(`Resident_Profile_${r.name.replace(/\s+/g, '_')}.pdf`);
  };
});
