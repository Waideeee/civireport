let allEmergencies = [];
let currentPage = 1;
const rowsPerPage = 10;
let filteredEmergencies = [];
let currentEmergency = null;

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildStorageUrl(rawPath) {
    return String(rawPath || '')
        .replace(/\\/g, '/')
        .split('/')
        .filter(Boolean)
        .map(segment => encodeURIComponent(segment))
        .join('/');
}

document.addEventListener("DOMContentLoaded", () => {
    fetchEmergencies();

    document.getElementById("cr-search").addEventListener("input", filterEmergencies);
    document.getElementById("cr-filter-status").addEventListener("change", filterEmergencies);
    
    document.getElementById("cr-prev").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    document.getElementById("cr-next").addEventListener("click", () => {
        const maxPage = Math.ceil(filteredEmergencies.length / rowsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            renderTable();
        }
    });
});

async function fetchEmergencies() {
    try {
        const response = await fetch('/api/emergencies');
        const data = await response.json();
        allEmergencies = data;
        filterEmergencies();
    } catch (error) {
        console.error("Error fetching emergencies:", error);
    }
}

function filterEmergencies() {
    const search = document.getElementById("cr-search").value.toLowerCase();
    const status = document.getElementById("cr-filter-status").value.toLowerCase();

    filteredEmergencies = allEmergencies.filter(e => {
        const matchesSearch = e.user_name.toLowerCase().includes(search) ||
                              (e.address || "").toLowerCase().includes(search);
        
        const matchesStatus = status ? e.status.toLowerCase() === status : true;

        return matchesSearch && matchesStatus;
    });

    currentPage = 1;
    document.getElementById("cr-count").innerText = `${filteredEmergencies.length} records`;
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById("emergency-tbody");
    tbody.innerHTML = "";

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginated = filteredEmergencies.slice(startIndex, endIndex);

    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No emergency reports found.</td></tr>`;
    } else {
        paginated.forEach(e => {
            const tr = document.createElement("tr");
            tr.onclick = () => openModal(e);
            
            const badgeClass = `badge-${e.status === 'pending' ? 'pending' : (e.status === 'resolved' ? 'approved' : (e.status === 'false_alarm' ? 'rejected' : 'progress'))}`;
            
            tr.innerHTML = `
                <td>#${e.emergency_id}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        ${e.profile_photo_path ? `<img src="/storage/${buildStorageUrl(e.profile_photo_path)}" style="width:24px; height:24px; border-radius:50%; object-fit:cover;">` : `<div style="width:24px; height:24px; border-radius:50%; background:#dbeafe; color:#1e40af; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold;">${escapeHtml(e.user_name.substring(0,2).toUpperCase())}</div>`}
                        ${escapeHtml(e.user_name)}
                    </div>
                </td>
                <td><div class="notes-cell" title="${escapeHtml(e.address || '')}">${escapeHtml(e.address || '')}</div></td>
                <td>${escapeHtml(new Date(e.created_at).toLocaleString())}</td>
                <td><span class="badge ${badgeClass}">${escapeHtml(e.status.toUpperCase())}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    updatePagination();
}

function updatePagination() {
    const maxPage = Math.ceil(filteredEmergencies.length / rowsPerPage) || 1;
    document.getElementById("cr-page-info").innerText = `Page ${currentPage} of ${maxPage}`;
    document.getElementById("cr-prev").disabled = currentPage === 1;
    document.getElementById("cr-next").disabled = currentPage === maxPage;
}

let currentEmergencyId = null;

function openModal(eOrId) {
    const e = typeof eOrId === 'number'
        ? allEmergencies.find(item => item.emergency_id === eOrId)
        : eOrId;
    if (!e) return;

    currentEmergencyId = e.emergency_id;
    currentEmergency = e;
    document.getElementById("modal-ticket").innerText = `Emergency #${e.emergency_id}`;
    
    const badgeClass = `badge-${e.status === 'pending' ? 'pending' : (e.status === 'resolved' ? 'approved' : (e.status === 'false_alarm' ? 'rejected' : 'progress'))}`;
    document.getElementById("modal-badge").className = `badge ${badgeClass}`;
    document.getElementById("modal-badge").innerText = e.status.replace('_', ' ').toUpperCase();
    
    document.getElementById("md-name").innerText = e.user_name;
    document.getElementById("md-contact").innerText = e.contact_num || "N/A";
    document.getElementById("md-location").innerText = e.address || "—";
    document.getElementById("md-date").innerText = new Date(e.created_at).toLocaleString();
    document.getElementById("md-resolved").innerText = e.resolved_at ? new Date(e.resolved_at).toLocaleString() : "Not Resolved";
    document.getElementById("md-notes").innerText = e.notes || "No acknowledge notes.";
    
    const resContainer = document.getElementById("md-resolution-container");
    if (e.resolution_notes) {
        document.getElementById("md-resolution-notes").innerText = e.resolution_notes;
        resContainer.style.display = "block";
    } else {
        resContainer.style.display = "none";
    }

    const resolveBtn = document.getElementById("btn-resolve");
    const falseAlarmBtn = document.getElementById("btn-false-alarm");
    if (e.status === "resolved" || e.status === "false_alarm") {
        resolveBtn.style.display = "none";
        falseAlarmBtn.style.display = "none";
    } else {
        resolveBtn.style.display = "block";
        falseAlarmBtn.style.display = "block";
    }

    document.getElementById("modal-overlay").classList.add("open");
}

