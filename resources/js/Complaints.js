document.addEventListener('DOMContentLoaded', function () {

  const complaints = [
    {
      ticket_id: "#001",
      type: "Peace & Order",
      subtype: "Noise / Disturbance",
      location: "Purok 3, Brgy. San Jose",
      notes: "Loud music at 10PM",
      media: "photo1.jpg",
      name: "Juan Dela Cruz",
      contact: "09171234567",
      status: "Pending",
      date_filed: "02/19/2026"
    },
    {
      ticket_id: "#002",
      type: "Infrastructure",
      subtype: "Road Damage",
      location: "Main Street, Purok 1",
      notes: "Large pothole near school",
      media: "photo2.jpg",
      name: "Maria Santos",
      contact: "09281234567",
      status: "Approved",
      date_filed: "02/18/2026"
    },
    {
      ticket_id: "#003",
      type: "Health & Sanitation",
      subtype: "Illegal Dumping",
      location: "Purok 5 Alley",
      notes: "Garbage piling near homes",
      media: null,
      name: "Pedro Reyes",
      contact: "09351234567",
      status: "In Progress",
      date_filed: "02/17/2026"
    },
    {
      ticket_id: "#004",
      type: "Social Services",
      subtype: "Financial Aid Request",
      location: "Purok 2",
      notes: "Indigent family needs help",
      media: null,
      name: "Ana Lim",
      contact: "09461234567",
      status: "Approved",
      date_filed: "02/16/2026"
    },
    {
      ticket_id: "#005",
      type: "Peace & Order",
      subtype: "Illegal Parking",
      location: "Brgy. Hall Area",
      notes: "Blocking emergency lane",
      media: null,
      name: "Carlo Bautista",
      contact: "09571234567",
      status: "Rejected",
      date_filed: "02/15/2026" 
    }
  ];

  function badgeClass(status) {
    const map = {
      'Pending': 'badge-pending',
      'Approved': 'badge-approved',
      'Rejected': 'badge-rejected',
      'In Progress': 'badge-progress'
    };
    return map[status] || '';
  }

  // ===== Render Table =====
  window.renderReportsTable = function () {
    const statusFilter = document.getElementById('filter-status')?.value || '';
    const typeFilter = document.getElementById('filter-type')?.value || '';
    const tbody = document.getElementById('reports-tbody');
    if (!tbody) return;

    const filtered = complaints.filter(c => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (typeFilter && c.type !== typeFilter) return false;
      return true;
    });

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-state">No complaints found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(c => `
      <tr onclick="openModal('${c.ticket_id}')" style="cursor:pointer;">
        <td><strong>${c.ticket_id}</strong></td>
        <td>${c.type}</td>
        <td>${c.subtype}</td>
        <td>${c.location}</td>
        <td class="notes-cell" title="${c.notes}">${c.notes}</td>
        <td><span class="media-link"> View</span></td>
        <td>${c.name}</td>
        <td>${c.contact}</td>
        <td><span class="badge ${badgeClass(c.status)}">${c.status}</span></td>
      </tr>
    `).join('');
  };

  // ===== Open Modal =====
  window.openModal = function (ticket_id) {
    const c = complaints.find(x => x.ticket_id === ticket_id);
    if (!c) return;

    document.getElementById('modal-ticket').textContent = c.ticket_id;
    document.getElementById('modal-badge').textContent = c.status;
    document.getElementById('modal-badge').className = `badge ${badgeClass(c.status)}`;
    document.getElementById('md-type').textContent = c.type;
    document.getElementById('md-subtype').textContent = c.subtype;
    document.getElementById('md-location').textContent = c.location;
    document.getElementById('md-notes').textContent = c.notes;
    document.getElementById('md-contact').textContent = c.contact;
    document.getElementById('md-name').textContent = c.name;
    document.getElementById('md-date').textContent = c.date_filed;

    // Store current complaint ticket_id for download
    document.getElementById('modal-overlay').dataset.currentTicket = ticket_id;

    document.getElementById('modal-overlay').classList.add('open');
  };

  // ===== Download Complaint =====
  window.downloadComplaint = function () {
    const ticket_id = document.getElementById('modal-overlay').dataset.currentTicket;
    const c = complaints.find(x => x.ticket_id === ticket_id);
    if (!c) return;

    const line = '='.repeat(42);
    const divider = '-'.repeat(42);

    const content = [
      line,
      '       BARANGAY COMPLAINT REPORT',
      line,
      '',
      `  Ticket ID     : ${c.ticket_id}`,
      `  Date Filed    : ${c.date_filed}`,
      `  Status        : ${c.status}`,
      '',
      divider,
      '  COMPLAINT DETAILS',
      divider,
      `  Complaint Type    : ${c.type}`,
      `  Complaint Subtype : ${c.subtype}`,
      `  Location          : ${c.location}`,
      `  Additional Notes  : ${c.notes}`,
      '',
      divider,
      '  COMPLAINANT INFORMATION',
      divider,
      `  Name              : ${c.name}`,
      `  Contact No.       : ${c.contact}`,
      '',
      line,
      `  Generated on: ${new Date().toLocaleString('en-PH')}`,
      line,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Complaint_${c.ticket_id.replace('#', '')}_${c.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ===== Close Modal =====
  window.closeModalDirect = function () {
    document.getElementById('modal-overlay').classList.remove('open');
  };

  window.closeModal = function (e) {
    if (e.target === document.getElementById('modal-overlay')) closeModalDirect();
  };

  renderReportsTable();
});