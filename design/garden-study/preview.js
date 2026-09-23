(function () {
    'use strict';

    const sheet = document.getElementById('garden-concept');
    const garden = document.querySelector('.garden');
    const hero = document.getElementById('hero');
    const flowers = Array.from(garden.querySelectorAll('.flower'));
    const originals = flowers.map(flower => flower.getAttribute('transform'));
    const line = garden.querySelector('.line75');
    const lineOriginal = line ? line.innerHTML : '';
    const svgNS = 'http://www.w3.org/2000/svg';
    const field = document.createElementNS(svgNS, 'g');
    field.setAttribute('aria-hidden', 'true');
    field.innerHTML = '<defs><linearGradient id="study-meadow-shade" x1="0" y1="0" x2="0" y2="1"><stop class="meadow-top" offset="0"/><stop class="meadow-bottom" offset="1"/></linearGradient></defs><path class="rear-meadow"/><path class="rear-ledge" vector-effect="non-scaling-stroke"/>';
    let concept = true;
    let scheduled = 0;

    function restoreScene() {
        flowers.forEach((flower, index) => flower.setAttribute('transform', originals[index]));
        field.remove();
        if (line) {
            line.innerHTML = lineOriginal;
            const mobileLabel = line.querySelector('.line75-m');
            if (innerWidth < 760 && mobileLabel) {
                mobileLabel.setAttribute('x', '262');
                mobileLabel.setAttribute('text-anchor', 'start');
            }
        }
    }

    function composeScene() {
        if (!concept) return;
        const heroBox = hero.getBoundingClientRect();
        const matrix = garden.getScreenCTM();
        if (!matrix || !matrix.a) return;
        const inverse = matrix.inverse();
        const point = (x, y) => new DOMPoint(heroBox.left + x, heroBox.top + y).matrixTransform(inverse);
        const narrow = innerWidth <= 760;
        const copy = document.querySelector('.hero-copy').getBoundingClientRect();
        const characters = Array.from(document.querySelectorAll('.podium-avatars'));
        const podiumTop = document.querySelector('.podium').getBoundingClientRect().top;
        const silhouetteTop = podiumTop + Math.min(...characters.map(el =>
            el.closest('.podium-card').offsetTop + el.offsetTop)) - heroBox.top;
        const plantingY = silhouetteTop - 24;
        const maxStem = narrow ? Math.min(106, (plantingY - (copy.bottom - heroBox.top) - 24) / 1.18) : 176;
        const pixelUnit = maxStem / 230;
        const scale = pixelUnit / matrix.a;
        const startX = narrow ? 26 : Math.max(copy.right - heroBox.left + 56, heroBox.width * 0.42);
        const endX = heroBox.width - (narrow ? 26 : 56);
        const span = endX - startX;
        const active = flowers.filter(el => Number(el.dataset.flowers) > 0);
        const seedlings = flowers.filter(el => Number(el.dataset.flowers) <= 0);
        const slots = [0.5, 0.29, 0.71, 0.08, 0.92, 0.18, 0.82, 0.39, 0.61, 0.02, 0.98, 0.47];

        active.forEach((flower, index) => {
            const slot = slots[index] ?? ((index * 0.61803398875) % 1);
            const p = point(startX + slot * span, plantingY);
            flower.setAttribute('transform', `translate(${p.x.toFixed(3)},${p.y.toFixed(3)}) scale(${scale.toFixed(6)})`);
        });
        seedlings.forEach((flower, index) => {
            const x = startX + (index + 0.5) / seedlings.length * span;
            const p = point(x, plantingY + (index % 2 ? 3 : 0));
            flower.setAttribute('transform', `translate(${p.x.toFixed(3)},${p.y.toFixed(3)}) scale(${scale.toFixed(6)})`);
        });

        garden.style.setProperty('--scene-count-size', `${(narrow ? 11 : 13) / pixelUnit}px`);
        garden.style.setProperty('--scene-line-size', `${10 / matrix.a}px`);
        const left = point(startX, plantingY + 2);
        const right = point(endX, plantingY + 2);
        const step = 8 / matrix.a;
        const x0 = left.x, x1 = right.x, y = left.y;
        field.querySelector('.rear-meadow').setAttribute('d',
            `M${x0 - step * 30},400Q${x0 - step * 15},${y + step * 2} ${x0},${y}H${x1}Q${x1 + step * 15},${y + step * 2} ${x1 + step * 30},400Z`);
        field.querySelector('.rear-ledge').setAttribute('d', `M${x0},${y}H${x1}`);
        garden.insertBefore(field, garden.firstChild);

        if (line) {
            const maxFlowers = Math.max(...flowers.map(el => Number(el.dataset.flowers)));
            const threshold = point(0, plantingY - (22 + 75 / maxFlowers * 208) * pixelUnit).y;
            const rule = line.querySelector('line');
            rule.setAttribute('x1', left.x);
            rule.setAttribute('x2', right.x);
            rule.setAttribute('y1', threshold);
            rule.setAttribute('y2', threshold);
            line.querySelectorAll('text').forEach(label => {
                const mobile = label.classList.contains('line75-m');
                label.setAttribute('x', mobile ? left.x : right.x);
                label.setAttribute('y', threshold - 6 / matrix.a);
                label.setAttribute('text-anchor', mobile ? 'start' : 'end');
            });
        }
    }

    function schedule() {
        cancelAnimationFrame(scheduled);
        scheduled = requestAnimationFrame(composeScene);
    }

    document.querySelectorAll('[data-study-view]').forEach(button => {
        button.addEventListener('click', () => {
            concept = button.dataset.studyView === 'concept';
            sheet.disabled = !concept;
            document.querySelectorAll('[data-study-view]').forEach(control => {
                control.setAttribute('aria-pressed', String(control === button));
            });
            if (concept) schedule(); else restoreScene();
        });
    });
    addEventListener('resize', schedule);
    document.fonts.ready.then(schedule);
    if (new URLSearchParams(location.search).get('view') === 'current') {
        document.querySelector('[data-study-view="current"]').click();
    }
    schedule();
})();
