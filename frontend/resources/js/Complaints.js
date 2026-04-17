document.addEventListener('DOMContentLoaded', function () {

  const AI_RECOMMENDATIONS = {};
  const DEFAULT_RECOMMENDATION = { urgency: 'Medium', summary: '', steps: [], action: '' };

  function getAIRecommendation(subtype) {
    return AI_RECOMMENDATIONS[subtype] || DEFAULT_RECOMMENDATION;
  }

  function urgencyBadgeClass(level) {
    return { 'Critical': 'urgency-critical', 'High': 'urgency-high', 'Medium': 'urgency-medium', 'Low': 'urgency-low' }[level] || 'urgency-medium';
  }

  function badgeClass(status) {
    const map = { 'Pending': 'badge-pending', 'Approved': 'badge-approved', 'Rejected': 'badge-rejected', 'In Progress': 'badge-progress' };
    return map[status] || '';
  }

  let complaints   = [];
  let filteredData = [];
  const ROWS_PER_PAGE = 8;
  let currentPage    = 1;
  let currentSearch  = "";
  let currentStatus  = "";
  let currentType    = "";
  let currentUrgency = "";

  // ================= FETCH =================
  function reloadComplaints() {
    fetch('/api/complaints')
      .then(r => r.json())
      .then(data => {
        complaints = data.map(c => ({
          ticket_id: String(c.complaint_id).padStart(3, '0'),
          raw_id:    c.complaint_id,
          id:        c.complaint_id,
          type:      c.complaint_type     || '',
          subtype:   c.complaint_subtype  || '',
          location:  c.complaint_location || '',
          name:      c.user_name          || '',
          contact:   c.contact_num        || '',
          status:    c.complaint_status   || 'Pending',
          urgency:   c.urgency_level      || 'Medium',
          notes:     c.additional_notes   || '',
          date:      c.complaint_date     || '',
          created:   c.created_at         || '',
          media:     c.media              || [],
        }));
        filteredData = [...complaints];
        applyFilters();
      })
      .catch(() => {
        const tbody = document.getElementById('reports-tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="9" class="empty-state">Failed to load complaints.</td></tr>`;
      });
  }

  reloadComplaints();

  // ================= FILTER =================
  function applyFilters() {
    const q = currentSearch.toLowerCase();
    filteredData = complaints.filter(c => {
      return (
        (!q || 
        c.ticket_id.toLowerCase().includes(q) ||
        `#${c.ticket_id}`.toLowerCase().includes(q) ||
        String(c.raw_id).includes(q) ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.type && c.type.toLowerCase().includes(q)) ||
        (c.subtype && c.subtype.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q)) ||
        (c.date && c.date.toLowerCase().includes(q)) ||
        (c.status && c.status.toLowerCase().includes(q)) ||
        (c.urgency && c.urgency.toLowerCase().includes(q)) ||
        (c.contact && c.contact.includes(q))) &&
        (!currentStatus  || c.status  === currentStatus) &&
        (!currentType    || c.type    === currentType) &&
        (!currentUrgency || c.urgency === currentUrgency)
      );
    });
    currentPage = 1;
    renderTable();
  }

  // ================= TABLE =================
  function renderTable() {
    const tbody = document.getElementById('reports-tbody');
    if (!tbody) return;

    const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const pageData = filteredData.slice(start, start + ROWS_PER_PAGE);

    if (!pageData.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-state">No complaints found.</td></tr>`;
      return;
    }

    tbody.innerHTML = pageData.map(c => `
      <tr onclick="openModal(${c.raw_id})" style="cursor:pointer;">
        <td><strong>#${c.ticket_id}</strong></td>
        <td>${c.type}</td>
        <td>${c.subtype}</td>
        <td>${c.location}</td>
        <td>📎 <span class="media-link">View</span></td>
        <td>${c.name}</td>
        <td>${c.contact}</td>
        <td><span class="urgency-badge ${urgencyBadgeClass(c.urgency)}">${c.urgency}</span></td>
        <td><span class="badge ${badgeClass(c.status)}">${c.status}</span></td>
      </tr>
    `).join('');
  }

  // ================= MODAL =================
  window.openModal = function(id) {
    const c = complaints.find(x => x.raw_id === id);
    if (!c) return;

    window.currentComplaint = c;

    document.getElementById('modal-ticket').textContent  = `Complaint #${c.ticket_id}`;
    document.getElementById('modal-badge').textContent   = c.status;
    document.getElementById('modal-badge').className     = `badge ${badgeClass(c.status)}`;
    document.getElementById('md-type').textContent       = c.type;
    document.getElementById('md-subtype').textContent    = c.subtype;
    document.getElementById('md-location').textContent   = c.location;
    document.getElementById('md-contact').textContent    = c.contact;
    document.getElementById('md-date').textContent       = c.date;
    document.getElementById('md-updated').textContent    = c.created;
    document.getElementById('md-name').textContent       = c.name;
    document.getElementById('md-notes').textContent      = c.notes;
    document.getElementById('md-urgency').textContent    = c.urgency;
    document.getElementById('md-urgency').className      = `urgency-badge ${urgencyBadgeClass(c.urgency)}`;
    
    const mediaContainer = document.getElementById('md-media-link');
    if (c.media && c.media.length > 0) {
      mediaContainer.innerHTML = c.media.map(m => {
        // Build the URL depending on file_path. 
        // If the path already includes 'uploads/', we just append it, else we prepend it.
        let path = m.file_path;
        if (!path.startsWith('uploads/')) path = 'uploads/' + path;
        return `<a href="http://localhost:8000/${path}" target="_blank" style="display:block; margin-bottom:4px; color:#1d4ed8; text-decoration:underline;">📎 View ${m.media_type || 'Media'}</a>`;
      }).join('');
    } else {
      mediaContainer.innerHTML = '<span style="color:#6b7280; font-style:italic;">No media attached</span>';
    }

    document.getElementById('modal-overlay').classList.add('open');
  };

  window.closeModalDirect = function() {
    document.getElementById('modal-overlay').classList.remove('open');
  };

  // ================= APPROVE =================
  window.showComplaintApproveModal = function () {
    const c = window.currentComplaint;
    if (!c) return;
    document.getElementById('approve-complaint-id').textContent = `#${c.id}`;
    document.getElementById('complaint-approve-overlay').classList.add('active');
  };

  window.closeComplaintApproveModal = function () {
    document.getElementById('complaint-approve-overlay').classList.remove('active');
  };

  window.submitComplaintApprove = async function () {
    const c = window.currentComplaint;
    if (!c) return;

    const btn = document.getElementById('complaint-approve-btn');
    btn.disabled = true;

    try {
      const res = await fetch(`/Complaints/${c.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          'X-HTTP-Method-Override': 'PATCH',
        },
        body: JSON.stringify({ status: 'in progress' }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        closeComplaintApproveModal();
        closeModalDirect();
        showCrToast('Complaint approved.', 'success');
        reloadComplaints();
      }
    } finally {
      btn.disabled = false;
    }
  };

  // ================= REJECT =================
  window.showComplaintRejectModal = function () {
    document.getElementById('complaint-reject-overlay').classList.add('active');
  };

  window.closeComplaintRejectModal = function () {
    document.getElementById('complaint-reject-overlay').classList.remove('active');
  };

  window.submitComplaintReject = async function () {
    const reason = document.getElementById('complaint-reject-reason').value.trim();
    if (!reason) return;

    const c = window.currentComplaint;

    await fetch(`/Complaints/${c.id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        'X-HTTP-Method-Override': 'PATCH',
      },
      body: JSON.stringify({ status: 'rejected', rejection_reason: reason }),
    });

    closeComplaintRejectModal();
    closeModalDirect();
    showCrToast('Complaint rejected.', 'info');
    reloadComplaints();
  };

  // ================= DOWNLOAD =================
  // ================= DOWNLOAD (PDF) =================
window.downloadComplaint = function () {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const c = window.currentComplaint;
  if (!c) return;

  // --- Header Background ---
  doc.setFillColor(30, 58, 138); // Dark blue brand color
  doc.rect(0, 0, 210, 30, 'F'); 

  // --- Header Title ---
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("CiviReport", 15, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Official Complaint Record", 145, 20);

  let y = 45;

  // --- Helper to draw section headers ---
  const drawSection = (title) => {
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(title.toUpperCase(), 15, y);
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y + 3, 195, y + 3);
    y += 12;
  };

  // --- Helper to draw key-value rows ---
  const printRow = (label, value, yPos, isRightCol = false) => {
    const x = isRightCol ? 110 : 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(label, x, yPos);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    doc.text(String(value || 'N/A'), x + 28, yPos);
  };

  // --- Section 1: Ticket Details ---
  drawSection("Ticket Details");
  
  printRow("Ticket ID:", `#${(c.ticket_id || c.id)}`, y);
  printRow("Date Filed:", c.date, y, true);
  y += 10;
  
  printRow("Status:", c.status, y);
  printRow("Urgency:", c.urgency, y, true);
  y += 10;
  
  printRow("Type:", c.type, y);
  printRow("Category:", c.subtype, y, true);
  y += 10;

  printRow("Location:", c.location, y);
  y += 20;

  // --- Section 2: Complainant Details ---
  drawSection("Complainant Information");

  printRow("Name:", c.name, y);
  printRow("Contact:", c.contact, y, true);
  y += 20;

  // --- Section 3: Notes ---
  drawSection("Additional Notes");

  // Notes Box Background
  doc.setFillColor(249, 250, 251); // Very light gray 
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.rect(15, y, 180, 50, 'FD'); 
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  
  // Wrap text to fit inside the box
  const splitNotes = doc.splitTextToSize(c.notes || "No additional notes provided by the resident.", 170);
  doc.text(splitNotes, 20, y + 8);
  
  // --- Footer ---
  const now = new Date();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Document generated securely by CiviReport Admin System on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 15, 285);

  // Trigger browser download
  doc.save(`Complaint_${c.ticket_id || c.id}.pdf`);
};

  // ================= TOAST =================
  function showCrToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style = "position:fixed;bottom:20px;right:20px;background:#333;color:#fff;padding:10px;border-radius:6px;";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

});