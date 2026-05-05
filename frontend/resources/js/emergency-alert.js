// emergency-alert.js

let emergencyCheckInterval;
let activeEmergency = null;
let audioCtx = null;
let sirenOscillator = null;
let sirenInterval = null;

// Persist shown emergencies in sessionStorage so page navigations/redirects
// don't reset the set and cause the same alert to re-appear.
function loadShownEmergencies() {
    try {
        const raw = JSON.parse(localStorage.getItem('shownEmergencies') || '[]');
        return new Set((Array.isArray(raw) ? raw : []).map(String));
    } catch {
        return new Set();
    }
}

function saveShownEmergencies() {
    try {
        localStorage.setItem('shownEmergencies', JSON.stringify([...shownEmergencies]));
    } catch { /* storage quota — ignore */ }
}

let shownEmergencies = loadShownEmergencies();

document.addEventListener("DOMContentLoaded", () => {
    // Start polling every 3 seconds
    emergencyCheckInterval = setInterval(checkPendingEmergencies, 3000);

    document.getElementById("btn-respond-emergency").addEventListener("click", respondToEmergency);
});

async function checkPendingEmergencies() {
    try {
        const response = await fetch('/api/emergencies/pending');
        const data = await response.json();

        if (data && data.length > 0) {
            // Find the oldest pending emergency that we haven't shown yet
            const newEmergency = data.find(e => !shownEmergencies.has(String(e.emergency_id)) && e.status === 'pending');
            if (newEmergency && !activeEmergency) {
                triggerEmergencyModal(newEmergency);
            }
        }
    } catch (e) {
        console.error("Emergency Polling Error:", e);
    }
}

function triggerEmergencyModal(emergency) {
    activeEmergency = emergency;
    shownEmergencies.add(String(emergency.emergency_id));
    saveShownEmergencies();

    // Populate Data
    document.getElementById("emergency-resident-name").innerText = emergency.user_name;
    document.getElementById("emergency-resident-contact").innerText = emergency.contact_num || "N/A";
    document.getElementById("emergency-location").innerText = emergency.address || "—";
    document.getElementById("emergency-time").innerText = new Date(emergency.created_at).toLocaleString();

    const imgEl = document.getElementById("emergency-resident-img");
    if (emergency.profile_photo_path) {
        imgEl.src = emergency.profile_photo_path;
        imgEl.style.display = "block";
    } else {
        imgEl.style.display = "none";
    }

    // Show Modal
    const modal = document.getElementById("global-emergency-modal");
    modal.style.display = "flex";

    playSiren();
}

function playSiren() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    sirenOscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    sirenOscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    sirenOscillator.type = 'square';
    sirenOscillator.start();

    let high = false;
    sirenInterval = setInterval(() => {
        sirenOscillator.frequency.value = high ? 800 : 1200; // toggle frequency
        high = !high;
    }, 500); // 500ms toggle
}

function stopSiren() {
    if (sirenInterval) clearInterval(sirenInterval);
    if (sirenOscillator) {
        sirenOscillator.stop();
        sirenOscillator.disconnect();
    }
}

async function respondToEmergency() {
    if (!activeEmergency) return;

    const btn = document.getElementById("btn-respond-emergency");
    btn.innerText = "Acknowledging...";
    btn.disabled = true;

    try {
        const response = await fetch(`/api/emergencies/${activeEmergency.emergency_id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({
                status: 'acknowledged',
                notes: 'Acknowledged by Admin'
            })
        });

        if (response.ok) {
            // Close modal
            document.getElementById("global-emergency-modal").style.display = "none";
            stopSiren();
            shownEmergencies.add(String(activeEmergency.emergency_id));
            saveShownEmergencies();
            activeEmergency = null;

            // Stop polling so a queued tick can't re-trigger before the redirect completes
            if (emergencyCheckInterval) {
                clearInterval(emergencyCheckInterval);
                emergencyCheckInterval = null;
            }

            // Redirect to Emergency Reports page
            window.location.href = '/EmergencyReports';
        } else {
            alert("Failed to acknowledge emergency.");
        }
    } catch (error) {
        console.error("Acknowledge Error:", error);
    } finally {
        btn.innerText = "Acknowledge & Respond";
        btn.disabled = false;
    }
}
