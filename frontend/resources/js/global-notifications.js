// global-notifications.js

let notificationAudioCtx = null;
let knownNotificationIds = new Set(); // Track what we've already chimed for

document.addEventListener("DOMContentLoaded", () => {
    // Initial fetch
    pollNotifications();

    // Poll every 5 seconds
    setInterval(pollNotifications, 5000);

    // Toggle dropdown when clicking button
    const notifBtn = document.getElementById('notif-btn');
    const notifDropdown = document.getElementById('notif-dropdown');
    
    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent document listener from immediately closing it
            notifDropdown.classList.toggle('open');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (notifBtn && notifDropdown && notifDropdown.classList.contains('open')) {
            if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
                notifDropdown.classList.remove('open');
            }
        }
    });

    // Mark all as read listener
    const markAllBtn = document.getElementById('notif-mark-all');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', async () => {
            const listItems = document.querySelectorAll('.notif-item');
            for (let item of listItems) {
                // We'll trigger all their click handlers silently or just clear the ui
                // Actually, the easiest way is to hit the API for all current notifications
                item.click();
            }
            document.getElementById('notif-dropdown').classList.remove('open');
        });
    }
});

async function pollNotifications() {
    try {
        const [complaintsRes, usersRes] = await Promise.all([
            fetch('/api/notifications/complaints/latest'),
            fetch('/api/notifications/users/latest')
        ]);
        
        let complaints = [];
        let users = [];

        const cDataList = await complaintsRes.json();
        const uDataList = await usersRes.json();

        if (Array.isArray(cDataList)) {
            cDataList.forEach(c => {
                c.notif_type = 'complaint';
                complaints.push(c);
            });
        }
        
        if (Array.isArray(uDataList)) {
            uDataList.forEach(u => {
                u.notif_type = 'user';
                users.push(u);
            });
        }

        const allNotifs = [...complaints, ...users];
        
        // Update sidebar badge
        updateSidebarBadge(allNotifs.length);

        // Update dashboard bell if we are on the dashboard
        updateDashboardBell(allNotifs);

        // Check if there are NEW notifications to play sound
        let hasNew = false;
        const currentIds = new Set();
        
        allNotifs.forEach(n => {
            const uniqueId = n.notif_type + '_' + (n.complaint_id || n.user_id);
            currentIds.add(uniqueId);
            if (!knownNotificationIds.has(uniqueId)) {
                hasNew = true;
            }
        });

        if (hasNew && currentIds.size > 0 && knownNotificationIds.size > 0 || (knownNotificationIds.size === 0 && hasNew && allNotifs.length > 0)) {
            // Play sound for the newly added items
            playNotificationSound();
        }
        knownNotificationIds = currentIds;

    } catch (e) {
        console.error("Polling Error:", e);
    }
}

function updateSidebarBadge(count) {
    const badge = document.getElementById('sidebar-dashboard-badge');
    if (!badge) return;

    if (count > 0) {
        badge.innerText = "+" + count;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function updateDashboardBell(notifs) {
    const bellCount = document.getElementById('notif-count');
    const notifList = document.getElementById('notif-list');

    // If these elements don't exist, we aren't on the dashboard
    if (!bellCount || !notifList) return;

    if (notifs.length > 0) {
        bellCount.innerText = notifs.length;
        bellCount.style.display = 'flex';
    } else {
        bellCount.style.display = 'none';
    }

    // Render dropdown list
    if (notifs.length === 0) {
        notifList.innerHTML = '<div class="notif-empty">No notifications</div>';
        return;
    }

    notifList.innerHTML = '';
    notifs.forEach(n => {
        const item = document.createElement('div');
        item.className = 'notif-item';
        
        if (n.notif_type === 'complaint') {
            item.onclick = () => handleNotificationClick('complaints', n.complaint_id, '/Complaints');
            item.innerHTML = `
                <div class="notif-dot"></div>
                <div>
                    <div class="notif-text"><strong>New Complaint</strong> filed by ${n.resident_name}</div>
                    <div class="notif-time">${n.created_at}</div>
                </div>
            `;
        } else {
            item.onclick = () => handleNotificationClick('users', n.user_id, '/UserRecords');
            item.innerHTML = `
                <div class="notif-dot" style="background: #059669;"></div>
                <div>
                    <div class="notif-text"><strong>New User Registration</strong> by ${n.full_name}</div>
                    <div class="notif-time">${n.date_registered}</div>
                </div>
            `;
        }
        notifList.appendChild(item);
    });
}

async function handleNotificationClick(endpointType, id, redirectUrl) {
    try {
        await fetch(`/api/notifications/${endpointType}/${id}/notified`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });
        window.location.href = redirectUrl + '?view=' + id;
    } catch (e) {
        console.error("Mark Notified Error:", e);
        // Redirect anyway
        window.location.href = redirectUrl + '?view=' + id;
    }
}

function playNotificationSound() {
    if (!notificationAudioCtx) {
        notificationAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (notificationAudioCtx.state === 'suspended') {
        notificationAudioCtx.resume().catch(() => {});
    }

    try {
        const osc = notificationAudioCtx.createOscillator();
        const gainNode = notificationAudioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(notificationAudioCtx.destination);
        
        osc.type = 'sine';
        const now = notificationAudioCtx.currentTime;
        
        osc.frequency.setValueAtTime(523.25, now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(1, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.frequency.setValueAtTime(659.25, now + 0.3);
        gainNode.gain.setValueAtTime(0, now + 0.3);
        gainNode.gain.linearRampToValueAtTime(1, now + 0.35);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        
        osc.start(now);
        osc.stop(now + 1);
    } catch(e) {}
}
