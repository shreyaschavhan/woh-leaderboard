(function () {
    'use strict';

    const root = document.documentElement;
    const controls = document.querySelectorAll('[data-study-view]');
    function setView(view) {
        root.dataset.gold = view;
        controls.forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.studyView === view));
        });
    }
    controls.forEach(button => {
        button.addEventListener('click', () => setView(button.dataset.studyView));
    });
    setView(root.dataset.gold === 'current' ? 'current' : 'concept');
})();
