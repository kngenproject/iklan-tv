/* ═══════════════════════════════════════════════
   TOKO BUAH ABS — Market Dashboard
   Render data pasar saham buah
   ═══════════════════════════════════════════════ */
'use strict';

// --- SCALING ---
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

// --- CLOCK ---
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

// --- RENDER CHART ---
function renderChart(chartData) {
    const container = document.getElementById('fruit-chart');
    if (!container) return;
    container.innerHTML = '';
    const max = Math.max(...chartData.map(d => d.value));
    chartData.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-wrapper';
        const percent = (item.value / max) * 100;
        const barHeight = Math.max(30, (percent / 100) * 280);
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = barHeight + 'px';
        bar.innerHTML = `<span class="bar-value">${item.value}</span>`;
        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = item.label;
        wrapper.appendChild(bar);
        wrapper.appendChild(label);
        container.appendChild(wrapper);
    });
}

// --- RENDER PRICE TABLE ---
function renderPriceTable(fruits) {
    const tbody = document.getElementById('price-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    fruits.forEach(f => {
        const tr = document.createElement('tr');
        const changeNum = parseFloat(f.change);
        const changeClass = changeNum >= 0 ? 'up' : 'down';
        const changeSign = changeNum >= 0 ? '+' : '';
        tr.innerHTML = `
            <td><strong>${f.name}</strong></td>
            <td>Rp ${f.price}</td>
            <td class="change ${changeClass}">${changeSign}${f.change}%</td>
            <td class="volume">${f.volume}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- RENDER INDEX & SUMMARY ---
function renderMarketOverview(market) {
    document.getElementById('index-value').textContent = market.index.value;
    document.getElementById('index-change').textContent = market.index.change;
    document.getElementById('index-volume').textContent = `Vol ${market.index.volume}`;
    document.getElementById('top-gainer').textContent = market.topGainer;
    document.getElementById('top-loser').textContent = market.topLoser;
    document.getElementById('total-volume').textContent = market.totalVolume;
}

// --- RENDER TICKER ---
function renderTicker(items) {
    const track = document.getElementById('marquee-track');
    if (!track) return;
    const doubled = [...items, ...items];
    track.innerHTML = doubled.map(text =>
        `<span class="m-item">${text}</span><span class="m-sep">✦</span>`
    ).join('');
}

// --- DATA FETCH ---
let cachedData = null;

async function fetchMarketData() {
    try {
        const resp = await fetch(`./news-data.json?nocache=${Date.now()}`);
        if (!resp.ok) throw new Error('Network error');
        return await resp.json();
    } catch (e) {
        console.warn('Gagal mengambil data:', e);
        return null;
    }
}

async function updateContent() {
    const data = await fetchMarketData();
    if (!data) return;
    if (cachedData && data.version === cachedData.version) return;
    cachedData = data;
    const market = data.market;
    renderMarketOverview(market);
    renderChart(market.chart);
    renderPriceTable(market.fruits);
    renderTicker(data.ticker);
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = '📊 Market update!';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
    console.log('[Update] Data market versi', data.version);
}

// --- SERVICE WORKER ---
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('[SW] Registered'))
            .catch(err => console.warn('[SW Error]', err));
    }
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    startClock();
    const data = await fetchMarketData();
    if (data) {
        cachedData = data;
        const market = data.market;
        renderMarketOverview(market);
        renderChart(market.chart);
        renderPriceTable(market.fruits);
        renderTicker(data.ticker);
    }
    setInterval(updateContent, 30000);
    registerSW();
});