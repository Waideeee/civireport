document.addEventListener('DOMContentLoaded', function () {

  // ===== STATE (NO DUMMY DATA) =====
  let announcements = [];

  // ===== ELEMENTS =====
  const gridEl   = document.querySelector('.announcements-grid');
  const totalEl  = document.querySelector('.stat-card:nth-child(1) h3');
  const postedEl = document.querySelector('.stat-card:nth-child(2) h3');
  const upcEl    = document.querySelector('.stat-card:nth-child(3) h3');

  // ===== HELPERS =====
  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getStatus(eventDate) {
    if (!eventDate) return 'Posted';
    const today = new Date().setHours(0,0,0,0);
    const event = new Date(eventDate).setHours(0,0,0,0);
    return event >= today ? 'Upcoming' : 'Posted';
  }

  // ===== RENDER STATS =====
  function renderStats() {
    const total = announcements.length;
    const posted = announcements.filter(a => getStatus(a.event_date) === 'Posted').length;
    const upcoming = announcements.filter(a => getStatus(a.event_date) === 'Upcoming').length;

    if (totalEl) totalEl.textContent = total;
    if (postedEl) postedEl.textContent = posted;
    if (upcEl) upcEl.textContent = upcoming;
  }

  // ===== RENDER GRID =====
  function renderAnnouncements() {
    if (!gridEl) return;

    if (!announcements.length) {
      gridEl.innerHTML = `
        <div class="empty-state">
          <h3>No Announcements Yet</h3>
          <p>Click "Create Announcement" to post your first one</p>
        </div>
      `;
      renderStats();
      return;
    }

    gridEl.innerHTML = announcements.map(a => {
      const status = getStatus(a.event_date);

      return `
        <div class="announcement-card">
          <div class="card-header">
            <h3>${a.title}</h3>
            <span class="badge ${status === 'Upcoming' ? 'badge-upcoming' : 'badge-posted'}">${status}</span>
          </div>

          <p class="card-desc">${a.description || ''}</p>

          <div class="card-meta">
            <span> ${formatDate(a.event_date)}</span>
            <span> ${a.venue}</span>
          </div>

          <div class="card-footer">
            <button class="btn-edit" data-id="${a.id}">Edit</button>
          </div>
        </div>
      `;
    }).join('');

    bindEditButtons();
    renderStats();
  }

  // ===== CREATE ANNOUNCEMENT =====
  function createAnnouncement() {
    const title       = document.getElementById('title').value.trim();
    const post_date   = document.getElementById('post_date').value;
    const event_date  = document.getElementById('event_date').value;
    const venue       = document.getElementById('venue').value.trim();
    const description = document.getElementById('description').value.trim();
    const attendees   = document.getElementById('attendees').value.trim();

    if (!title || !post_date || !event_date || !venue || !description || !attendees) {
      alert('Please fill in all required fields.');
      return;
    }

    // TEMP LOCAL (replace with API later)
    announcements.unshift({
      id: Date.now(),
      title,
      post_date,
      event_date,
      venue,
      description,
      attendees
    });

    renderAnnouncements();
    closeModal('modal-create');
    clearCreateForm();
  }

  // ===== EDIT ANNOUNCEMENT =====
  function bindEditButtons() {
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.dataset.id;
        openEditModal(id);
      });
    });
  }

  function openEditModal(id) {
    const a = announcements.find(x => x.id == id);
    if (!a) return;

    const modal = document.getElementById('modal-edit');

    modal.querySelector('[name="title"]').value       = a.title;
    modal.querySelector('[name="post_date"]').value   = a.post_date;
    modal.querySelector('[name="event_date"]').value  = a.event_date;
    modal.querySelector('[name="venue"]').value       = a.venue;
    modal.querySelector('[name="description"]').value = a.description;
    modal.querySelector('[name="attendees"]').value   = a.attendees;

    modal.dataset.editId = id;
    modal.classList.add('open');
  }

  function saveEdit() {
    const modal = document.getElementById('modal-edit');
    const id = modal.dataset.editId;

    const a = announcements.find(x => x.id == id);
    if (!a) return;

    a.title       = modal.querySelector('[name="title"]').value;
    a.post_date   = modal.querySelector('[name="post_date"]').value;
    a.event_date  = modal.querySelector('[name="event_date"]').value;
    a.venue       = modal.querySelector('[name="venue"]').value;
    a.description = modal.querySelector('[name="description"]').value;
    a.attendees   = modal.querySelector('[name="attendees"]').value;

    renderAnnouncements();
    closeModal('modal-edit');
  }

  // ===== MODAL HELPERS =====
  function closeModal(id) {
    document.getElementById(id).classList.remove('open');
  }

  function clearCreateForm() {
    document.getElementById('title').value = '';
    document.getElementById('post_date').value = '';
    document.getElementById('event_date').value = '';
    document.getElementById('venue').value = '';
    document.getElementById('description').value = '';
    document.getElementById('attendees').value = '';
  }

  // ===== EVENT BINDINGS =====
  document.querySelector('.btn-post')?.addEventListener('click', createAnnouncement);

  document.querySelector('#modal-edit .btn-post')?.addEventListener('click', saveEdit);

  document.querySelectorAll('.modal-close, .btn-cancel').forEach(btn => {
    btn.addEventListener('click', function () {
      const modal = this.closest('.modal-overlay');
      modal.classList.remove('open');
    });
  });

  // ===== INIT =====
  renderAnnouncements();

});