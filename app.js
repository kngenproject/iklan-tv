/* ═══════════════════════════════════════════════
   BERITA TERKINI — Digital Signage Core
   Update otomatis dari news-data.json
   ═══════════════════════════════════════════════ */
'use strict';

// --- 1. SCALING ---
const configureSignageScale = () => {
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
window.addEventListener('resize', configureSignageScale);
document.addEventListener('DOMContentLoaded', configureSignageScale);

// --- 2. CLOCK ---
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

// --- 3. RENDER SLIDES ---
let currentSlideIndex = 0;
let slideIntervalId = null;

function renderSlides(slidesData) {
    const panelLeft = document.querySelector('.panel-left');
    if (!panelLeft) return;
    const dotsContainer = panelLeft.querySelector('.slide-dots');
    // Hapus slide lama (selain dots)
    const oldSlides = panelLeft.querySelectorAll('.slide');
    oldSlides.forEach(s => s.remove());

    slidesData.forEach((slide, idx) => {
        const div = document.createElement('div');
        div.className = `slide slide-news${idx === 0 ? ' active' : ''}`;
        div.dataset.index = idx;

        // Header
        const header = document.createElement('h2');
        header.className = 'slide-header';
        let badgeHTML = '';
        if (slide.badge) {
            const color = slide.badgeColor || '#b71c1c';
            badgeHTML = `<span class="badge-news" style="background:${color};">${slide.badge}</span>`;
        }
        header.innerHTML = `${slide.title} ${badgeHTML}`;
        div.appendChild(header);

        // Cek apakah item menggunakan layout list
        const isList = slide.items.some(item => item.isList === true);
        if (isList) {
            const listContainer = document.createElement('div');
            listContainer.className = 'news-list';
            slide.items.forEach((item, i) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'news-list-item';
                itemDiv.innerHTML = `
                    <div class="num">${i+1}</div>
                    <div class="content">
                        <div class="headline">${item.title}</div>
                        <div class="desc">${item.summary}</div>
                    </div>
                    <div class="time-tag">${item.time}</div>
                `;
                listContainer.appendChild(itemDiv);
            });
            div.appendChild(listContainer);
        } else {
            const grid = document.createElement('div');
            grid.className = 'news-grid';
            slide.items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'news-card';
                let tagHTML = '';
                if (item.tag) {
                    const color = item.tagColor || '#b71c1c';
                    tagHTML = `<span class="tag" style="background:${color};">${item.tag}</span>`;
                }
                card.innerHTML = `
                    ${tagHTML}
                    <div class="title">${item.title}</div>
                    <div class="summary">${item.summary}</div>
                    <div class="meta"><span class="source">${item.source}</span> • ${item.time}</div>
                `;
                grid.appendChild(card);
            });
            div.appendChild(grid);
        }

        panelLeft.insertBefore(div, dotsContainer);
    });

    // Update dots
    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === 0);
        dot.replaceWith(dot.cloneNode(true));
    });
    // Re-bind dot click
    const newDots = dotsContainer.querySelectorAll('.dot');
    newDots.forEach((dot, i) => {
        dot.addEventListener('click', () => goToSlide(i));
    });

    // Reset slide index & timer
    currentSlideIndex = 0;
    if (slideIntervalId) clearInterval(slideIntervalId);
    startSlideTimer();
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    if (slides.length === 0) return;
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    const newIdx = (index + slides.length) % slides.length;
    slides[newIdx].classList.add('active');
    dots[newIdx]?.classList.add('active');
    currentSlideIndex = newIdx;
}

function startSlideTimer() {
    if (slideIntervalId) clearInterval(slideIntervalId);
    slideIntervalId = setInterval(() => {
        const total = document.querySelectorAll('.slide').length;
        if (total === 0) return;
        goToSlide(currentSlideIndex + 1);
    }, 8000);
}

// --- 4. RENDER SIDEBAR ---
let sidebarIntervalId = null;
let currentPanelIdx = 0;

