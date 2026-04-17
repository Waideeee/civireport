<div class="announcement-card">
  <div class="announcement-card-header">
    <h3 class="announcement-title">{{ $a['title'] }}</h3>
    @php
      $status = 'Posted';
      if (!empty($a['event_date'])) {
          $today = \Carbon\Carbon::today()->startOfDay();
          $event = \Carbon\Carbon::parse($a['event_date'])->startOfDay();
          $status = $event->gte($today) ? 'Upcoming' : 'Past';
      }
    @endphp
    <span class="announcement-badge">{{ $status }}</span>
  </div>

  <p class="announcement-description">{{ $a['description'] ?? '' }}</p>

  <div class="announcement-meta">
    <div class="meta-item">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
      </svg>
      <span>{{ \Carbon\Carbon::parse($a['event_date'])->format('M j, Y') }}</span>
    </div>
    <div class="meta-item">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
      <span>{{ $a['venue'] }}</span>
    </div>
    <div class="meta-item">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
      </svg>
      <span>{{ $a['who_will_attend'] }}</span>
    </div>
  </div>

  <div class="announcement-footer" style="display:flex; justify-content:space-between; align-items:center;">
    <span>Posted on {{ \Carbon\Carbon::parse($a['post_date'])->format('M j, Y') }}</span>
    <button class="btn-edit btn-sm" style="flex: 0" data-id="{{ $a['id'] }}">Edit</button>
  </div>
</div>
