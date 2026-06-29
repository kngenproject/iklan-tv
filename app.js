/* ═══════════════════════════════════════════════
   ABS ANEKA BUAH SEGAR — DIGITAL SIGNAGE
   ═══════════════════════════════════════════════ */
'use strict';

/* ─────────────────────────
   1. SCALE TO FIT VIEWPORT
───────────────────────────*/
function scaleSignage() {
    const root   = document.getElementById('signage-root');
    const scaleX = window.innerWidth  / 3840;
    const scaleY = window.innerHeight / 2160;
    const scale  = Math.min(scaleX, scaleY);
    root.style.transform  = `scale(${scale})`;
    root.style.marginLeft = `${(window.innerWidth  - 3840 * scale) / 2}px`;
    root.style.marginTop  = `${(window.innerHeight - 2160 * scale) / 2}px`;
}
window.addEventListener('resize', scaleSignage);
scaleSignage();

/* ─────────────────────────
   2. JAM & TANGGAL
───────────────────────────*/
const HARI  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni',
               'Juli','Agustus','September','Oktober','November','Desember'];

function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');
    document.getElementById('jam-tv').textContent    = `${h}:${m}:${s}`;
    document.getElementById('tanggal-tv').textContent =
        `${HARI[now.getDay()]}, ${now.getDate()} ${BULAN[now.getMonth()]} ${now.getFullYear()}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ─────────────────────────
   3. SLIDESHOW KIRI
───────────────────────────*/
const slides    = document.querySelectorAll('.slide');
const dots      = document.querySelectorAll('.dot');
let currentSlide = 0;
const SLIDE_INTERVAL = 8000; // 8 detik per slide

function goToSlide(n) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide]?.classList.remove('active');
    currentSlide = (n + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide]?.classList.add('active');
}

// Klik dot untuk navigasi
dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));

let slideTimer = setInterval(() => goToSlide(currentSlide + 1), SLIDE_INTERVAL);
goToSlide(0);

/* ─────────────────────────
   4. PANEL KANAN (berganti)
───────────────────────────*/
const rightPanels = document.querySelectorAll('.right-panel');
let currentPanel  = 0;
const PANEL_INTERVAL = 6000; // 6 detik

function goToPanel(n) {
    rightPanels[currentPanel].classList.remove('active');
    currentPanel = (n + rightPanels.length) % rightPanels.length;
    rightPanels[currentPanel].classList.add('active');
}

setInterval(() => goToPanel(currentPanel + 1), PANEL_INTERVAL);
goToPanel(0);

/* ─────────────────────────
   5. SERVICE WORKER
───────────────────────────*/
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('[SW] OK'))
        .catch(e  => console.warn('[SW]', e));
}

/* ─────────────────────────
   6. AUTO RELOAD
───────────────────────────*/
let versiAktif = null;
async function cekVersi() {
    try {
        const res  = await fetch(`./version.json?t=${Date.now()}`);
        const data = await res.json();
        if (versiAktif === null) { versiAktif = data.v; return; }
        if (data.v !== versiAktif) {
            document.getElementById('toast').classList.add('show');
            setTimeout(() => location.reload(), 3000);
        }
    } catch (e) { console.warn('[Versi]', e); }
}
setInterval(cekVersi, 60_000);
cekVersi();