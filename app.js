/* ═══════════════════════════════════════════════
   4K SIGNAGE — KURS & SAHAM
   Sumber data :
     - Kurs  : open.er-api.com (gratis, no key)
     - Saham : query1.finance.yahoo.com via
               allorigins.win CORS proxy
   ═══════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────
   KONFIGURASI — edit sesuai kebutuhan
───────────────────────────────────────*/
const CONFIG = {
    // Interval refresh data (ms)
    refreshKurs  : 5  * 60 * 1000,   // 5 menit
    refreshSaham : 3  * 60 * 1000,   // 3 menit
    cekVersi     : 60 * 1000,        // 60 detik

    // Mata uang yang ditampilkan (terhadap IDR)
    kurs: [
        { code: 'USD', flag: '🇺🇸', name: 'Dolar Amerika'  },
        { code: 'EUR', flag: '🇪🇺', name: 'Euro'           },
        { code: 'GBP', flag: '🇬🇧', name: 'Poundsterling'  },
        { code: 'JPY', flag: '🇯🇵', name: 'Yen Jepang'     },
        { code: 'SGD', flag: '🇸🇬', name: 'Dolar Singapura'},
        { code: 'SAR', flag: '🇸🇦', name: 'Riyal Saudi'    },
        { code: 'CNY', flag: '🇨🇳', name: 'Yuan China'     },
    ],

    // Saham IDX
    saham: [
        { ticker: 'BBCA.JK', nama: 'Bank BCA'     },
        { ticker: 'BBRI.JK', nama: 'Bank BRI'     },
        { ticker: 'TLKM.JK', nama: 'Telkom'       },
        { ticker: 'ASII.JK', nama: 'Astra Intl'   },
        { ticker: 'GOTO.JK', nama: 'GoTo Group'   },
    ],
};

/* ─────────────────────────────────────
   STATE
───────────────────────────────────────*/
const state = {
    kurs  : {},   // { USD: { rate, prev }, ... }
    saham : {},   // { 'BBCA.JK': { harga, change, pct, vol }, ... }
    lastUpdateKurs  : null,
    lastUpdateSaham : null,
    versiAktif : null,
};

/* ─────────────────────────────────────
   1. SCALE TO FIT VIEWPORT
───────────────────────────────────────*/
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

/* ─────────────────────────────────────
   2. JAM & TANGGAL REAL-TIME
───────────────────────────────────────*/
const HARI  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('jam-tv').textContent = `${h}:${m}:${s}`;
    document.getElementById('tanggal-tv').textContent =
        `${HARI[now.getDay()]}, ${now.getDate()} ${BULAN[now.getMonth()]} ${now.getFullYear()}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ─────────────────────────────────────
   3. FETCH KURS (open.er-api.com → IDR)
───────────────────────────────────────*/
async function fetchKurs() {
    try {
        const url = `https://open.er-api.com/v6/latest/IDR`;
        const res  = await fetch(url);
        const data = await res.json();

        if (data.result !== 'success') throw new Error('API error');

        // rates dari IDR ke mata uang lain → balik jadi IDR per 1 unit
        CONFIG.kurs.forEach(({ code }) => {
            const rateRaw = data.rates[code]; // IDR per 1 unit = 1/rateRaw
            const idrPer1 = rateRaw ? (1 / rateRaw) : null;
            const prev    = state.kurs[code]?.rate ?? idrPer1;
            state.kurs[code] = { rate: idrPer1, prev };
        });

        state.lastUpdateKurs = new Date();
        renderKurs();
        renderMarquee();
        updateFooterTime();

    } catch (err) {
        console.warn('[Kurs] Gagal fetch:', err);
    }
}

/* ─────────────────────────────────────
   4. FETCH SAHAM (Yahoo Finance via allorigins)
───────────────────────────────────────*/
async function fetchSahamSingle(ticker) {
    const yUrl  = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=2d`;
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(yUrl)}`;

    const res  = await fetch(proxy);
    const json = await res.json();
    const raw  = JSON.parse(json.contents);

    const meta   = raw.chart.result[0].meta;
    const harga  = meta.regularMarketPrice ?? 0;
    const prev   = meta.previousClose ?? harga;
    const change = harga - prev;
    const pct    = prev ? (change / prev) * 100 : 0;
    const vol    = meta.regularMarketVolume ?? 0;

    return { harga, change, pct, vol };
}

async function fetchSemuaSaham() {
    const tasks = CONFIG.saham.map(async ({ ticker }) => {
        try {
            const data = await fetchSahamSingle(ticker);
            state.saham[ticker] = data;
        } catch (err) {
            console.warn(`[Saham] Gagal fetch ${ticker}:`, err);
            // Pertahankan data lama jika ada
        }
    });

    await Promise.allSettled(tasks);
    state.lastUpdateSaham = new Date();
    renderSaham();
    renderMarquee();
    updateFooterTime();
}

/* ─────────────────────────────────────
   5. RENDER KURS
───────────────────────────────────────*/
function formatIDR(angka) {
    if (!angka) return '—';
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(angka);
}

