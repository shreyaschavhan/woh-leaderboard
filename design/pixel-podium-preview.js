// Review controls for the mockup only; production assets are left untouched.
(function () {
    const sheet = document.getElementById('podium-concept');
    const controls = document.querySelectorAll('[data-podium-view]');
    controls.forEach(function (button) {
        button.addEventListener('click', function () {
            const original = button.dataset.podiumView === 'original';
            sheet.disabled = original;
            controls.forEach(function (control) {
                control.setAttribute('aria-pressed', String(control === button));
            });
        });
    });
})();
