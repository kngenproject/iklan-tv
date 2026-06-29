/* ═══════════════════════════════════════════
   4K DIGITAL SIGNAGE — MAIN SCRIPT
   ═══════════════════════════════════════════ */

'use strict';

// ── 1. SCALE TO FIT VIEWPORT ──────────────────
function scaleSignage() {
    const root   = document.getElementById('signage-root');
    const scaleX = window.innerWidth  / 3840;
    const scaleY = window.innerHeight / 2160;
    const scale  = Math.min(scaleX, scaleY);
    root.style.transform = `scale(${scale})`;

    // Tengahkan jika ada letterbox (rasio layar berbeda)
    const scaledW = 3840 * scale;
    const scaledH = 2160 * scale;
    root.style.marginLeft = `${(window.innerWidth  - scaledW) / 2}px`;
    root.style.marginTop  = `${(window.innerHeight - scaledH) / 2}px`;
}

window.addEventListener('resize', scaleSignage);
scaleSignage();


// ── 2. JAM & TANGGAL REAL-TIME ────────────────
const HARI  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function updateClock() {
    const now = new Date();
    const h   = String(now.getHours()).padStart(2, '0');
    const m   = String(now.getMinutes()).padStart(2, '0');
    const s   = String(now.getSeconds()).padStart(2, '0');

    document.getElementById('jam-tv').textContent =
        `${h}:${m}:${s}`;

    document.getElementById('tanggal-tv').textContent =
        `${HARI[now.getDay()]}, ${now.getDate()} ${BULAN[now.getMonth()]} ${now.getFullYear()}`;
}

setInterval(updateClock, 1000);
updateClock();


// ── 3. SERVICE WORKER (anti-cache) ────────────
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('[SW] Registered'))
        .catch(err => console.warn('[SW] Error:', err));
}


// ── 4. AUTO RELOAD SAAT VERSION.JSON BERUBAH ──
let versiAktif = null;

async function cekVersi() {
    try {
        const res  = await fetch(`./version.json?t=${Date.now()}`);
        const data = await res.json();

        if (versiAktif === null) {
            versiAktif = data.v;
            console.log('[Signage] Versi aktif:', versiAktif);
            return;
        }

        if (data.v !== versiAktif) {
            console.log('[Signage] Update terdeteksi! Reload dalam 3 detik...');
            tampilkanToast();
            setTimeout(() => location.reload(), 3000);
        }

    } catch (err) {
        console.warn('[Signage] Gagal cek versi:', err);
    }
}

function tampilkanToast() {
    const toast = document.getElementById('toast-update');
    toast.classList.add('show');
}

// Cek tiap 60 detik
setInterval(cekVersi, 60_000);
cekVersi();