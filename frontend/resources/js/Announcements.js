document.addEventListener('DOMContentLoaded', function () {

  // ===== STATE =====
  let announcements = [];

  // ===== ELEMENTS =====
  const gridEl = document.querySelector('.announcements-grid');
  const totalEl = document.querySelector('.stat-card:nth-child(1) h3');
  const postedEl = document.querySelector('.stat-card:nth-child(2) h3');
  const upcEl = document.querySelector('.stat-card:nth-child(3) h3');

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
    const today = new Date().setHours(0, 0, 0, 0);
    const event = new Date(eventDate).setHours(0, 0, 0, 0);
    return event >= today ? 'Upcoming' : 'Past';
  }

  // ===== DATA FETCH =====
  async function fetchAnnouncements() {
    try {
      const response = await fetch('/api/announcements');
      if (response.ok) {
        announcements = await response.json();
        renderAnnouncements();
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    }
  }

  // ===== RENDER STATS =====
  function renderStats() {
    const total = announcements.length;
    const posted = announcements.length; // Actually, all returned are posted to DB
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
          <div class="announcement-card-header">
            <h3 class="announcement-title">${a.title}</h3>
            <div style="display: flex; gap: 0.5rem;">
              <span class="announcement-badge" style="background: #EFF6FF; color: #1E3A8A;">${a.category || 'Community'}</span>
              <span class="announcement-badge">${status}</span>
            </div>
          </div>

          <p class="announcement-description">${a.description || ''}</p>

          <div class="announcement-meta">
            <div class="meta-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>${formatDate(a.event_date)}</span>
            </div>
            <div class="meta-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span>${a.venue}</span>
            </div>
            <div class="meta-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <span>${a.who_will_attend}</span>
            </div>
          </div>

          <div class="announcement-footer" style="display:flex; justify-content:space-between; align-items:center;">
            <span>Posted on ${formatDate(a.post_date)}</span>
            <button class="btn-edit btn-sm" style="flex: 0" data-id="${a.id}">Edit</button>
          </div>
        </div>
      `;
    }).join('');

    bindEditButtons();
    renderStats();
  }

  // ===== CREATE ANNOUNCEMENT =====
  async function createAnnouncement(e) {
    if (e) e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const category = document.getElementById('category').value;
    const post_date = document.getElementById('post_date').value;
    const event_date = document.getElementById('event_date').value;
    const venue = document.getElementById('venue').value.trim();
    const description = document.getElementById('description').value.trim();
    const attendees = document.getElementById('who_will_attend').value.trim();

    if (!title || !category || !post_date || !event_date || !venue || !description || !attendees) {
      alert('Please fill in all required fields.');
      return;
    }

    const payload = {
      title: title,
      category: category,
      post_date: post_date,
      event_date: event_date,
      venue: venue,
      description: description,
      who_will_attend: attendees
    };

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchAnnouncements();
        closeModal(); // Clears URL hash to elegantly close target active modals
        clearCreateForm();
      } else {
        alert("Failed to submit announcement.");
      }
    } catch (error) {
      console.error(error);
    }
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
    if (!modal) return;

    modal.querySelector('[name="title"]').value = a.title;
    modal.querySelector('[name="category"]').value = a.category;
    modal.querySelector('[name="post_date"]').value = a.post_date;
    modal.querySelector('[name="event_date"]').value = a.event_date;
    modal.querySelector('[name="venue"]').value = a.venue;
    modal.querySelector('[name="description"]').value = a.description;
    modal.querySelector('[name="attendees"]').value = a.who_will_attend;

    modal.dataset.editId = id;

    // Fallback if styling opens it via class
    modal.classList.add('open');
    // Actual trigger for target-styled modal
    window.location.hash = '#modal-edit';
  }

  async function saveEdit() {
    const modal = document.getElementById('modal-edit');
    const id = modal.dataset.editId;

    const a = announcements.find(x => x.id == id);
    if (!a) return;

    const payload = {
      title: modal.querySelector('[name="title"]').value.trim(),
      category: modal.querySelector('[name="category"]').value,
      post_date: modal.querySelector('[name="post_date"]').value,
      event_date: modal.querySelector('[name="event_date"]').value,
      venue: modal.querySelector('[name="venue"]').value.trim(),
      description: modal.querySelector('[name="description"]').value.trim(),
      who_will_attend: modal.querySelector('[name="attendees"]').value.trim()
    };

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
          'X-HTTP-Method-Override': 'PUT'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchAnnouncements();
        closeModal();
      }
    } catch (error) {
      console.error(error);
    }
  }

  // ===== MODAL HELPERS =====
  function closeModal() {
    window.location.hash = '';
    document.querySelectorAll('.modal-overlay.open').forEach(el => el.classList.remove('open'));
  }

  function clearCreateForm() {
    document.getElementById('title').value = '';
    document.getElementById('category').value = '';
    document.getElementById('post_date').value = '';
    document.getElementById('event_date').value = '';
    document.getElementById('venue').value = '';
    document.getElementById('description').value = '';
    document.getElementById('who_will_attend').value = '';
  }

  // ===== EVENT BINDINGS =====
  document.querySelector('#modal-create form')?.addEventListener('submit', createAnnouncement);
  document.querySelector('#modal-edit form')?.addEventListener('submit', function (e) { e.preventDefault(); saveEdit(); });

  document.querySelectorAll('.modal-close, .btn-cancel').forEach(btn => {
    btn.addEventListener('click', function (e) {
      if (this.tagName !== 'A' || this.getAttribute('href') !== '#') {
        e.preventDefault();
      }
      closeModal();
    });
  });

  // ===== INIT =====
  fetchAnnouncements();

});