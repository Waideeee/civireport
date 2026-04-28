let allEmergencies = [];
let currentPage = 1;
const rowsPerPage = 10;
let filteredEmergencies = [];

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
                              e.location.toLowerCase().includes(search);
        
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
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No emergency reports found.</td></tr>`;
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
                <td><div class="notes-cell" title="${escapeHtml(e.location)}">${escapeHtml(e.location)}</div></td>
                <td>${escapeHtml(new Date(e.created_at).toLocaleString())}</td>
                <td><span class="badge ${badgeClass}">${escapeHtml(e.status.toUpperCase())}</span></td>
                <td><button class="btn btn-ghost" style="padding:4px 8px; font-size:11px;">View</button></td>
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

function openModal(e) {
    currentEmergencyId = e.emergency_id;
    document.getElementById("modal-ticket").innerText = `Emergency #${e.emergency_id}`;
    
    const badgeClass = `badge-${e.status === 'pending' ? 'pending' : (e.status === 'resolved' ? 'approved' : (e.status === 'false_alarm' ? 'rejected' : 'progress'))}`;
    document.getElementById("modal-badge").className = `badge ${badgeClass}`;
    document.getElementById("modal-badge").innerText = e.status.replace('_', ' ').toUpperCase();
    
    document.getElementById("md-name").innerText = e.user_name;
    document.getElementById("md-contact").innerText = e.contact_num || "N/A";
    document.getElementById("md-location").innerText = e.location;
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
window.openModal = openModal;
window.closeModal = closeModal;
window.closeModalDirect = closeModalDirect;
window.showEmergencyResolveModal = showEmergencyResolveModal;
window.closeEmergencyResolveModal = closeEmergencyResolveModal;
window.submitEmergencyResolve = submitEmergencyResolve;

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