function renderSidebar(sidebarData) {
    // Top section
    const rightTop = document.querySelector('.right-top');
    if (rightTop) {
        const title = rightTop.querySelector('.right-top-title');
        if (title) title.textContent = sidebarData.top.title;
        const qrLabel = rightTop.querySelector('.qr-label');
        if (qrLabel) qrLabel.textContent = sidebarData.top.qrLabel;
        const kontakList = rightTop.querySelector('.kontak-list');
        if (kontakList) {
            kontakList.innerHTML = sidebarData.top.contacts.map(c =>
                `<div class="kontak-item">${c.icon} <span>${c.label}</span></div>`
            ).join('');
        }
    }

    // Middle panels
    const middle = document.querySelector('.right-middle');
    if (!middle) return;
    const oldPanels = middle.querySelectorAll('.right-panel');
    oldPanels.forEach(p => p.remove());

    sidebarData.panels.forEach((panel, idx) => {
        const div = document.createElement('div');
        div.className = `right-panel${idx === 0 ? ' active' : ''}`;
        div.dataset.panelIndex = idx;

        const title = document.createElement('h3');
        title.className = 'right-panel-title';
        title.textContent = panel.title;
        div.appendChild(title);

        if (panel.type === 'popular') {
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '12px';
            panel.data.forEach(item => {
                const mini = document.createElement('div');
                mini.className = 'mini-news-item';
                mini.style.borderLeftColor = item.borderColor || '#b71c1c';
                mini.innerHTML = `
                    <div class="mini-title">${item.title}</div>
                    <div class="mini-meta">${item.meta}</div>
                `;
                container.appendChild(mini);
            });
            div.appendChild(container);
        } else if (panel.type === 'weather') {
            const d = panel.data;
            const weatherBox = document.createElement('div');
            weatherBox.className = 'weather-box';
            weatherBox.innerHTML = `
                <div>
                    <div class="temp">${d.temp}</div>
                    <div class="desc">${d.desc}</div>
                </div>
                <div class="emoji">${d.emoji}</div>
            `;
            div.appendChild(weatherBox);

            const extra = document.createElement('div');
            extra.style.cssText = 'margin-top:12px;display:flex;gap:12px;flex-wrap:wrap;';
            extra.innerHTML = `
                <div style="background:#fff;border-radius:var(--border-radius-md);padding:12px 20px;flex:1;text-align:center;">
                    <div style="font-size:1.6rem;color:var(--news-muted);">Kelembapan</div>
                    <div style="font-size:2.4rem;font-weight:700;color:var(--news-dark);">${d.humidity}</div>
                </div>
                <div style="background:#fff;border-radius:var(--border-radius-md);padding:12px 20px;flex:1;text-align:center;">
                    <div style="font-size:1.6rem;color:var(--news-muted);">Angin</div>
                    <div style="font-size:2.4rem;font-weight:700;color:var(--news-dark);">${d.wind}</div>
                </div>
            `;
            div.appendChild(extra);

            const ihsgTitle = document.createElement('h3');
            ihsgTitle.style.cssText = 'font-size:2rem;font-weight:700;color:var(--news-dark);margin-top:16px;';
            ihsgTitle.textContent = '📊 IHSG';
            div.appendChild(ihsgTitle);

            const stockList = document.createElement('div');
            stockList.className = 'stock-list';
            const stocks = [d.ihsg, d.dxy, d.gold];
            stocks.forEach(s => {
                const row = document.createElement('div');
                row.className = 'stock-row';
                row.innerHTML = `<span class="name">${s.label}</span><span class="val ${s.class || ''}">${s.value}</span>`;
                stockList.appendChild(row);
            });
            div.appendChild(stockList);
        } else if (panel.type === 'schedule') {
            const container = document.createElement('div');
            container.style.cssText = 'display:flex;flex-direction:column;gap:12px;';
            panel.data.forEach(item => {
                const row = document.createElement('div');
                row.style.cssText = 'background:#fff;border-radius:var(--border-radius-md);padding:18px 22px;display:flex;justify-content:space-between;align-items:center;';
                row.innerHTML = `
                    <span style="font-size:2rem;font-weight:600;color:var(--news-dark);">${item.event}</span>
                    <span style="font-size:1.8rem;color:var(--news-muted);">${item.time}</span>
                `;
                container.appendChild(row);
            });
            div.appendChild(container);
            if (panel.liveLink) {
                const linkBox = document.createElement('div');
                linkBox.style.cssText = 'margin-top:16px;padding:16px 20px;background:#fff;border-radius:var(--border-radius-md);text-align:center;font-size:2rem;color:var(--news-dark);font-weight:600;';
                linkBox.innerHTML = `📺 Live Streaming: <span style="color:var(--news-red-light);">${panel.liveLink}</span>`;
                div.appendChild(linkBox);
            }
        }
        middle.appendChild(div);
    });

    // Reset sidebar carousel
    if (sidebarIntervalId) clearInterval(sidebarIntervalId);
    startSidebarTimer();
}

function startSidebarTimer() {
    if (sidebarIntervalId) clearInterval(sidebarIntervalId);
    sidebarIntervalId = setInterval(() => {
        const panels = document.querySelectorAll('.right-panel');
        if (panels.length === 0) return;
        panels.forEach(p => p.classList.remove('active'));
        currentPanelIdx = (currentPanelIdx + 1) % panels.length;
        panels[currentPanelIdx].classList.add('active');
    }, 6000);
}

// --- 5. RENDER TICKER ---
function renderTicker(items) {
    const track = document.getElementById('marquee-track');
    if (!track) return;
    const doubled = [...items, ...items];
    track.innerHTML = doubled.map(text =>
        `<span class="m-item">${text}</span><span class="m-sep">✦</span>`
    ).join('');
}

// --- 6. DATA FETCH & UPDATE ---
let cachedData = null;

async function fetchNewsData() {
    try {
        const resp = await fetch(`./news-data.json?nocache=${Date.now()}`);
        if (!resp.ok) throw new Error('Network response was not ok');
        return await resp.json();
    } catch (e) {
        console.warn('Gagal mengambil data berita:', e);
        return null;
    }
}

async function updateContent() {
    const data = await fetchNewsData();
    if (!data) return;
    if (cachedData && data.version === cachedData.version) {
        // Versi sama, tidak perlu update
        return;
    }
    cachedData = data;
    renderSlides(data.slides);
    renderSidebar(data.sidebar);
    renderTicker(data.ticker);
    // Tampilkan toast
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = '📰 Berita diperbarui!';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
    console.log('[Update] Konten berita diperbarui ke versi', data.version);
}

// --- 7. SERVICE WORKER (opsional) ---
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('[SW] Registered'))
            .catch(err => console.warn('[SW Error]', err));
    }
}

// --- 8. INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    startClock();

    const initialData = await fetchNewsData();
    if (initialData) {
        cachedData = initialData;
        renderSlides(initialData.slides);
        renderSidebar(initialData.sidebar);
        renderTicker(initialData.ticker);
        startSlideTimer();
        startSidebarTimer();
    } else {
        // Jika gagal, jalankan timer kosong
        startSlideTimer();
        startSidebarTimer();
    }

    // Update otomatis setiap 30 detik
    setInterval(updateContent, 30000);

    registerSW();
});

// Ekspos fungsi untuk debugging
window.goToSlide = goToSlide;
window.updateContent = updateContent;