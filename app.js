/* ═══════════════════════════════════════════════
   TOKO BUAH ABS — Digital Signage + Partikel + Audio
   ═══════════════════════════════════════════════ */
'use strict';

// ── SCALING ──
const configureScale = () => {
    const root = document.getElementById('signage-root');
    if (!root) return;
    const baseW = 3840, baseH = 2160;
    const sx = window.innerWidth / baseW;
    const sy = window.innerHeight / baseH;
    const s = Math.min(sx, sy);
    root.style.transform = `scale(${s})`;
    root.style.marginLeft = `${(window.innerWidth - baseW * s) / 2}px`;
    root.style.marginTop = `${(window.innerHeight - baseH * s) / 2}px`;
};
window.addEventListener('resize', configureScale);
document.addEventListener('DOMContentLoaded', configureScale);

// ── CLOCK ──
const startClock = () => {
    const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const clock = document.getElementById('jam-tv');
    const dateEl = document.getElementById('tanggal-tv');
    setInterval(() => {
        const d = new Date();
        const h = String(d.getHours()).padStart(2,'0');
        const m = String(d.getMinutes()).padStart(2,'0');
        const s = String(d.getSeconds()).padStart(2,'0');
        if (clock) clock.textContent = `${h}:${m}:${s}`;
        if (dateEl) dateEl.textContent = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }, 1000);
};

// ── PARTIKEL ──
class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 8 + 3;
        this.speedX = (Math.random() - 0.5) * 0.6;
        this.speedY = (Math.random() - 0.5) * 0.6;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.color = `hsl(${Math.floor(Math.random() * 60 + 30)}, 80%, 60%)`;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > this.canvas.width) this.x = 0;
        if (this.x < 0) this.x = this.canvas.width;
        if (this.y > this.canvas.height) this.y = 0;
        if (this.y < 0) this.y = this.canvas.height;
    }
    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.fillStyle = this.color;
        this.ctx.globalAlpha = this.opacity;
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
    }
}

function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    for (let i = 0; i < 120; i++) {
        particles.push(new Particle(canvas));
    }
    const ctx = canvas.getContext('2d');
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    animate();
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particles.forEach(p => {
            p.x = Math.random() * canvas.width;
            p.y = Math.random() * canvas.height;
        });
    });
}

// ── HELPER: bungkus teks jadi running line ──
function runLine(text, duration) {
    return `<div class="run-line"><div class="run-line-track" style="animation-duration:${duration}s"><span>${text}</span><span>${text}</span></div></div>`;
}

// ── RENDER SLIDES ──
let currentSlide = 0;
let slideInterval = null;

function renderSlides(slides) {
    const wrapper = document.getElementById('slideWrapper');
    const dots = document.getElementById('slideDots');
    if (!wrapper || !dots) return;
    wrapper.innerHTML = '';
    dots.innerHTML = '';

    slides.forEach((slide, idx) => {
        const div = document.createElement('div');
        div.className = `slide-item${idx === 0 ? ' active' : ''}`;
        div.innerHTML = `
            <div class="slide-content">
                <div class="slide-image">${slide.image}</div>
                <div class="slide-text">
                    <div class="tag">${slide.tag}</div>
                    <h2>${runLine(slide.title, 14)}</h2>
                    <div class="desc">${runLine(slide.desc, 16)}</div>
                    <div class="price">${runLine(slide.price, 10)}</div>
                </div>
            </div>
        `;
        wrapper.appendChild(div);

        const dot = document.createElement('span');
        dot.className = `dot${idx === 0 ? ' active' : ''}`;
        dot.dataset.index = idx;
        dot.addEventListener('click', () => goToSlide(idx));
        dots.appendChild(dot);
    });

    currentSlide = 0;
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        const total = slides.length;
        goToSlide((currentSlide + 1) % total);
    }, 7000);
}

function goToSlide(index) {
    const items = document.querySelectorAll('.slide-item');
    const dots = document.querySelectorAll('.dot');
    if (!items.length) return;
    items.forEach(el => el.classList.remove('active'));
    dots.forEach(el => el.classList.remove('active'));
    currentSlide = (index + items.length) % items.length;
    items[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

// ── RENDER TICKER ──
function renderTicker(items) {
    const track = document.getElementById('marquee-track');
    if (!track) return;
    const doubled = [...items, ...items];
    track.innerHTML = doubled.map(text =>
        `<span class="m-item">${text}</span><span class="m-sep">✦</span>`
    ).join('');
}

// ── FETCH DATA ──
let cachedData = null;

async function fetchData() {
    try {
        const resp = await fetch(`./news-data.json?nocache=${Date.now()}`);
        if (!resp.ok) throw new Error('Network error');
        return await resp.json();
    } catch (e) {
        console.warn('Gagal ambil data:', e);
        return null;
    }
}

async function updateContent() {
    const data = await fetchData();
    if (!data) return;
    if (cachedData && data.version === cachedData.version) return;
    cachedData = data;
    renderSlides(data.slides);
    renderTicker(data.ticker);
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = 'Promo Terbaru';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// ── AUDIO CONTROL ──
function initAudio() {
    const audio = document.getElementById('bgMusic');
    const btn = document.getElementById('musicToggle');
    if (!audio || !btn) return;

    audio.volume = 0.4;

    btn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().then(() => {
                btn.textContent = '🔊';
                btn.classList.remove('muted');
            }).catch(() => {
                btn.textContent = '🔇';
                btn.classList.add('muted');
            });
        } else {
            audio.pause();
            btn.textContent = '🔇';
            btn.classList.add('muted');
        }
    });

    document.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().then(() => {
                btn.textContent = '🔊';
                btn.classList.remove('muted');
            }).catch(() => {});
        }
    }, { once: true });
}

// ── SW ──
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('[SW] Registered'))
            .catch(() => {});
    }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
    startClock();
    initParticles();
    initAudio();

    const data = await fetchData();
    if (data) {
        cachedData = data;
        renderSlides(data.slides);
        renderTicker(data.ticker);
    }

    setInterval(updateContent, 30000);
    registerSW();
});

window.goToSlide = goToSlide;
window.updateContent = updateContent;