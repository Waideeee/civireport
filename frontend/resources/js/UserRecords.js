document.addEventListener('DOMContentLoaded', function () {

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
      <tr data-id="${u.id}">
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.contact}</td>
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
        const defaultPic = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1E3A8A&color=fff&size=128`;
        const profilePic = user.profile_photo_path ? (user.profile_photo_path.startsWith('http') ? user.profile_photo_path : `/storage/${user.profile_photo_path}`) : defaultPic;
        document.getElementById('approve-user-photo').src = profilePic;
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
        
        const defaultPic = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1E3A8A&color=fff&size=128`;
        const profilePic = user.profile_photo_path ? (user.profile_photo_path.startsWith('http') ? user.profile_photo_path : `/storage/${user.profile_photo_path}`) : defaultPic;
        document.getElementById('reject-user-photo').src = profilePic;
        
        window.currentRejectUserId = id;
        document.getElementById('reject-user-name').textContent = user.name;
        document.getElementById('reject-reason').value = '';
        document.getElementById('reject-reason-error').style.display = 'none';
        document.getElementById('reject-modal-overlay').classList.add('active');
      });
    });
  }

  window.closeRejectModal = function() {
    document.getElementById('reject-modal-overlay').classList.remove('active');
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

    const btn = document.getElementById('reject-confirm-btn');
    btn.disabled = true;

    fetch(`/UserRecords/users/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ status: 'rejected', rejection_reason: reason })
    })
    .then(res => res.json())
    .then(() => {
      if (listType === 'pending') {
        pendingList = pendingList.filter(u => u.id !== id);
        renderApprovals();
      } else {
        user.status = 'Rejected';
        user.rejection_reason = reason;
        renderResidents();
      }
      closeRejectModal();
      showToast(`✗ ${user.name}'s account rejected.`, 'danger');
    })
    .finally(() => {
      btn.disabled = false;
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
        <td><strong>${r.name}</strong></td>
        <td>${r.email}</td>
        <td>${r.contact}</td>
        <td>${r.date_registered}</td>
        <td><span class="badge ${r.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${r.status}</span></td>
        <td><button class="btn btn-ghost" style="color:#2563eb; font-weight:600; font-size:0.75rem;" onclick="openResidentModal(${r.id})">View Info</button></td>
      </tr>
    `).join('');
  }
  
  // ===== Resident Detail Modal =====
  window.openResidentModal = function(id) {
    const user = residentsList.find(r => r.id === id);
    if(!user) return;
    
    window.currentResident = user;
    
    const defaultPic = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1E3A8A&color=fff&size=128`;
    const profilePic = user.profile_photo_path ? (user.profile_photo_path.startsWith('http') ? user.profile_photo_path : `/storage/${user.profile_photo_path}`) : defaultPic;
    document.getElementById('res-user-photo').src = profilePic;
    
    document.getElementById('res-name').textContent = user.name;
    document.getElementById('res-email').textContent = user.email;
    document.getElementById('res-contact').textContent = user.contact;
    document.getElementById('res-gender').textContent = user.gender;
    document.getElementById('res-registered').textContent = user.date_registered;
    document.getElementById('res-address').textContent = user.address;
    
    const statusEl = document.getElementById('res-status');
    statusEl.textContent = user.status;
    statusEl.className = user.status === 'Active' ? 'badge-active' : (user.status === 'Rejected' ? 'badge-inactive' : 'badge-inactive');

    const rejectContainer = document.getElementById('res-reject-container');
    const rejectReasonEl = document.getElementById('res-reject-reason');
    if (user.status === 'Rejected' && user.rejection_reason) {
        rejectContainer.style.display = 'block';
        rejectReasonEl.textContent = user.rejection_reason;
    } else {
        rejectContainer.style.display = 'none';
        rejectReasonEl.textContent = '';
    }
    
    const btnApprove = document.getElementById('res-btn-approve');
    const btnReject = document.getElementById('res-btn-reject');
    
    if (user.status === 'Rejected') {
        btnApprove.style.display = 'block';
        btnReject.style.display = 'none';
    } else {
        btnApprove.style.display = 'none';
        btnReject.style.display = 'block';
    }
    
    document.getElementById('resident-modal-overlay').classList.add('active');
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

    fetch(`/UserRecords/users/${user.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ status: 'approved' })
    })
    .then(res => res.json())
    .then(() => {
      user.status = 'Active';
      user.rejection_reason = null;
      renderResidents();
      closeResidentModal();
      showToast(`✓ ${user.name}'s account approved.`, 'success');
    });
  };

  window.showResidentRejectModal = function() {
    const user = window.currentResident;
    if (!user) return;
    
    window.currentRejectUserId = user.id;
    document.getElementById('reject-user-name').textContent = user.name;
    document.getElementById('reject-reason').value = '';
    document.getElementById('reject-reason-error').style.display = 'none';
    
    closeResidentModal();
    document.getElementById('reject-modal-overlay').classList.add('active');
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