function renderKurs() {
    CONFIG.kurs.forEach(({ code, flag, name }) => {
        const card = document.querySelector(`.kurs-card[data-code="${code}"]`);
        if (!card) return;

        const { rate, prev } = state.kurs[code] ?? {};
        if (!rate) return;

        const diff = rate - (prev ?? rate);
        const pct  = prev ? (diff / prev) * 100 : 0;
        const cls  = diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'flat';
        const arrow = diff > 0.5 ? '▲' : diff < -0.5 ? '▼' : '–';

        card.querySelector('.kurs-rate').innerHTML =
            `<span class="unit">Rp</span> ${formatIDR(rate)}`;
        const chEl = card.querySelector('.kurs-change');
        chEl.textContent = `${arrow} ${Math.abs(pct).toFixed(2)}%`;
        chEl.className   = `kurs-change ${cls}`;
    });
}

/* ─────────────────────────────────────
   6. RENDER SAHAM
───────────────────────────────────────*/
function formatVol(n) {
    if (!n) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
}

function renderSaham() {
    CONFIG.saham.forEach(({ ticker }) => {
        const card = document.querySelector(`.saham-card[data-ticker="${ticker}"]`);
        if (!card) return;

        const d = state.saham[ticker];
        if (!d) return;

        const cls   = d.change > 0 ? 'up' : d.change < 0 ? 'down' : 'flat';
        const arrow = d.change > 0 ? '▲' : d.change < 0 ? '▼' : '–';

        card.querySelector('.saham-harga').textContent = formatIDR(d.harga);
        const chEl = card.querySelector('.saham-change');
        chEl.textContent = `${arrow} ${Math.abs(d.pct).toFixed(2)}%`;
        chEl.className   = `saham-change ${cls}`;
        card.querySelector('.saham-vol').textContent = `Vol: ${formatVol(d.vol)}`;
    });
}

/* ─────────────────────────────────────
   7. RENDER MARQUEE (running text)
───────────────────────────────────────*/
function renderMarquee() {
    const items = [];

    // Kurs
    CONFIG.kurs.forEach(({ code, flag }) => {
        const d = state.kurs[code];
        if (!d?.rate) return;
        const diff  = d.rate - (d.prev ?? d.rate);
        const cls   = diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : '';
        const arrow = diff > 0.5 ? '▲' : diff < -0.5 ? '▼' : '–';
        items.push(`
            <span class="m-item">
                ${flag} <span class="ticker">${code}/IDR</span>
                <span class="harga">Rp ${formatIDR(d.rate)}</span>
                <span class="${cls}">${arrow}</span>
            </span>
            <span class="m-sep">│</span>
        `);
    });

    // Saham
    CONFIG.saham.forEach(({ ticker, nama }) => {
        const d = state.saham[ticker];
        if (!d) return;
        const cls   = d.change > 0 ? 'up' : d.change < 0 ? 'down' : '';
        const arrow = d.change > 0 ? '▲' : d.change < 0 ? '▼' : '–';
        const tk    = ticker.replace('.JK', '');
        items.push(`
            <span class="m-item">
                📈 <span class="ticker">${tk}</span>
                <span class="harga">Rp ${formatIDR(d.harga)}</span>
                <span class="${cls}">${arrow} ${Math.abs(d.pct).toFixed(2)}%</span>
            </span>
            <span class="m-sep">│</span>
        `);
    });

    if (!items.length) return;

    // Duplikat untuk seamless loop
    const html = items.join('') + items.join('');
    document.getElementById('marquee-track').innerHTML = html;
}

/* ─────────────────────────────────────
   8. UPDATE FOOTER TIMESTAMP
───────────────────────────────────────*/
function updateFooterTime() {
    const now = new Date();
    const fmt = (d) => d
        ? `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
        : '—';
    document.getElementById('last-update').textContent =
        `Update: Kurs ${fmt(state.lastUpdateKurs)} · Saham ${fmt(state.lastUpdateSaham)} WIB`;
}

/* ─────────────────────────────────────
   9. SERVICE WORKER
───────────────────────────────────────*/
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('[SW] Registered'))
        .catch(e  => console.warn('[SW] Error:', e));
}

/* ─────────────────────────────────────
   10. AUTO RELOAD (version.json)
───────────────────────────────────────*/
async function cekVersi() {
    try {
        const res  = await fetch(`./version.json?t=${Date.now()}`);
        const data = await res.json();
        if (state.versiAktif === null) {
            state.versiAktif = data.v;
        } else if (data.v !== state.versiAktif) {
            document.getElementById('toast').classList.add('show');
            setTimeout(() => location.reload(), 3000);
        }
    } catch (e) {
        console.warn('[Versi] Gagal cek:', e);
    }
}

/* ─────────────────────────────────────
   11. INIT
───────────────────────────────────────*/
async function init() {
    // Sembunyikan loading setelah data pertama masuk
    await Promise.allSettled([fetchKurs(), fetchSemuaSaham()]);
    document.getElementById('loading').classList.add('hidden');

    // Jadwal refresh otomatis
    setInterval(fetchKurs,       CONFIG.refreshKurs);
    setInterval(fetchSemuaSaham, CONFIG.refreshSaham);
    setInterval(cekVersi,        CONFIG.cekVersi);
    cekVersi();
}

init();