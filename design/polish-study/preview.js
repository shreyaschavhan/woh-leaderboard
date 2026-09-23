(function () {
    'use strict';

    const root = document.documentElement;
    const controls = document.querySelectorAll('[data-study-view]');
    const drawer = document.getElementById('drawer');
    const trainerButton = document.querySelector('.study-trainer');
    const query = new URLSearchParams(location.search);

    function setView(view) {
        root.dataset.polish = view;
        controls.forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.studyView === view));
        });
    }
    controls.forEach(button => {
        button.addEventListener('click', () => setView(button.dataset.studyView));
    });
    setView(root.dataset.polish === 'current' ? 'current' : 'concept');

    function syncDrawerControl() {
        const open = !drawer.hidden;
        trainerButton.textContent = open ? 'Dashboard ↗' : 'Trainer ↗';
        trainerButton.setAttribute('aria-expanded', String(open));
    }
    trainerButton.addEventListener('click', () => {
        if (drawer.hidden) document.querySelector('.podium-card.place-1').click();
        else drawer.querySelector('.drawer-close').click();
    });
    new MutationObserver(syncDrawerControl).observe(drawer, { attributes: true, attributeFilter: ['hidden'] });
    syncDrawerControl();

    // Start where the alignment and typography changes can be compared.
    // ?section=hero and ?section=trainer are optional direct review views.
    window.addEventListener('load', async () => {
        await document.fonts.ready;
        requestAnimationFrame(() => {
            if (query.get('section') !== 'hero') {
                const section = document.querySelector('.spotlights');
                window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY - 24);
            }
            if (query.get('section') === 'trainer') trainerButton.click();
            root.dataset.studyReady = 'true';
        });
    });
})();
