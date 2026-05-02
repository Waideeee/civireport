document.addEventListener('DOMContentLoaded', function () {
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatFileSize(bytes) {
    if (bytes == null || isNaN(bytes)) return '';
    const b = Number(bytes);
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function buildUploadUrl(rawPath) {
    const raw = String(rawPath || '').replace(/\\/g, '/').trim();
    if (!raw) return '';

    // If backend already returned a full URL, use it as-is.
    if (/^https?:\/\//i.test(raw)) return raw;

    const normalized = raw
      .split('/')
      .filter(Boolean)
      .map(segment => encodeURIComponent(segment))
      .join('/');

    return normalized ? `http://localhost:8001/${normalized}` : '';
  }

  function urgencyBadgeClass(level) {
    return { Critical: 'urgency-critical', High: 'urgency-high', Medium: 'urgency-medium', Low: 'urgency-low' }[level] || 'urgency-medium';
  }

  function badgeClass(status) {
    if (!status) return '';
    const map = {
      pending: 'badge-pending',
      in_progress: 'badge-progress',
      resolved: 'badge-approved',
      rejected: 'badge-rejected',
    };
    return map[String(status).toLowerCase()] || '';
  }

  function formatStatus(status) {
    if (!status) return 'Unknown';
    return String(status)
      .split(/[ _]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  function formatFeedbackTimestamp(value) {
    if (!value) return '';
    const normalized = String(value).includes('T')
      ? String(value)
      : String(value).replace(' ', 'T');
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return '';

    const datePart = date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
    const timePart = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return `Submitted: ${datePart} - ${timePart}`;
  }

  let complaints = [];
  let auditLogs = [];
  let filteredData = [];
  const ROWS_PER_PAGE = 8;
  let currentPage = 1;
  let currentSearch = '';
  let currentStatus = '';
  let currentType = '';
  let currentUrgency = '';

  function getUrgencyValue(level) {
    if (level === 'Critical') return 4;
    if (level === 'High') return 3;
    if (level === 'Medium') return 2;
    if (level === 'Low') return 1;
    return 0;
  }

  function sortQueue(a, b) {
    const urgencyDiff = getUrgencyValue(b.urgency) - getUrgencyValue(a.urgency);
    if (urgencyDiff !== 0) return urgencyDiff;
    return new Date(a.created).getTime() - new Date(b.created).getTime();
  }

  function updateQueueBanner() {
    const pending = complaints.filter(c => c.status.toLowerCase() === 'pending').sort(sortQueue);
    const current = pending[0];
    const next = pending[1];

    const numEl = document.getElementById('queue-number');
    const statusEl = document.getElementById('queue-status');
    const nextEl = document.getElementById('queue-next');
    const updatedEl = document.getElementById('queue-updated');

    if (current) {
      numEl.textContent = current.ticket_id;
      statusEl.textContent = 'Pending';
      statusEl.style.background = '#fef3c7';
      statusEl.style.color = '#d97706';
      nextEl.innerHTML = next ? `Next in line: <strong>#${next.ticket_id}</strong>` : 'No pending complaints left';
    } else {
      numEl.textContent = '--';
      statusEl.textContent = 'All Clear';
      statusEl.style.background = '#dcfce7';
      statusEl.style.color = '#166534';
      nextEl.textContent = 'No pending complaints left';
    }

    updatedEl.textContent = `Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  function mapComplaint(complaint) {
    return {
      ticket_id: String(complaint.complaint_id).padStart(3, '0'),
      raw_id: complaint.complaint_id,
      id: complaint.complaint_id,
      type: complaint.complaint_type || '',
      subtype: complaint.complaint_subtype || '',
      location: complaint.complaint_location || '',
      name: complaint.user_name || '',
      contact: complaint.contact_num || '',
      status: complaint.complaint_status || 'pending',
      urgency: complaint.urgency_level || 'Medium',
      notes: complaint.additional_notes || '',
      date: complaint.complaint_date || '',
      created: complaint.created_at || '',
      updated_at: complaint.updated_at || '',
      media: complaint.media || [],
      rejection_reason: complaint.rejection_reason || '',
      resolved_media: complaint.resolved_media || '',
      resolved_notes: complaint.resolved_notes || '',
      ai_recommendation: complaint.ai_recommendation || '',
      revision_feedback: complaint.revision_feedback || '',
      service_rating: complaint.service_rating,
      service_feedback: complaint.service_feedback || null,
    };
  }

  function getComplaintHistory(complaintId) {
    return auditLogs.filter(item => Number(item.complaint_id || 0) === Number(complaintId));
  }

  function renderTable() {
    const tbody = document.getElementById('reports-tbody');
    if (!tbody) return;

    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const pageData = filteredData.slice(start, start + ROWS_PER_PAGE);

    if (!pageData.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No complaints found.</td></tr>';
      document.getElementById('cr-count').textContent = '0 records';
      return;
    }

    tbody.innerHTML = pageData.map(c => `
      <tr onclick="openModal(${c.raw_id})" style="cursor:pointer;">
        <td><strong>#${c.ticket_id}</strong></td>
        <td>${escapeHtml(c.type)}</td>
        <td>${escapeHtml(c.subtype)}</td>
        <td>${escapeHtml(c.location)}</td>
        <td><span class="urgency-badge ${urgencyBadgeClass(c.urgency)}">${escapeHtml(c.urgency)}</span></td>
        <td><span class="badge ${badgeClass(c.status)}">${formatStatus(c.status)}</span></td>
      </tr>
    `).join('');

    document.getElementById('cr-count').textContent = `${filteredData.length} records`;
  }

  function applyFilters() {
    const q = currentSearch.toLowerCase();
    filteredData = complaints.filter(c => {
      return (
        (!q ||
          c.ticket_id.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          c.subtype.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q)) &&
        (!currentStatus || c.status.toLowerCase() === currentStatus.toLowerCase()) &&
        (!currentType || c.type === currentType) &&
        (!currentUrgency || c.urgency === currentUrgency)
      );
    });

    const statusOrder = { pending: 1, in_progress: 2, resolved: 3, rejected: 4 };
    filteredData.sort((a, b) => {
      const statusDiff = (statusOrder[a.status.toLowerCase()] || 99) - (statusOrder[b.status.toLowerCase()] || 99);
      if (statusDiff !== 0) return statusDiff;
      const urgencyDiff = getUrgencyValue(b.urgency) - getUrgencyValue(a.urgency);
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(a.created).getTime() - new Date(b.created).getTime();
    });

    const totalPages = Math.max(1, Math.ceil(filteredData.length / ROWS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    document.getElementById('cr-page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('cr-prev').disabled = currentPage === 1;
    document.getElementById('cr-next').disabled = currentPage >= totalPages;
    renderTable();
  }

  function showCrToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style = `position:fixed;bottom:24px;right:24px;background:#1e293b;color:#fff;padding:12px 20px;border-radius:8px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);z-index:9999;font-weight:600;font-size:0.9rem;border-left:4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'}`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function getCurrentComplaint() {
    return window.currentComplaint || null;
  }

  function setCurrentComplaintButtons(complaint) {
    const btnReject = document.getElementById('btn-reject');
    const btnInProgress = document.getElementById('btn-inprogress');
    const btnWaiting = document.getElementById('btn-waiting-user');

    btnReject.style.display = complaint.status.toLowerCase() === 'pending' ? 'inline-block' : 'none';
    btnInProgress.style.display = complaint.status.toLowerCase() === 'pending' ? 'inline-block' : 'none';
    btnWaiting.style.display = complaint.status.toLowerCase() === 'in_progress' ? 'block' : 'none';
  }

  function updateModal(complaint) {
    window.currentComplaint = complaint;

    document.getElementById('modal-ticket').textContent = `Complaint #${complaint.ticket_id}`;
    document.getElementById('modal-badge').textContent = formatStatus(complaint.status);
    document.getElementById('modal-badge').className = `badge ${badgeClass(complaint.status)}`;
    document.getElementById('md-type').textContent = complaint.type;
    document.getElementById('md-subtype').textContent = complaint.subtype;
    document.getElementById('md-location').textContent = complaint.location;
    document.getElementById('md-contact').textContent = complaint.contact;
    document.getElementById('md-date').textContent = complaint.date;
    document.getElementById('md-updated').textContent = complaint.updated_at || complaint.created;
    document.getElementById('md-name').textContent = complaint.name;
    document.getElementById('md-notes').textContent = complaint.notes;
    document.getElementById('md-urgency').textContent = complaint.urgency;
    document.getElementById('md-urgency').className = `urgency-badge ${urgencyBadgeClass(complaint.urgency)}`;

    const rejectContainer = document.getElementById('md-reject-container');
    rejectContainer.style.display = complaint.status.toLowerCase() === 'rejected' && complaint.rejection_reason ? 'block' : 'none';
    document.getElementById('md-reject-reason').textContent = complaint.rejection_reason || '';

    const feedbackContainer = document.getElementById('md-feedback-container');
    feedbackContainer.style.display = 'block';
    document.getElementById('md-revision-feedback').textContent =
      complaint.revision_feedback || 'No revision feedback submitted yet.';

    const ratingContainer = document.getElementById('md-rating-container');
    const ratingFeedback = document.getElementById('md-rating-feedback');
    const ratingSubmitted = document.getElementById('md-rating-submitted');
    if (complaint.service_rating) {
      const serviceFeedback = complaint.service_feedback || {};
      const feedbackComment = (serviceFeedback.comment || '').trim();
      const submittedLabel = formatFeedbackTimestamp(serviceFeedback.submitted_at);

      ratingContainer.style.display = 'block';
      document.getElementById('md-rating-stars').textContent = '★'.repeat(complaint.service_rating) + '☆'.repeat(5 - complaint.service_rating);
      ratingFeedback.textContent = feedbackComment ? `"${feedbackComment}"` : 'No written feedback provided.';
      ratingSubmitted.textContent = submittedLabel;
      ratingSubmitted.style.display = submittedLabel ? 'block' : 'none';
    } else {
      ratingContainer.style.display = complaint.status.toLowerCase() === 'resolved' ? 'block' : 'none';
      document.getElementById('md-rating-stars').textContent = '☆☆☆☆☆';
      ratingFeedback.textContent = 'No rating submitted yet.';
      ratingSubmitted.textContent = '';
      ratingSubmitted.style.display = 'none';
    }

    const resolutionContainer = document.getElementById('md-resolution-container');
    if (complaint.resolved_notes || complaint.resolved_media) {
      resolutionContainer.style.display = 'block';
      document.getElementById('md-resolved-notes').textContent = complaint.resolved_notes || 'No action taken recorded.';
      if (complaint.resolved_media) {
        const items = String(complaint.resolved_media).split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
        document.getElementById('md-resolved-media').innerHTML = items.map(item => {
          const path = /^https?:\/\//i.test(item) || item.startsWith('uploads/') ? item : `uploads/${item}`;
          const uploadUrl = buildUploadUrl(path);
          const ext = item.split('.').pop().toLowerCase();
          const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(ext);
          if (isVideo) {
            return `<video src="${uploadUrl}" controls class="modal-media-item modal-media-video"></video>`;
          }
          return `<a href="${uploadUrl}" target="_blank" rel="noopener noreferrer" class="modal-media-item">
            <img src="${uploadUrl}" alt="Action proof" loading="lazy" />
          </a>`;
        }).join('');
      } else {
        document.getElementById('md-resolved-media').innerHTML = '';
      }
    } else {
      resolutionContainer.style.display = 'none';
      document.getElementById('md-resolved-media').innerHTML = '';
    }

    const historyContainer = document.getElementById('md-history-container');
    const historyList = document.getElementById('md-history-list');
    const complaintHistory = getComplaintHistory(complaint.raw_id);
    if (complaintHistory.length > 0) {
      historyContainer.style.display = 'block';
      historyList.innerHTML = complaintHistory.map(item => `
        <div class="history-item">
          <div class="history-item-head">
            <strong>${escapeHtml(item.admin_name || item.user_full_name || 'System')}</strong>
            <span>${escapeHtml(item.audit_date || '')}</span>
          </div>
          <div class="history-item-status">${escapeHtml(formatStatus(item.old_status || ''))} → ${escapeHtml(formatStatus(item.new_status || ''))}</div>
          <div class="history-item-notes">${escapeHtml(item.action_notes || 'No notes provided.')}</div>
        </div>
      `).join('');
    } else {
      historyContainer.style.display = 'block';
      historyList.innerHTML = '<div class="history-empty">No complaint history recorded yet.</div>';
    }

    const mediaContainer = document.getElementById('md-media-link');
    if (complaint.media.length > 0) {
      mediaContainer.innerHTML = complaint.media.map(media => {
        const mediaPath = /^https?:\/\//i.test(media.file_path) || media.file_path.startsWith('uploads/') ? media.file_path : `uploads/${media.file_path}`;
        const uploadUrl = buildUploadUrl(mediaPath);
        const mediaType = String(media.media_type || '').toLowerCase();
        const fileName = media.file_name || mediaPath.split('/').pop() || 'media';
        const fileSize = formatFileSize(media.file_size);
        const meta = `<div class="modal-media-meta">
          <span class="modal-media-filename" title="${escapeHtml(fileName)}">${escapeHtml(fileName)}</span>
          ${fileSize ? `<span class="modal-media-size">${escapeHtml(fileSize)}</span>` : ''}
        </div>`;
        if (mediaType.startsWith('image/')) {
          return `<div class="modal-media-cell">
            <a href="${uploadUrl}" target="_blank" rel="noopener noreferrer" class="modal-media-item">
              <img src="${uploadUrl}" alt="Complaint media" loading="lazy" />
            </a>
            ${meta}
          </div>`;
        }
        if (mediaType.startsWith('video/')) {
          return `<div class="modal-media-cell">
            <video src="${uploadUrl}" controls preload="metadata" class="modal-media-item modal-media-video"></video>
            ${meta}
          </div>`;
        }
        return `<div class="modal-media-cell">
          <a href="${uploadUrl}" target="_blank" rel="noopener noreferrer" class="modal-media-fallback">View ${escapeHtml(media.media_type || 'media')}</a>
          ${meta}
        </div>`;
      }).join('');
    } else {
      mediaContainer.innerHTML = '<span class="modal-media-empty">No media attached</span>';
    }

    document.getElementById('ai-recommendation-content').textContent = complaint.ai_recommendation || 'No recommendation available';
    setCurrentComplaintButtons(complaint);
  }

  function reloadComplaints() {
    Promise.all([
      fetch('/api/complaints').then(response => response.json()),
      fetch('/api/audit-logs').then(response => response.json()).catch(() => []),
    ])
      .then(([complaintData, auditLogData]) => {
        complaints = complaintData.map(mapComplaint);
        auditLogs = Array.isArray(auditLogData) ? auditLogData : [];
        applyFilters();
        updateQueueBanner();

        const current = getCurrentComplaint();
        if (current) {
          const refreshed = complaints.find(item => item.raw_id === current.raw_id);
          if (refreshed) updateModal(refreshed);
        }
      })
      .catch(() => {
        const tbody = document.getElementById('reports-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Failed to load complaints.</td></tr>';
      });
  }

  function setLoadingState(buttonId, textId, spinnerId, loading) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    button.disabled = loading;
    if (textId) document.getElementById(textId).style.display = loading ? 'none' : 'inline';
    if (spinnerId) document.getElementById(spinnerId).style.display = loading ? 'inline' : 'none';
  }

  window.openModal = function (id) {
    const complaint = complaints.find(item => item.raw_id === id);
    if (!complaint) return;
    updateModal(complaint);
    document.getElementById('modal-overlay').classList.add('open');
  };

  window.closeModalDirect = function () {
    document.getElementById('modal-overlay').classList.remove('open');
  };

  window.closeModal = function (event) {
    if (event.target.id === 'modal-overlay') {
      closeModalDirect();
    }
  };

  window.showComplaintInProgressModal = function () {
    const complaint = getCurrentComplaint();
    if (!complaint) return;
    document.getElementById('inprogress-complaint-id').textContent = `#${complaint.ticket_id}`;
    document.getElementById('complaint-inprogress-notes').value = '';
    document.getElementById('complaint-inprogress-proof').value = '';
    document.getElementById('complaint-inprogress-confirm-error').style.display = 'none';
    document.getElementById('complaint-inprogress-error').style.display = 'none';
    document.getElementById('complaint-inprogress-notes').placeholder =
      complaint.resolved_notes
        ? 'Add another action taken for this complaint...'
        : 'Explain what steps have been taken or how the complaint is resolved...';
    document.getElementById('complaint-inprogress-overlay').classList.add('active');
  };

  window.closeComplaintInProgressModal = function () {
    document.getElementById('complaint-inprogress-overlay').classList.remove('active');
  };

  window.showComplaintInProgressConfirmModal = function () {
    const notes = document.getElementById('complaint-inprogress-notes').value.trim();
    if (!notes) {
      document.getElementById('complaint-inprogress-error').textContent = 'Action Taken is required.';
      document.getElementById('complaint-inprogress-error').style.display = 'block';
      return;
    }
    document.getElementById('complaint-inprogress-error').style.display = 'none';
    document.getElementById('complaint-inprogress-confirm-error').style.display = 'none';
    document.getElementById('complaint-inprogress-confirm-overlay').classList.add('active');
  };

  window.closeComplaintInProgressConfirmModal = function () {
    document.getElementById('complaint-inprogress-confirm-overlay').classList.remove('active');
  };

  window.submitComplaintInProgress = async function () {
    const complaint = getCurrentComplaint();
    if (!complaint) return;

    const notes = document.getElementById('complaint-inprogress-notes').value.trim();
    const fileInput = document.getElementById('complaint-inprogress-proof');

    let mediaBase64 = null;
    let mediaName = null;
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      mediaName = file.name;
      mediaBase64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }

    setLoadingState('complaint-inprogress-confirm-btn', 'c-inprogress-text', 'c-inprogress-spinner', true);

    try {
      const response = await fetch(`/api/complaints/${complaint.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({
          complaint_status: 'in_progress',
          resolved_notes: notes,
          action_proof: mediaBase64,
          action_proof_name: mediaName,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.detail || 'Failed to mark complaint as in progress.');
      }

      closeComplaintInProgressConfirmModal();
      closeComplaintInProgressModal();
      closeModalDirect();
      await reloadComplaints();
      showCrToast(result.message || 'Complaint marked as In Progress successfully.', 'success');
    } catch (error) {
      closeComplaintInProgressConfirmModal();
      document.getElementById('complaint-inprogress-error').textContent = error.message || 'Failed to update complaint.';
      document.getElementById('complaint-inprogress-error').style.display = 'block';
      document.getElementById('complaint-inprogress-confirm-error').textContent = error.message || 'Failed to mark complaint as in progress.';
      document.getElementById('complaint-inprogress-confirm-error').style.display = 'block';
      showCrToast(error.message || 'Failed to update complaint.', 'error');
    } finally {
      setLoadingState('complaint-inprogress-confirm-btn', 'c-inprogress-text', 'c-inprogress-spinner', false);
    }
  };

  window.showComplaintRejectModal = function () {
    const complaint = getCurrentComplaint();
    if (!complaint) return;
    document.getElementById('reject-complaint-id').textContent = `#${complaint.ticket_id}`;
    document.getElementById('complaint-reject-reason').value = '';
    document.getElementById('complaint-reject-error').style.display = 'none';
    document.getElementById('complaint-reject-overlay').classList.add('active');
  };

  window.closeComplaintRejectModal = function () {
    document.getElementById('complaint-reject-overlay').classList.remove('active');
  };

  window.submitComplaintReject = async function () {
    const complaint = getCurrentComplaint();
    if (!complaint) return;

    const reason = document.getElementById('complaint-reject-reason').value.trim();
    if (!reason) {
      document.getElementById('complaint-reject-error').style.display = 'block';
      return;
    }

    try {
      const response = await fetch(`/api/complaints/${complaint.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({
          complaint_status: 'rejected',
          rejection_reason: reason,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.detail || 'Failed to reject complaint.');
      }

      closeComplaintRejectModal();
      closeModalDirect();
      await reloadComplaints();
      showCrToast(result.message || 'Complaint rejected.', 'success');
    } catch (error) {
      showCrToast(error.message || 'Failed to reject complaint.', 'error');
    }
  };

  window.downloadComplaint = function () {
    const complaint = getCurrentComplaint();
    if (!complaint) return;
    window.location.href = `/Complaints/${complaint.id}/download`;
  };

  document.getElementById('cr-filter-status')?.addEventListener('change', function () {
    currentStatus = this.value;
    currentPage = 1;
    applyFilters();
  });
  document.getElementById('cr-filter-type')?.addEventListener('change', function () {
    currentType = this.value;
    currentPage = 1;
    applyFilters();
  });
  document.getElementById('cr-filter-urgency')?.addEventListener('change', function () {
    currentUrgency = this.value;
    currentPage = 1;
    applyFilters();
  });
  document.getElementById('cr-search')?.addEventListener('input', function () {
    currentSearch = this.value;
    currentPage = 1;
    applyFilters();
  });
  document.getElementById('cr-prev')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= 1;
      applyFilters();
    }
  });
  document.getElementById('cr-next')?.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(filteredData.length / ROWS_PER_PAGE));
    if (currentPage < totalPages) {
      currentPage += 1;
      applyFilters();
    }
  });

  // ===== Auto-open modal from URL query param =====
  const urlParams = new URLSearchParams(window.location.search);
  const viewId = urlParams.get('view');
  if (viewId) {
      setTimeout(() => {
          if (typeof window.openModal === 'function') {
              window.openModal(parseInt(viewId));
          }
      }, 300);
  }

  setInterval(reloadComplaints, 3000);
  reloadComplaints();
});
