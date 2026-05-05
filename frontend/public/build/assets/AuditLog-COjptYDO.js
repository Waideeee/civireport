let d=1,u=[],o=[],p="",m="newest";function i(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function b(t){return t&&String(t).replace("T"," ").slice(0,16)||"—"}function g(t){if(!t)return'<span class="audit-badge badge-pending">Unknown</span>';let e=t,n="";if(t.includes(" (")){const a=t.split(" (");e=a[0],n=" ("+a[1]}const s={Pending:"badge-pending","In Progress":"badge-inprogress","in progress":"badge-inprogress",Approved:"badge-approved",Rejected:"badge-rejected",Resolved:"badge-approved"};let l=s[e];if(!l){const a=Object.keys(s).find(_=>_.toLowerCase()===e.toLowerCase());l=a?s[a]:"badge-pending"}let r=`<span class="audit-badge ${l}">${i(e)}</span>`;return n&&(r+=`<div class="al-extra-text">${i(n)}</div>`),r}function h(t){return t.complaint_id?`#C-${String(t.complaint_id).padStart(3,"0")}`:t.emergency_id?`#E-${String(t.emergency_id).padStart(3,"0")}`:"Resident Account"}function v(t){return[...t].sort((e,n)=>m==="newest"?n.audit_id-e.audit_id:e.audit_id-n.audit_id)}function f(){const t=document.getElementById("audit-log");t&&(t.innerHTML=`
    <div class="al-toolbar">
      <div class="al-search-wrap">
        <svg class="al-search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" id="al-search" class="al-search" placeholder="Search admin, complaint…" />
      </div>
      <div class="al-toolbar-right">
        <select id="al-sort" class="al-select">
          <option value="newest" selected>Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        <div class="al-count" id="al-record-count">0 records</div>
      </div>
    </div>

    <div class="al-table-wrap">
      <table class="al-table">
        <thead>
          <tr>
            <th class="al-th">AUDIT ID</th>
            <th class="al-th">DATE AND TIME</th>
            <th class="al-th">ADMIN</th>
            <th class="al-th">REFERENCE</th>
            <th class="al-th">OLD STATUS</th>
            <th class="al-th">NEW STATUS</th>
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
  `,E())}function c(){const t=document.getElementById("al-tbody");if(!t)return;const e=v(o),n=Math.ceil(e.length/8)||1,s=(d-1)*8,l=e.slice(s,s+8),r=l.length?l.map(a=>`
        <tr>
          <td class="al-td al-mono">AUD-${String(a.audit_id).padStart(3,"0")}</td>
          <td class="al-td al-mono">${i(b(a.audit_date))}</td>
          <td class="al-td">${i(a.admin_name||a.user_name||a.user_full_name||"System")}</td>
          <td class="al-td ${a.complaint_id||a.emergency_id?"al-mono":""}">${i(h(a))}</td>
          <td class="al-td">${g(a.old_status)}</td>
          <td class="al-td">${g(a.new_status)}${a.action_notes?`<div class="al-note-text">Note: ${i(a.action_notes)}</div>`:""}</td>
        </tr>`).join(""):'<tr><td colspan="6" class="al-empty">No audit log entries found matching your search.</td></tr>';t.innerHTML=r,document.getElementById("al-record-count").textContent=`${o.length} record${o.length!==1?"s":""}`,document.getElementById("al-page-indicator").textContent=`Page ${d} of ${n}`,document.getElementById("al-prev").disabled=d<=1,document.getElementById("al-next").disabled=d>=n}function y(){const t=p.toLowerCase();o=t?u.filter(e=>{const n=`aud-${String(e.audit_id).padStart(3,"0")}`.toLowerCase(),s=h(e).toLowerCase();return n.includes(t)||s.includes(t)||String(e.audit_id).includes(t)||String(e.complaint_id||"").includes(t)||String(e.emergency_id||"").includes(t)||(e.admin_name||"").toLowerCase().includes(t)||(e.user_name||"").toLowerCase().includes(t)||(e.user_full_name||"").toLowerCase().includes(t)||(e.audit_date||"").toLowerCase().includes(t)||(e.old_status||"").toLowerCase().includes(t)||(e.new_status||"").toLowerCase().includes(t)||(e.action_notes||"").toLowerCase().includes(t)}):[...u],d=1,c()}function E(){document.getElementById("al-search")?.addEventListener("input",t=>{p=t.target.value,y()}),document.getElementById("al-sort")?.addEventListener("change",t=>{m=t.target.value,d=1,c()}),document.getElementById("al-prev")?.addEventListener("click",()=>{d>1&&(d--,c())}),document.getElementById("al-next")?.addEventListener("click",()=>{const t=Math.ceil(o.length/8)||1;d<t&&(d++,c())})}document.addEventListener("DOMContentLoaded",()=>{f(),fetch("/api/audit-logs").then(t=>t.json()).then(t=>{u=t,o=[...u],c()}).catch(()=>{const t=document.getElementById("al-tbody");t&&(t.innerHTML='<tr><td colspan="6" class="al-empty" style="color:red;">Failed to load audit logs.</td></tr>')})});
