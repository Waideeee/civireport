@extends('layouts.app')

@section('content')

@vite(['resources/css/app.css', 'resources/css/Announcements.css'])

<div class="main">
  <div class="content">

    {{-- ── Header ── --}}
    <div class="page-header">
        <div class="page-header-left">
            <h1>Announcements</h1>
            <p>Manage and publish announcements for your organization</p>
        </div>
        <a href="#modal-create" class="btn-create">
            Create Announcement
        </a>
    </div>

    {{-- ── Stats ── --}}
    <div class="stats-row">
        <div class="stat-card">
            <div class="stat-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 11l19-9-9 19-2-8-8-2z"/>
                </svg>
            </div>
            <div class="stat-info">
                <p>Total Announcements</p>
                <h3>0</h3>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon green">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
            </div>
            <div class="stat-info">
                <p>Posted</p>
                <h3>0</h3>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon orange">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
            </div>
            <div class="stat-info">
                <p>Upcoming</p>
                <h3>0</h3>
            </div>
        </div>
    </div>

    {{-- ── Cards Grid ── --}}
    <p class="section-title">All Announcements</p>
    <div class="announcements-grid">
        <div class="empty-state">
            <h3>No Announcements Yet</h3>
            <p>Click "Create Announcement" to post your first one</p>
        </div>
    </div>

  </div>
</div>

{{-- ══════════════════ CREATE MODAL ══════════════════ --}}
<div class="modal-overlay" id="modal-create">
    <div class="modal">
        <div class="modal-header">
            <h2>New Announcement</h2>
            <a href="#" class="modal-close">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </a>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label class="form-label" for="title">Title <span>*</span></label>
                <input type="text" id="title" name="title" class="form-control" placeholder="e.g. General Assembly Meeting">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="post_date">Post Date <span>*</span></label>
                    <input type="date" id="post_date" name="post_date" class="form-control">
                </div>
                <div class="form-group">
                    <label class="form-label" for="event_date">Event Date <span>*</span></label>
                    <input type="date" id="event_date" name="event_date" class="form-control">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label" for="venue">Venue / Location <span>*</span></label>
                <input type="text" id="venue" name="venue" class="form-control" placeholder="e.g. Main Hall, Building A">
            </div>
            <div class="form-group">
                <label class="form-label" for="description">Description <span>*</span></label>
                <textarea id="description" name="description" class="form-control" placeholder="Write the announcement details here..."></textarea>
            </div>
            <div class="form-group">
                <label class="form-label" for="attendees">Who Will Attend <span>*</span></label>
                <input type="text" id="attendees" name="attendees" class="form-control" placeholder="e.g. All Staff, Grade 10, Teachers">
            </div>
        </div>
        <div class="modal-footer">
            <a href="#" class="btn-cancel">Cancel</a>
            <button type="submit" class="btn-post">Post Announcement</button>
        </div>
    </div>
</div>

{{-- ══════════════════ EDIT MODAL ══════════════════ --}}
<div class="modal-overlay" id="modal-edit">
    <div class="modal">
        <div class="modal-header">
            <h2>Edit Announcement</h2>
            <a href="#" class="modal-close">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </a>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label class="form-label">Title <span>*</span></label>
                <input type="text" name="title" class="form-control">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Post Date <span>*</span></label>
                    <input type="date" name="post_date" class="form-control">
                </div>
                <div class="form-group">
                    <label class="form-label">Event Date <span>*</span></label>
                    <input type="date" name="event_date" class="form-control">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Venue / Location <span>*</span></label>
                <input type="text" name="venue" class="form-control">
            </div>
            <div class="form-group">
                <label class="form-label">Description <span>*</span></label>
                <textarea name="description" class="form-control"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Who Will Attend <span>*</span></label>
                <input type="text" name="attendees" class="form-control">
            </div>
        </div>
        <div class="modal-footer">
            <a href="#" class="btn-cancel">Cancel</a>
            <button type="submit" class="btn-post">Save Changes</button>
        </div>
    </div>
</div>

@endsection