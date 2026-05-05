let i, r = null, o = null, t = null, l = null;

function g() {
    try {
        const e = JSON.parse(localStorage.getItem("shownEmergencies") || "[]");
        return new Set((Array.isArray(e) ? e : []).map(String));
    } catch {
        return new Set();
    }
}

function d() {
    try {
        localStorage.setItem("shownEmergencies", JSON.stringify([...a]));
    } catch {}
}

let a = g();

document.addEventListener("DOMContentLoaded", () => {
    i = setInterval(m, 3000);
    document.getElementById("btn-respond-emergency").addEventListener("click", f);
});

async function m() {
    if (r) return;
    try {
        const res = await fetch("/api/emergencies/pending");
        const n = await res.json();
        if (n && n.length > 0) {
            const c = n.find(s => !a.has(String(s.emergency_id)) && s.status === "pending");
            if (c) y(c);
        }
    } catch (e) {
        console.error("Emergency Polling Error:", e);
    }
}

function y(e) {
    r = e;
    a.add(String(e.emergency_id));
    d();
    document.getElementById("emergency-resident-name").innerText = e.user_name;
    document.getElementById("emergency-resident-contact").innerText = e.contact_num || "N/A";
    document.getElementById("emergency-location").innerText = e.address || "—";
    document.getElementById("emergency-time").innerText = new Date(e.created_at).toLocaleString();

    const n = document.getElementById("emergency-resident-img");
    if (e.profile_photo_path) {
        n.src = e.profile_photo_path;
        n.style.display = "block";
    } else {
        n.style.display = "none";
    }

    document.getElementById("global-emergency-modal").style.display = "flex";
    u();
}

function u() {
    if (!o) o = new (window.AudioContext || window.webkitAudioContext)();
    if (o.state === "suspended") o.resume();
    t = o.createOscillator();
    const e = o.createGain();
    t.connect(e);
    e.connect(o.destination);
    t.type = "square";
    t.start();
    let n = false;
    l = setInterval(() => {
        t.frequency.value = n ? 800 : 1200;
        n = !n;
    }, 500);
}

function p() {
    if (l) clearInterval(l);
    if (t) {
        t.stop();
        t.disconnect();
    }
}

async function f() {
    if (!r) return;
    const e = document.getElementById("btn-respond-emergency");
    e.innerText = "Acknowledging...";
    e.disabled = true;
    try {
        const res = await fetch(`/api/emergencies/${r.emergency_id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content")
            },
            body: JSON.stringify({ status: "acknowledged", notes: "Acknowledged by Admin" })
        });
        if (res.ok) {
            document.getElementById("global-emergency-modal").style.display = "none";
            p();
            a.add(String(r.emergency_id));
            d();
            r = null;
            await new Promise(resolve => setTimeout(resolve, 500)); // race condition fix
            window.location.href = "/EmergencyReports";
        } else {
            alert("Failed to acknowledge emergency.");
        }
    } catch (n) {
        console.error("Acknowledge Error:", n);
    } finally {
        e.innerText = "Acknowledge & Respond";
        e.disabled = false;
    }
}