(function () {
    'use strict';
    const root = document.documentElement;
    const controls = document.querySelectorAll('[data-study-view]');

    function setView(view) {
        root.dataset.desktop = view;
        controls.forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.studyView === view));
        });
        // The garden derives its bounds from the same frame as the title.
        window.dispatchEvent(new Event('resize'));
    }
    controls.forEach(button => {
        button.addEventListener('click', () => setView(button.dataset.studyView));
    });
    setView(root.dataset.desktop === 'current' ? 'current' : 'concept');

    window.addEventListener('load', async () => {
        await document.fonts.ready;
        window.scrollTo(0, 0);
        window.dispatchEvent(new Event('resize'));
        requestAnimationFrame(() => requestAnimationFrame(() => {
            root.dataset.studyReady = 'true';
        }));
    });
})();
