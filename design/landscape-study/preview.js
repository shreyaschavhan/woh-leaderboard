(function () {
    'use strict';

    const root = document.documentElement;
    const garden = document.querySelector('.garden');
    const ledge = garden.querySelector('.rear-ledge');
    const field = ledge.parentNode;
    const namespace = 'http://www.w3.org/2000/svg';
    let frame = 0;

    function group(parent, markup) {
        const node = document.createElementNS(namespace, 'g');
        node.setAttribute('class', 'pixel-landscape');
        node.setAttribute('aria-hidden', 'true');
        node.innerHTML = markup;
        parent.appendChild(node);
        return node;
    }

    group(garden.querySelector('.hills'), `
        <path class="pixel-hill" d="M-80 336V328H-48V320H0V312H48V304H96V296H144V288H216V296H272V304H328V312H384V320H424V336Z"/>
        <path class="pixel-hill-near" d="M296 344V328H344V320H392V312H448V304H504V296H560V288H656V296H728V304H792V312H856V320H912V328H944V344Z"/>
        <path class="pixel-hill" d="M712 344V328H752V320H800V312H856V304H904V296H968V304H1024V312H1080V320H1128V328H1152V344Z"/>
    `);

    group(garden.querySelector('.pond'), `
        <path class="pixel-pond-rim" d="M84 340H152V344H176V348H184V352H172V356H152V360H88V356H68V352H60V348H68V344H84Z"/>
        <path class="pixel-pond-water" d="M92 344H148V348H172V352H148V356H92V352H72V348H92Z"/>
        <path class="pixel-pond-shade" d="M140 352H172V356H148V360H92V356H140Z"/>
        <path class="pixel-pond-glint" d="M96 344H116V346H96Z M124 348H132V350H124Z"/>
    `);

    const meadow = group(field, `
        <defs><clipPath id="landscape-meadow-clip"><path/></clipPath></defs>
        <path class="pixel-meadow"/>
        <g clip-path="url(#landscape-meadow-clip)">
            <path class="pixel-meadow-shade"/>
            <path class="pixel-meadow-grass"/>
            <path class="pixel-meadow-edge"/>
        </g>
    `);

    function path(points) {
        return points.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(3)},${point[1].toFixed(3)}`).join(' ') + 'Z';
    }

    function composeLandscape() {
        if (!ledge.getAttribute('d')) return;
        const matrix = garden.getScreenCTM();
        if (!matrix || !matrix.a) return;
        const left = ledge.getPointAtLength(0);
        const right = ledge.getPointAtLength(ledge.getTotalLength());
        const unit = 1 / matrix.a;
        const narrow = innerWidth <= 760;
        const grid = (narrow ? 4 : 8) * unit;
        const bottom = 400;
        const depth = bottom - left.y;
        const snap = value => Math.round(value / grid) * grid;
        const offsets = [24, 48, 72, 104, 136, 168, 200, 224, 240];
        const levels = [.03, .06, .12, .2, .32, .46, .64, .82, 1];

        function slope(start, direction) {
            const points = [[start.x, start.y]];
            let y = start.y;
            offsets.forEach((offset, index) => {
                const x = start.x + direction * snap(offset * unit * (narrow ? .3 : 1));
                points.push([x, y]);
                y = index === offsets.length - 1 ? bottom : start.y + snap(depth * levels[index]);
                points.push([x, y]);
            });
            return points;
        }

        const ridge = slope(left, -1).reverse().concat(slope(right, 1));
        const outline = path(ridge);
        meadow.querySelector('.pixel-meadow').setAttribute('d', outline);
        meadow.querySelector('clipPath path').setAttribute('d', outline);
        meadow.querySelector('.pixel-meadow-edge').setAttribute('d', path(
            ridge.concat(ridge.slice().reverse().map(([x, y]) => [x, y + 3 * unit]))
        ));

        const width = right.x - left.x;
        const shelf = left.y + snap(depth * .48);
        meadow.querySelector('.pixel-meadow-shade').setAttribute('d', path([
            [left.x - 240 * unit, shelf + grid * 4],
            [left.x + width * .12, shelf + grid * 4],
            [left.x + width * .12, shelf + grid * 2],
            [left.x + width * .3, shelf + grid * 2],
            [left.x + width * .3, shelf],
            [left.x + width * .58, shelf],
            [left.x + width * .58, shelf + grid],
            [left.x + width * .76, shelf + grid],
            [left.x + width * .76, shelf + grid * 3],
            [right.x + 240 * unit, shelf + grid * 3],
            [right.x + 240 * unit, bottom],
            [left.x - 240 * unit, bottom]
        ]));

        const grass = [[.12, 24], [.42, 42], [.79, 28]].map(([fraction, offset]) => {
            const x = left.x + snap(width * fraction);
            const y = left.y + snap(offset * unit);
            return `M${x},${y}h${8 * unit}v${2 * unit}h${-8 * unit}Z M${x + 12 * unit},${y - 4 * unit}h${4 * unit}v${4 * unit}h${-4 * unit}Z`;
        }).join(' ');
        meadow.querySelector('.pixel-meadow-grass').setAttribute('d', grass);
        root.dataset.landscapeWidth = String(innerWidth);
        root.dataset.landscapeReady = 'true';
    }

    function schedule() {
        root.dataset.landscapeReady = 'false';
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(composeLandscape);
    }
    // Follow the baseline's responsive planting line; flowers and trainer sources stay intact.
    new MutationObserver(schedule).observe(ledge, { attributes: true, attributeFilter: ['d'] });
    new MutationObserver(schedule).observe(garden, { attributes: true, attributeFilter: ['viewBox'] });
    addEventListener('resize', schedule);
    document.fonts.ready.then(schedule);

    const controls = document.querySelectorAll('[data-study-view]');
    function setView(view) {
        root.dataset.landscape = view;
        controls.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.studyView === view)));
    }
    controls.forEach(button => button.addEventListener('click', () => setView(button.dataset.studyView)));
    setView(root.dataset.landscape);
    schedule();
})();
