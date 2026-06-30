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
                <div class="slide-image"><img src="${slide.image}" alt="${slide.title}"></div>
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