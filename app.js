/* ═══════════════════════════════════════════════
   ABS ANEKA BUAH SEGAR — DIGITAL SIGNAGE core
   ═══════════════════════════════════════════════ */
'use strict';

/**
 * 1. DYNAMIC SCREEN SCALING CONFIG
 * Mengunci rasio dasar 3840x2160 agar tidak pecah di TV besar
 */
const configureSignageScale = () => {
    const rootElement = document.getElementById('signage-root');
    if (!rootElement) return;

    const baseWidth = 3840;
    const baseHeight = 2160;
    
    const scaleFactorX = window.innerWidth / baseWidth;
    const scaleFactorY = window.innerHeight / baseHeight;
    const finalScale = Math.min(scaleFactorX, scaleFactorY);
    
    rootElement.style.transform = `scale(${finalScale})`;
    rootElement.style.marginLeft = `${(window.innerWidth - baseWidth * finalScale) / 2}px`;
    rootElement.style.marginTop = `${(window.innerHeight - baseHeight * finalScale) / 2}px`;
};

window.addEventListener('resize', configureSignageScale);
document.addEventListener('DOMContentLoaded', configureSignageScale);

/**
 * 2. CLOCK & CALENDAR ENGINE
 */
const startLiveClock = () => {
    const daysName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthsName = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const clockDisplay = document.getElementById('jam-tv');
    const dateDisplay = document.getElementById('tanggal-tv');

    setInterval(() => {
        const timestamp = new Date();
        const hours = String(timestamp.getHours()).padStart(2, '0');
        const minutes = String(timestamp.getMinutes()).padStart(2, '0');
        const seconds = String(timestamp.getSeconds()).padStart(2, '0');

        if (clockDisplay) clockDisplay.textContent = `${hours}:${minutes}:${seconds}`;
        if (dateDisplay) {
            dateDisplay.textContent = `${daysName[timestamp.getDay()]}, ${timestamp.getDate()} ${monthsName[timestamp.getMonth()]} ${timestamp.getFullYear()}`;
        }
    }, 1000);
};

/**
 * 3. MAIN SLIDESHOW CONTROLLER (LEFT PANEL)
 */
const initializeMainSlideshow = (intervalDuration = 8000) => {
    const activeSlides = document.querySelectorAll('.slide');
    const activeDots = document.querySelectorAll('.dot');
    let currentActiveIndex = 0;

    if (activeSlides.length === 0) return;

    const displayTargetSlide = (targetIndex) => {
        activeSlides[currentActiveIndex].classList.remove('active');
        activeDots[currentActiveIndex]?.classList.remove('active');

        currentActiveIndex = (targetIndex + activeSlides.length) % activeSlides.length;

        activeSlides[currentActiveIndex].classList.add('active');
        activeDots[currentActiveIndex]?.classList.add('active');
    };

    activeDots.forEach((dotTrigger, index) => {
        dotTrigger.addEventListener('click', () => displayTargetSlide(index));
    });

    setInterval(() => {
        displayTargetSlide(currentActiveIndex + 1);
    }, intervalDuration);

    displayTargetSlide(0);
};

/**
 * 4. SIDEBAR ROTATING INFO CONTROLLER (RIGHT PANEL)
 */
const initializeSidebarCarousel = (intervalDuration = 6000) => {
    const microPanels = document.querySelectorAll('.right-panel');
    let currentPanelIndex = 0;

    if (microPanels.length === 0) return;

    const rotationEngine = () => {
        microPanels[currentPanelIndex].classList.remove('active');
        currentPanelIndex = (currentPanelIndex + 1) % microPanels.length;
        microPanels[currentPanelIndex].classList.add('active');
    };

    microPanels[0].classList.add('active');
    setInterval(rotationEngine, intervalDuration);
};

/**
 * 5. PWA SERVICE WORKER REGISTRATION
 */
const deployServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('[System SW] Sync Completed.'))
            .catch(error => console.warn('[System SW Error]', error));
    }
};

/**
 * 6. ASYNC LIVE DATA VERSION CONTROL & AUTO-RELOAD
 */
const trackApplicationVersion = (checkInterval = 60000) => {
    let internalVersionSignature = null;

    const requestVersionPayload = async () => {
        try {
            const response = await fetch(`./version.json?nocache=${Date.now()}`);
            const data = await response.json();

            if (internalVersionSignature === null) {
                internalVersionSignature = data.v;
                return;
            }

            if (data.v !== internalVersionSignature) {
                const toastNotification = document.getElementById('toast');
                toastNotification?.classList.add('show');
                setTimeout(() => location.reload(), 3000);
            }
        } catch (error) {
            console.warn('[Version Control Hub]', error);
        }
    };

    setInterval(requestVersionPayload, checkInterval);
    requestVersionPayload();
};

// Orchestrator Execution
document.addEventListener('DOMContentLoaded', () => {
    startLiveClock();
    initializeMainSlideshow(8000);
    initializeSidebarCarousel(6000);
    deployServiceWorker();
    trackApplicationVersion(60000);
});
