(function () {
    'use strict';

    const sheet = document.getElementById('avatar-concept');
    const controls = document.querySelectorAll('[data-study-view]');
    function setView(view) {
        sheet.disabled = view === 'current';
        controls.forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.studyView === view));
        });
    }
    controls.forEach(button => {
        button.addEventListener('click', () => setView(button.dataset.studyView));
    });
    const params = new URLSearchParams(location.search);
    setView(params.get('view') === 'current' ? 'current' : 'concept');

    // Open at the portraits so the change is immediately visible.
    document.fonts.ready.then(() => {
        requestAnimationFrame(() => {
            const standings = document.getElementById('standings');
            window.scrollTo({ top: window.scrollY + standings.getBoundingClientRect().top - 24, behavior: 'instant' });
        });
    });
})();
