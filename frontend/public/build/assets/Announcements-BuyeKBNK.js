document.addEventListener("DOMContentLoaded",function(){let o=[];const r=document.querySelector(".announcements-grid"),s=document.querySelector(".stat-card:nth-child(1) h3"),l=document.querySelector(".stat-card:nth-child(2) h3"),u=document.querySelector(".stat-card:nth-child(3) h3");function m(e){return e?new Date(e).toLocaleDateString("en-PH",{year:"numeric",month:"short",day:"numeric"}):""}function v(e){if(!e)return"Posted";const t=new Date().setHours(0,0,0,0);return new Date(e).setHours(0,0,0,0)>=t?"Upcoming":"Past"}async function i(){try{const e=await fetch("/api/announcements");e.ok&&(o=await e.json(),w())}catch(e){console.error("Failed to fetch announcements:",e)}}function p(){const e=o.length,t=o.length,n=o.filter(a=>v(a.event_date)==="Upcoming").length;s&&(s.textContent=e),l&&(l.textContent=t),u&&(u.textContent=n)}function w(){if(r){if(!o.length){r.innerHTML=`
        <div class="empty-state">
          <h3>No Announcements Yet</h3>
          <p>Click "Create Announcement" to post your first one</p>
        </div>
      `,p();return}r.innerHTML=o.map(e=>{const t=v(e.event_date);return`
        <div class="announcement-card">
          <div class="announcement-card-header">
            <h3 class="announcement-title">${e.title}</h3>
            <div style="display: flex; gap: 0.5rem;">
              <span class="announcement-badge" style="background: #EFF6FF; color: #1E3A8A;">${e.category||"Community"}</span>
              <span class="announcement-badge">${t}</span>
            </div>
          </div>

          <p class="announcement-description">${e.description||""}</p>

          <div class="announcement-meta">
            <div class="meta-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>${m(e.event_date)}</span>
            </div>
            <div class="meta-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span>${e.venue}</span>
            </div>
            <div class="meta-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <span>${e.who_will_attend}</span>
            </div>
          </div>

          <div class="announcement-footer" style="display:flex; justify-content:space-between; align-items:center;">
            <span>Posted on ${m(e.post_date)}</span>
            <button class="btn-edit btn-sm" style="flex: 0" data-id="${e.announcement_id}">Edit</button>
          </div>
        </div>
      `}).join(""),_(),p()}}async function E(e){e&&e.preventDefault();const t=document.getElementById("title").value.trim(),n=document.getElementById("category").value,a=document.getElementById("post_date").value,c=document.getElementById("event_date").value,y=document.getElementById("venue").value.trim(),h=document.getElementById("description").value.trim(),f=document.getElementById("who_will_attend").value.trim();if(!t||!n||!a||!c||!y||!h||!f){alert("Please fill in all required fields.");return}const B={title:t,category:n,post_date:a,event_date:c,venue:y,description:h,who_will_attend:f};try{(await fetch("/api/announcements",{method:"POST",headers:{"Content-Type":"application/json","X-CSRF-TOKEN":document.querySelector('meta[name="csrf-token"]')?.content||""},body:JSON.stringify(B)})).ok?(await i(),d(),k()):alert("Failed to submit announcement.")}catch(g){console.error(g)}}function _(){document.querySelectorAll(".btn-edit").forEach(e=>{e.addEventListener("click",function(){const t=this.dataset.id;S(t)})})}function S(e){const t=o.find(a=>a.announcement_id==e);if(!t)return;const n=document.getElementById("modal-edit");n&&(n.querySelector('[name="title"]').value=t.title,n.querySelector('[name="category"]').value=t.category,n.querySelector('[name="post_date"]').value=t.post_date,n.querySelector('[name="event_date"]').value=t.event_date,n.querySelector('[name="venue"]').value=t.venue,n.querySelector('[name="description"]').value=t.description,n.querySelector('[name="attendees"]').value=t.who_will_attend,n.dataset.editId=e,n.classList.add("open"),window.location.hash="#modal-edit")}async function q(){const e=document.getElementById("modal-edit"),t=e.dataset.editId;if(!o.find(c=>c.announcement_id==t))return;const a={title:e.querySelector('[name="title"]').value.trim(),category:e.querySelector('[name="category"]').value,post_date:e.querySelector('[name="post_date"]').value,event_date:e.querySelector('[name="event_date"]').value,venue:e.querySelector('[name="venue"]').value.trim(),description:e.querySelector('[name="description"]').value.trim(),who_will_attend:e.querySelector('[name="attendees"]').value.trim()};try{(await fetch(`/api/announcements/${t}`,{method:"PUT",headers:{"Content-Type":"application/json","X-CSRF-TOKEN":document.querySelector('meta[name="csrf-token"]')?.content||"","X-HTTP-Method-Override":"PUT"},body:JSON.stringify(a)})).ok&&(await i(),d())}catch(c){console.error(c)}}function d(){window.location.hash="",document.querySelectorAll(".modal-overlay.open").forEach(e=>e.classList.remove("open"))}function k(){document.getElementById("title").value="",document.getElementById("category").value="",document.getElementById("post_date").value="",document.getElementById("event_date").value="",document.getElementById("venue").value="",document.getElementById("description").value="",document.getElementById("who_will_attend").value=""}document.querySelector("#modal-create form")?.addEventListener("submit",E),document.querySelector("#modal-edit form")?.addEventListener("submit",function(e){e.preventDefault(),q()}),document.querySelectorAll(".modal-close, .btn-cancel").forEach(e=>{e.addEventListener("click",function(t){(this.tagName!=="A"||this.getAttribute("href")!=="#")&&t.preventDefault(),d()})}),i()});
