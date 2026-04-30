let n=1,r=0,i=1,c="",u="",g="",p="";function l(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function m(t){if(!t)return"-";const e=String(t).includes("T")?String(t):String(t).replace(" ","T"),d=new Date(e);if(Number.isNaN(d.getTime()))return l(t);const a=d.getFullYear(),o=String(d.getMonth()+1).padStart(2,"0"),h=String(d.getDate()).padStart(2,"0"),v=String(d.getHours()).padStart(2,"0"),f=String(d.getMinutes()).padStart(2,"0");return`${a}-${o}-${h} ${v}:${f}`}function b(t){const e=String(t).toLowerCase(),d=e?e.replace(/_/g," ").replace(/\b\w/g,o=>o.toUpperCase()):"-";let a="badge-pending";return e==="active"||e==="approved"||e==="resolved"?a="badge-approved":e==="inactive"||e==="deactivated"||e==="deleted"?a="badge-rejected":e==="pending"?a="badge-pending":e==="in_progress"&&(a="badge-inprogress"),`<span class="audit-badge ${a}">${l(d)}</span>`}function y(){const t=document.getElementById("superadmin-audit-log");t&&(t.innerHTML=`
    <div class="al-toolbar">
      <div class="al-toolbar-left">
        <div class="al-search-wrap">
          <svg class="al-search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="al-search" class="al-search" placeholder="Search action..." />
        </div>
        <input type="date" id="al-date-from" class="al-select" />
        <input type="date" id="al-date-to" class="al-select" />
        <select id="al-status" class="al-select">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>
      <div class="al-toolbar-right">
        <div class="al-count" id="al-record-count">0 records</div>
      </div>
    </div>

    <div class="al-table-wrap">
      <table class="al-table">
        <thead>
          <tr>
            <th class="al-th">Audit Date</th>
            <th class="al-th">Performed By</th>
            <th class="al-th">Affected User</th>
            <th class="al-th">Action</th>
            <th class="al-th">Old Status</th>
            <th class="al-th">New Status</th>
            <th class="al-th">Created At</th>
          </tr>
        </thead>
        <tbody id="al-tbody"></tbody>
      </table>
    </div>

    <div class="al-pagination">
      <button class="al-page-btn" id="al-prev" disabled>&#8592; Prev</button>
      <span class="al-page-info" id="al-page-indicator">Page 1 of 1</span>
      <button class="al-page-btn" id="al-next" disabled>Next &#8594;</button>
    </div>
  `,I())}function E(t){const e=document.getElementById("al-tbody");if(!e)return;const d=Array.isArray(t.data)?t.data:[];r=Number(t.total||0),i=Math.max(1,Math.ceil(r/20)),e.innerHTML=d.length?d.map(a=>`
        <tr>
          <td class="al-td al-mono">${l(m(a.audit_date))}</td>
          <td class="al-td">${l(a.superadmin_name||"Unknown")}</td>
          <td class="al-td">${l(a.user_name||"-")}</td>
          <td class="al-td al-desc">${l(a.action_notes||"-")}</td>
          <td class="al-td">${l(a.old_status||"-")}</td>
          <td class="al-td">${b(a.new_status||"-")}</td>
          <td class="al-td al-mono">${l(m(a.created_at))}</td>
        </tr>
      `).join(""):'<tr><td colspan="7" class="al-empty">No audit records found.</td></tr>',document.getElementById("al-record-count").textContent=`${r} record${r!==1?"s":""}`,document.getElementById("al-page-indicator").textContent=`Page ${n} of ${i}`,document.getElementById("al-prev").disabled=n<=1,document.getElementById("al-next").disabled=n>=i}function S(){const t=document.getElementById("al-tbody");t&&(t.innerHTML='<tr><td colspan="7" class="al-empty" style="color:#b91c1c;">Failed to load audit logs.</td></tr>')}function $(){const t=new URLSearchParams({page:String(n),per_page:String(20)});return c&&t.set("search",c),g&&t.set("date_from",g),p&&t.set("date_to",p),u&&t.set("status",u),t.toString()}function s(){fetch(`/superadmin/proxy/audit-logs?${$()}`).then(t=>t.json()).then(t=>E(t)).catch(()=>S())}function I(){document.getElementById("al-search")?.addEventListener("input",t=>{c=t.target.value.trim(),n=1,s()}),document.getElementById("al-date-from")?.addEventListener("change",t=>{g=t.target.value,n=1,s()}),document.getElementById("al-date-to")?.addEventListener("change",t=>{p=t.target.value,n=1,s()}),document.getElementById("al-status")?.addEventListener("change",t=>{u=t.target.value,n=1,s()}),document.getElementById("al-prev")?.addEventListener("click",()=>{n<=1||(n-=1,s())}),document.getElementById("al-next")?.addEventListener("click",()=>{n>=i||(n+=1,s())})}document.addEventListener("DOMContentLoaded",()=>{document.getElementById("superadmin-audit-log")&&(y(),s())});