function closeModalDirect() {
    document.getElementById("modal-overlay").classList.remove("open");
}

function closeModal(event) {
    if (event.target.id === "modal-overlay") {
        closeModalDirect();
    }
}

function showEmergencyResolveModal() {
    document.getElementById("resolve-emergency-id").innerText = `#${currentEmergencyId}`;
    document.getElementById("emergency-action-notes").value = "";
    document.getElementById("emergency-action-error").style.display = "none";
    document.getElementById("emergency-resolve-overlay").classList.add("active");
}

function closeEmergencyResolveModal() {
    document.getElementById("emergency-resolve-overlay").classList.remove("active");
}

async function submitEmergencyResolve() {
    const notesEl = document.getElementById("emergency-action-notes");
    const errorEl = document.getElementById("emergency-action-error");
    const notes = notesEl.value.trim();

    if (!notes) {
        errorEl.style.display = "block";
        return;
    }
    errorEl.style.display = "none";

    const btn = document.getElementById("emergency-resolve-btn");
    const textEl = document.getElementById("e-resolve-text");
    const spinner = document.getElementById("e-resolve-spinner");

    btn.disabled = true;
    textEl.style.display = "none";
    spinner.style.display = "inline";

    try {
        const response = await fetch(`/api/emergencies/${currentEmergencyId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({
                status: 'resolved',
                resolution_notes: notes,
                admin_id: null
            })
        });

        if (response.ok) {
            closeEmergencyResolveModal();
            await fetchEmergencies();
            const updated = allEmergencies.find(e => e.emergency_id === currentEmergencyId);
            if (updated) openModal(updated);
        } else {
            alert("Failed to resolve emergency.");
        }
    } catch (e) {
        console.error(e);
        alert("An error occurred.");
    } finally {
        btn.disabled = false;
        textEl.style.display = "inline";
        spinner.style.display = "none";
    }
}

function downloadEmergencyReport() {
    if (!currentEmergency || !window.jspdf) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const report = currentEmergency;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    const now = new Date();
    const generatedAt = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) +
        ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const status = String(report.status || 'pending').toLowerCase();
    const printableStatus = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const statusColors = {
        pending:      { bg: [254, 226, 226], border: [252, 165, 165], text: [153, 27, 27] },
        acknowledged: { bg: [219, 234, 254], border: [147, 197, 253], text: [29, 78, 216] },
        resolved:     { bg: [220, 252, 231], border: [134, 239, 172], text: [22, 101, 52] },
        false_alarm:  { bg: [243, 244, 246], border: [209, 213, 219], text: [55, 65, 81] },
    };
    const sc = statusColors[status] || statusColors.pending;

    const reportedAt = report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A';
    const resolvedAt = report.resolved_at ? new Date(report.resolved_at).toLocaleString() : 'Not Resolved';
    const emergencyRef = `#${String(report.emergency_id).padStart(3, '0')}`;

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(29, 78, 216);
    doc.text("CIVIREPORT", margin, 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text("Official Emergency Report", margin, 26);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Prepared for barangay incident documentation and emergency response tracking.", margin, 32);

    doc.setDrawColor(29, 78, 216);
    doc.setLineWidth(0.6);
    doc.line(margin, 36, pageWidth - margin, 36);

    // --- Summary cards ---
    const cardY = 41;
    const cardHeight = 28;
    const cardWidth = (pageWidth - margin * 2 - 4) / 2;

    // Card 1: Emergency Reference
    doc.setDrawColor(219, 228, 240);
    doc.setFillColor(248, 251, 255);
    doc.rect(margin, cardY, cardWidth, cardHeight, 'FD');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("EMERGENCY REFERENCE", margin + 4, cardY + 6);
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(emergencyRef, margin + 4, cardY + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Reported:  ${reportedAt}`, margin + 4, cardY + 20);
    doc.text(`Resolved:  ${resolvedAt}`, margin + 4, cardY + 25);

    // Card 2: Current Status
    const card2X = margin + cardWidth + 4;
    doc.setDrawColor(219, 228, 240);
    doc.setFillColor(248, 251, 255);
    doc.rect(card2X, cardY, cardWidth, cardHeight, 'FD');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("CURRENT STATUS", card2X + 4, cardY + 6);

    doc.setFontSize(8);
    const badgeText = printableStatus.toUpperCase();
    const badgeWidth = doc.getTextWidth(badgeText) + 6;
    doc.setFillColor(...sc.bg);
    doc.setDrawColor(...sc.border);
    doc.setLineWidth(0.3);
    doc.rect(card2X + 4, cardY + 9, badgeWidth, 6, 'FD');
    doc.setTextColor(...sc.text);
    doc.setFont("helvetica", "bold");
    doc.text(badgeText, card2X + 7, cardY + 13.3);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Generated:  ${generatedAt}`, card2X + 4, cardY + 21);
    doc.text("System:  Barangay Emergency Monitoring", card2X + 4, cardY + 26);

    // --- Sections ---
    let y = cardY + cardHeight + 10;
    const drawSectionTitle = (text) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(text, margin, y);
        doc.setDrawColor(219, 228, 240);
        doc.setLineWidth(0.4);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 5;
    };

    const labelColumn = {
        cellWidth: 55,
        fillColor: [241, 245, 249],
        textColor: [100, 116, 139],
        fontStyle: 'bold',
        fontSize: 8,
    };
    const valueColumn = { fillColor: [248, 250, 252] };
    const tableStyles = {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        textColor: [15, 23, 42],
    };

    drawSectionTitle("Reporter Details");
    doc.autoTable({
        startY: y,
        theme: 'grid',
        head: [],
        body: [
            ["Resident Name", report.user_name || 'N/A'],
            ["Contact Number", report.contact_num || 'N/A'],
            ["Location", report.address || '—'],
        ],
        styles: tableStyles,
        columnStyles: { 0: labelColumn, 1: valueColumn },
        margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 8;

    drawSectionTitle("Incident Timeline");
    doc.autoTable({
        startY: y,
        theme: 'grid',
        head: [],
        body: [
            ["Reported At", reportedAt],
            ["Resolved At", resolvedAt],
        ],
        styles: tableStyles,
        columnStyles: { 0: labelColumn, 1: valueColumn },
        margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 8;

    drawSectionTitle("Acknowledge Notes");
    const ackText = report.notes || 'No acknowledge notes recorded.';
    const ackLines = doc.splitTextToSize(ackText, pageWidth - margin * 2 - 8);
    const ackHeight = ackLines.length * 5 + 8;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, pageWidth - margin * 2, ackHeight, 'FD');
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(ackLines, margin + 4, y + 6);
    y += ackHeight + 8;

    if (report.resolution_notes) {
        drawSectionTitle("Resolution Notes");
        const resText = report.resolution_notes;
        const resLines = doc.splitTextToSize(resText, pageWidth - margin * 2 - 8);
        const resHeight = resLines.length * 5 + 8;
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(187, 247, 208);
        doc.rect(margin, y, pageWidth - margin * 2, resHeight, 'FD');
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(22, 101, 52);
        doc.text(resLines, margin + 4, y + 6);
        y += resHeight + 8;
    }

    // --- Footer ---
    doc.setDrawColor(219, 228, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`This is a computer-generated document from CiviReport. Generated on ${generatedAt}.`,
        pageWidth / 2, pageHeight - 9, { align: 'center' });

    doc.save(`Emergency_Report_${emergencyRef.replace('#', '')}.pdf`);
}

window.openModal = openModal;
window.closeModal = closeModal;
window.closeModalDirect = closeModalDirect;
window.showEmergencyResolveModal = showEmergencyResolveModal;
window.closeEmergencyResolveModal = closeEmergencyResolveModal;
window.submitEmergencyResolve = submitEmergencyResolve;
window.downloadEmergencyReport = downloadEmergencyReport;

function showEmergencyFalseAlarmModal() {
    document.getElementById("falsealarm-emergency-id").innerText = `#${currentEmergencyId}`;
    document.getElementById("emergency-falsealarm-notes").value = "";
    document.getElementById("emergency-falsealarm-error").style.display = "none";
    document.getElementById("emergency-falsealarm-overlay").classList.add("active");
}

function closeEmergencyFalseAlarmModal() {
    document.getElementById("emergency-falsealarm-overlay").classList.remove("active");
}

async function submitEmergencyFalseAlarm() {
    const notesEl = document.getElementById("emergency-falsealarm-notes");
    const errorEl = document.getElementById("emergency-falsealarm-error");
    const notes = notesEl.value.trim();

    if (!notes) {
        errorEl.style.display = "block";
        return;
    }
    errorEl.style.display = "none";

    const btn = document.getElementById("emergency-falsealarm-btn");
    const textEl = document.getElementById("e-falsealarm-text");
    const spinner = document.getElementById("e-falsealarm-spinner");

    btn.disabled = true;
    textEl.style.display = "none";
    spinner.style.display = "inline";

    try {
        const response = await fetch(`/api/emergencies/${currentEmergencyId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({
                status: 'false_alarm',
                resolution_notes: notes,
                admin_id: null
            })
        });

        if (response.ok) {
            closeEmergencyFalseAlarmModal();
            await fetchEmergencies();
            const updated = allEmergencies.find(e => e.emergency_id === currentEmergencyId);
            if (updated) openModal(updated);
        } else {
            alert("Failed to mark as false alarm.");
        }
    } catch (e) {
        console.error(e);
        alert("An error occurred.");
    } finally {
        btn.disabled = false;
        textEl.style.display = "inline";
        spinner.style.display = "none";
    }
}

window.showEmergencyFalseAlarmModal = showEmergencyFalseAlarmModal;
window.closeEmergencyFalseAlarmModal = closeEmergencyFalseAlarmModal;
window.submitEmergencyFalseAlarm = submitEmergencyFalseAlarm;
