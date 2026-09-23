// Leaderboard interactions: theme, sky, intro, parallax, garden, drawer, table.
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(pointer: fine)').matches;

    function store(key, value, session) {
        try {
            var s = session ? sessionStorage : localStorage;
            if (value === null) s.removeItem(key);
            else s.setItem(key, value);
        } catch (e) {}
    }

    function read(key, session) {
        try { return (session ? sessionStorage : localStorage).getItem(key); } catch (e) { return null; }
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    // ---- Theme -------------------------------------------------------------
    var root = document.documentElement;
    var themeToggle = document.getElementById('theme-toggle');

    function currentTheme() {
        var explicit = root.getAttribute('data-theme');
        if (explicit) return explicit;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            var next = currentTheme() === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            store('woh-theme', next);
        });
    }

    // ---- Sky ----------------------------------------------------------------
    var hero = document.getElementById('hero');
    var SKIES = ['dawn', 'day', 'dusk', 'night'];
    var skyToggle = document.getElementById('sky-toggle');

    function skyForNow() {
        var hour = new Date().getHours();
        return hour >= 5 && hour < 8 ? 'dawn' : hour >= 8 && hour < 17 ? 'day' : hour >= 17 && hour < 20 ? 'dusk' : 'night';
    }

    function setSky(name) {
        if (!hero) return;
        SKIES.forEach(function (s) { hero.classList.remove('sky-' + s); });
        hero.classList.add('sky-' + name);
        if (skyToggle) {
            skyToggle.setAttribute('aria-label', 'Sky: ' + name + '. Click to change.');
            skyToggle.setAttribute('data-sky', name);
            var label = skyToggle.querySelector('.sky-label');
            if (label) label.textContent = name;
        }
        var drawerHero = document.querySelector('.drawer-hero');
        if (drawerHero) {
            SKIES.forEach(function (s) { drawerHero.classList.remove('sky-' + s); });
            drawerHero.classList.add('sky-' + name);
        }
    }

    var sky = read('woh-sky') || skyForNow();
    if (SKIES.indexOf(sky) === -1) sky = skyForNow();
    setSky(sky);

    if (skyToggle) {
        skyToggle.addEventListener('click', function () {
            sky = SKIES[(SKIES.indexOf(sky) + 1) % SKIES.length];
            setSky(sky);
            store('woh-sky', sky);
        });
    }

    // ---- Intro + petals ------------------------------------------------------
    if (hero) {
        hero.classList.add(reduceMotion ? 'no-intro' : 'intro');
        var petals = document.getElementById('petals');
        if (petals && !reduceMotion) {
            var colors = ['#ff6b8a', '#ffd166', '#c77dff', '#ff9f43', '#80ed99', '#ffadad'];
            for (var i = 0; i < 12; i++) {
                var p = document.createElement('i');
                p.style.left = (Math.random() * 100) + '%';
                p.style.setProperty('--dur', (9 + Math.random() * 8) + 's');
                p.style.setProperty('--delay', (-Math.random() * 16) + 's');
                p.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
                p.style.setProperty('--c', colors[i % colors.length]);
                p.style.setProperty('--size', (5 + Math.random() * 5) + 'px');
                petals.appendChild(p);
            }
        }
    }

    // ---- Parallax -------------------------------------------------------------
    if (hero && !reduceMotion) {
        var targetX = 0, targetY = 0, curX = 0, curY = 0, ticking = false;
        function render() {
            curX += (targetX - curX) * 0.08;
            curY += (targetY - curY) * 0.08;
            hero.style.setProperty('--px', curX.toFixed(3));
            hero.style.setProperty('--py', curY.toFixed(3));
            if (Math.abs(targetX - curX) > 0.001 || Math.abs(targetY - curY) > 0.001) requestAnimationFrame(render);
            else ticking = false;
        }
        function kick() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }
        if (finePointer) {
            hero.addEventListener('mousemove', function (e) {
                var r = hero.getBoundingClientRect();
                targetX = ((e.clientX - r.left) / r.width - 0.5) * 2;
                targetY = ((e.clientY - r.top) / r.height - 0.5) * 2;
                kick();
            });
            hero.addEventListener('mouseleave', function () { targetX = 0; targetY = 0; kick(); });
        }
        var copy = hero.querySelector('.hero-copy');
        window.addEventListener('scroll', function () {
            var y = window.scrollY;
            if (y > hero.offsetHeight) return;
            hero.style.setProperty('--scroll', y);
            if (copy) copy.style.opacity = Math.max(0, 1 - y / (hero.offsetHeight * 0.6));
        }, { passive: true });
    }

    // ---- Trainer data ----------------------------------------------------------
    var trainers = {};
    try {
        var dataEl = document.getElementById('trainer-data');
        if (dataEl) JSON.parse(dataEl.textContent).forEach(function (t) { trainers[t.id] = t; });
    } catch (e) {}

    // ---- Drawer (trainer card in place) ----------------------------------------
    var drawer = document.getElementById('drawer');
    var drawerBody = drawer && drawer.querySelector('.drawer-body');
    var lastFocus = null;

    function sparklineSvg(series, line) {
        var w = 320, h = 110, pad = 6;
        var vals = series.filter(function (v) { return v !== null; });
        var top = Math.max(line, Math.max.apply(null, vals.length ? vals : [0]), 1);
        var n = Math.max(series.length, 2);
        var x = function (i) { return pad + i * (w - 2 * pad) / (n - 1); };
        var y = function (v) { return h - pad - (v / top) * (h - 2 * pad); };
        var d = '', pen = false, first = null, last = null;
        series.forEach(function (v, i) {
            if (v === null) { pen = false; return; }
            d += (pen ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1) + ' ';
            pen = true;
            if (first === null) first = i;
            last = i;
        });
        var area = first === null ? '' : 'M' + x(first).toFixed(1) + ',' + h + ' ' + d.replace(/M/g, 'L') + 'L' + x(last).toFixed(1) + ',' + h + ' Z';
        var ly = y(line);
        return '<svg class="drawer-spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">' +
            '<defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity="0.35"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>' +
            '<path class="drawer-area" d="' + area + '"/>' +
            '<line class="drawer-line75" x1="0" x2="' + w + '" y1="' + ly.toFixed(1) + '" y2="' + ly.toFixed(1) + '"/>' +
            '<path class="drawer-path" d="' + d + '"/>' +
            (last !== null ? '<circle class="drawer-dot" cx="' + x(last).toFixed(1) + '" cy="' + y(series[last]).toFixed(1) + '" r="3.5"/>' : '') +
            '</svg>';
    }

    function changePill(rc) {
        if (rc === null || rc === undefined) return '<span class="pill pill-new">new</span>';
        if (rc > 0) return '<span class="pill pill-up">&#9650;' + rc + '</span>';
        if (rc < 0) return '<span class="pill pill-down">&#9660;' + Math.abs(rc) + '</span>';
        return '<span class="pill pill-flat">&#8212;</span>';
    }

    function gainText(g) {
        if (g === null || g === undefined) return '<span class="gain gain-none">&#8212;</span>';
        if (g > 0) return '<span class="gain gain-up">+' + g + '</span>';
        if (g < 0) return '<span class="gain gain-down">&minus;' + Math.abs(g) + '</span>';
        return '<span class="gain gain-flat">0</span>';
    }

    function toneClass(v) { return v === null || v === undefined || v === 0 ? 'tone-flat' : v > 0 ? 'tone-up' : 'tone-down'; }
    function signed(v) { return v === null || v === undefined ? '\u2014' : v > 0 ? '+' + v : v < 0 ? '\u2212' + Math.abs(v) : '0'; }
    function rankText(v) { return v === null || v === undefined ? 'new' : v > 0 ? '\u25B2' + v : v < 0 ? '\u25BC' + Math.abs(v) : 'held'; }

    function dateForOffset(t, offsetFromEnd) {
        var d = new Date(t.end + 'T00:00:00');
        d.setDate(d.getDate() - offsetFromEnd);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    function firstVal(series) {
        for (var i = 0; i < series.length; i++) if (series[i] !== null) return series[i];
        return '\u2014';
    }

    function peakLine(t) {
        var best = -1, bestIdx = -1;
        t.series30.forEach(function (v, i) { if (v !== null && v > best) { best = v; bestIdx = i; } });
        if (bestIdx < 0) return '';
        return 'Peak ' + best + ' on ' + dateForOffset(t, t.series30.length - 1 - bestIdx);
    }

    function barsHtml(series, line) {
        var vals = series.filter(function (v) { return v !== null; });
        var top = Math.max(line, Math.max.apply(null, vals.length ? vals : [0]), 1);
        var bars = series.map(function (v, i) {
            if (v === null) return '<span class="bar-slot"><span class="bar-empty"></span></span>';
            var h = Math.max(4, Math.round(v / top * 100));
            var cls = v >= line ? 'bar-above' : 'bar-below';
            return '<span class="bar-slot"><span class="bar-col ' + cls + '" style="height:' + h + '%" title="' + v + '"></span></span>';
        }).join('');
        return '<div class="bars" style="--line:' + Math.round(line / top * 100) + '%">' + bars + '</div>';
    }

    function openDrawer(id) {
        var t = trainers[id];
        if (!drawer || !drawerBody || !t) return false;
        var line = t.line || 75;
        var hours = (t.flowers * 20 / 60);
        var hoursText = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
        var vals = t.series30.filter(function (v) { return v !== null; });
        var peak = vals.length ? Math.max.apply(null, vals) : 0;
        drawerBody.innerHTML =
            '<div class="drawer-hero sky-' + escapeHtml(sky) + '">' +
                '<div class="drawer-avatars">' +
                    (t.avatar ? '<img src="' + escapeHtml(t.avatar) + '" alt="" class="trainer-avatar">' : '') +
                    (t.focumon ? '<img src="' + escapeHtml(t.focumon) + '" alt="" class="focumon-avatar">' : '') +
                '</div>' +
                '<div class="drawer-ident">' +
                    '<span class="drawer-rank">#' + t.rank + '<small> / ' + t.total + '</small></span>' +
                    '<h2 id="drawer-name">' + escapeHtml(t.name) + '</h2>' +
                    '<p class="drawer-title">' + escapeHtml(t.title) + '</p>' +
                '</div>' +
            '</div>' +
            '<div class="drawer-tiles">' +
                '<div class="drawer-tile"><span class="num">' + t.flowers + '</span><span class="label">flowers this week</span></div>' +
                '<div class="drawer-tile"><span class="num">' + hoursText + '</span><span class="label">hours of focus</span></div>' +
                '<div class="drawer-tile"><span class="num ' + toneClass(t.gain7) + '">' + signed(t.gain7) + '</span><span class="label">vs last week</span></div>' +
                '<div class="drawer-tile"><span class="num ' + toneClass(t.rank_change) + '">' + rankText(t.rank_change) + '</span><span class="label">rank, 7 days</span></div>' +
                '<div class="drawer-tile"><span class="num">' + t.above30 + '<small> / ' + t.days30 + '</small></span><span class="label">days above ' + line + '</span></div>' +
                '<div class="drawer-tile"><span class="num">' + peak + '</span><span class="label">30-day peak</span></div>' +
            '</div>' +
            '<div class="drawer-chart">' +
                '<div class="drawer-chart-head"><span>Last 30 days</span><span class="hint">dashed line is ' + line + '</span></div>' +
                sparklineSvg(t.series30, line) +
                '<div class="drawer-axis"><span>30d ago &middot; <b>' + firstVal(t.series30) + '</b></span><span>today &middot; <b>' + t.flowers + '</b></span></div>' +
            '</div>' +
            '<div class="drawer-chart">' +
                '<div class="drawer-chart-head"><span>Last 14 days</span><span class="hint">' + peakLine(t) + '</span></div>' +
                barsHtml(t.series30.slice(-14), line) +
                '<div class="drawer-axis"><span><i class="key key-below"></i>under ' + line + '</span><span><i class="key key-above"></i>' + line + ' and up</span></div>' +
            '</div>' +
            '<a class="drawer-link" href="users/user_' + encodeURIComponent(t.id) + '.html">Full history &rarr;</a>';
        lastFocus = document.activeElement;
        drawer.hidden = false;
        requestAnimationFrame(function () { drawer.classList.add('is-open'); });
        document.body.classList.add('drawer-open');
        var closeBtn = drawer.querySelector('.drawer-close');
        if (closeBtn) closeBtn.focus();
        return true;
    }

    function closeDrawer() {
        if (!drawer || drawer.hidden) return;
        drawer.classList.remove('is-open');
        document.body.classList.remove('drawer-open');
        setTimeout(function () { drawer.hidden = true; }, 260);
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    if (drawer) {
        drawer.addEventListener('click', function (e) {
            if (e.target.closest('.drawer-close') || e.target.classList.contains('drawer-backdrop')) closeDrawer();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeDrawer();
        });
    }

    // Podium blocks open the drawer; modified clicks still follow the link.
    Array.prototype.forEach.call(document.querySelectorAll('.podium-card[data-id]'), function (card) {
        card.addEventListener('click', function (e) {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            if (openDrawer(card.getAttribute('data-id'))) e.preventDefault();
        });
    });

    // ---- Garden composition + navigation -----------------------------------
    var tip = document.getElementById('garden-tip');
    var garden = document.querySelector('.garden');
    var gardenCopy = hero && hero.querySelector('.hero-copy');
    var gardenPodium = document.querySelector('.podium');
    var gardenFlowers = garden ? Array.prototype.slice.call(garden.querySelectorAll('.flower')) : [];
    var gardenCharacters = gardenPodium ? Array.prototype.slice.call(gardenPodium.querySelectorAll('.podium-avatars')) : [];
    var gardenLine = garden && garden.querySelector('.line75');
    var meadow = null;
    var gardenFrame = 0;

    if (garden && gardenCopy && gardenCharacters.length) {
        meadow = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        meadow.setAttribute('aria-hidden', 'true');
        meadow.innerHTML = '<defs><linearGradient id="garden-meadow-shade" x1="0" y1="0" x2="0" y2="1">' +
            '<stop class="meadow-top" offset="0"/><stop class="meadow-bottom" offset="1"/>' +
            '</linearGradient></defs><path class="rear-meadow"/>' +
            '<path class="rear-ledge" vector-effect="non-scaling-stroke"/>';
        garden.insertBefore(meadow, garden.firstChild);
    }

    function composeGarden() {
        if (!meadow) return;
        var matrix = garden.getScreenCTM();
        if (!matrix || !matrix.a) return;
        var heroBox = hero.getBoundingClientRect();
        var inverse = matrix.inverse();
        function point(x, y) {
            return new DOMPoint(heroBox.left + x, heroBox.top + y).matrixTransform(inverse);
        }

        var narrow = window.innerWidth <= 760;
        // Layout offsets keep the planting steady during intro, hover and scroll animations.
        var silhouetteTop = gardenPodium.getBoundingClientRect().top - heroBox.top +
            Math.min.apply(null, gardenCharacters.map(function (el) {
                return el.closest('.podium-card').offsetTop + el.offsetTop;
            }));
        var plantingY = silhouetteTop - 24;
        var copyBottom = gardenCopy.offsetTop + gardenCopy.offsetHeight;
        var maxStem = narrow ? Math.min(106, (plantingY - copyBottom - 24) / 1.18) : 176;
        var pixelUnit = Math.max(1, maxStem) / 230;
        var scale = pixelUnit / matrix.a;
        var startX = narrow ? 26 : Math.max(gardenCopy.offsetLeft + gardenCopy.offsetWidth + 56, heroBox.width * 0.42);
        var endX = heroBox.width - (narrow ? 26 : 56);
        var span = endX - startX;
        var active = gardenFlowers.filter(function (el) { return Number(el.dataset.flowers) > 0; });
        var seedlings = gardenFlowers.filter(function (el) { return Number(el.dataset.flowers) <= 0; });
        var slots = [0.5, 0.29, 0.71, 0.08, 0.92, 0.18, 0.82, 0.39, 0.61, 0.02, 0.98, 0.47];

        function place(flower, x, y) {
            var p = point(x, y);
            flower.setAttribute('transform', 'translate(' + p.x.toFixed(3) + ',' + p.y.toFixed(3) + ') scale(' + scale.toFixed(6) + ')');
        }
        active.forEach(function (flower, index) {
            var slot = index < slots.length ? slots[index] : (index * 0.61803398875) % 1;
            place(flower, startX + slot * span, plantingY);
        });
        seedlings.forEach(function (flower, index) {
            place(flower, startX + (index + 0.5) / seedlings.length * span, plantingY + (index % 2 ? 3 : 0));
        });

        garden.style.setProperty('--scene-count-size', (narrow ? 11 : 13) / pixelUnit + 'px');
        garden.style.setProperty('--scene-line-size', 10 / matrix.a + 'px');
        var left = point(startX, plantingY + 2);
        var right = point(endX, plantingY + 2);
        var step = 8 / matrix.a;
        meadow.querySelector('.rear-meadow').setAttribute('d',
            'M' + (left.x - step * 30) + ',400Q' + (left.x - step * 15) + ',' + (left.y + step * 2) + ' ' + left.x + ',' + left.y +
            'H' + right.x + 'Q' + (right.x + step * 15) + ',' + (left.y + step * 2) + ' ' + (right.x + step * 30) + ',400Z');
        meadow.querySelector('.rear-ledge').setAttribute('d', 'M' + left.x + ',' + left.y + 'H' + right.x);

        // Use the same height mapping as the generated flowers for the consistency line.
        var maxFlowers = Math.max.apply(null, gardenFlowers.map(function (el) { return Number(el.dataset.flowers); }));
        var rule = gardenLine && gardenLine.querySelector('line');
        if (rule && maxFlowers > 0) {
            var thresholdValue = parseFloat(gardenLine.textContent);
            var threshold = point(0, plantingY - (22 + thresholdValue / maxFlowers * 208) * pixelUnit).y;
            rule.setAttribute('x1', left.x);
            rule.setAttribute('x2', right.x);
            rule.setAttribute('y1', threshold);
            rule.setAttribute('y2', threshold);
            Array.prototype.forEach.call(gardenLine.querySelectorAll('text'), function (label) {
                var mobile = label.classList.contains('line75-m');
                label.setAttribute('x', mobile ? left.x : right.x);
                label.setAttribute('y', threshold - 6 / matrix.a);
                label.setAttribute('text-anchor', mobile ? 'start' : 'end');
            });
        }
    }

    function fitGarden() {
        if (!garden) return;
        garden.setAttribute('viewBox', window.innerWidth < 760 ? '250 0 500 400' : '0 0 1000 400');
        garden.setAttribute('preserveAspectRatio', 'xMidYMax meet');
        cancelAnimationFrame(gardenFrame);
        gardenFrame = requestAnimationFrame(composeGarden);
    }
    if (meadow) {
        fitGarden();
        window.addEventListener('resize', fitGarden);
        if (document.fonts) document.fonts.ready.then(fitGarden);
        if (window.ResizeObserver) {
            var gardenObserver = new ResizeObserver(fitGarden);
            gardenObserver.observe(hero);
            gardenObserver.observe(gardenCopy);
            gardenObserver.observe(gardenPodium);
        }
    }

    function showTip(el) {
        if (!tip || !hero) return;
        var name = el.getAttribute('data-name');
        var flowers = el.getAttribute('data-flowers');
        var rank = el.getAttribute('data-rank');
        tip.innerHTML = '<strong>' + escapeHtml(name) + '</strong><span>#' + rank + ' &middot; ' + flowers + ' flowers</span>';
        tip.hidden = false;
        var box = el.getBoundingClientRect();
        var heroBox = hero.getBoundingClientRect();
        var x = box.left + box.width / 2 - heroBox.left;
        var y = box.top - heroBox.top;
        tip.style.left = Math.max(60, Math.min(heroBox.width - 60, x)) + 'px';
        tip.style.top = Math.max(8, y - 10) + 'px';
    }

    function hideTip() { if (tip) tip.hidden = true; }

    var expandGroup = null; // wired up with the table below

    function jumpTo(id, focusRow) {
        var row = document.querySelector('.standings-table tr[data-id="' + id + '"]');
        if (!row) return;
        if (row.classList.contains('is-inactive') && expandGroup) expandGroup();
        row.hidden = false;
        row.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        row.classList.remove('is-flash');
        void row.offsetWidth;
        row.classList.add('is-flash');
        if (focusRow) {
            var link = row.querySelector('.player-link');
            if (link) link.focus({ preventScroll: true });
        }
    }

    function activate(id, viaKeyboard) {
        if (!openDrawer(id)) jumpTo(id, viaKeyboard);
    }

    if (garden) {
        garden.addEventListener('mouseover', function (e) {
            var el = e.target.closest('.flower, .wanderer');
            if (el) showTip(el);
        });
        garden.addEventListener('mouseout', function (e) {
            if (e.target.closest('.flower, .wanderer')) hideTip();
        });
        garden.addEventListener('focusin', function (e) {
            var el = e.target.closest('.flower, .wanderer');
            if (el) showTip(el);
        });
        garden.addEventListener('focusout', hideTip);
        garden.addEventListener('click', function (e) {
            var el = e.target.closest('.flower, .wanderer');
            if (el) activate(el.getAttribute('data-id'), false);
        });
        garden.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            var el = e.target.closest('.flower, .wanderer');
            if (el) { e.preventDefault(); activate(el.getAttribute('data-id'), true); }
        });
    }

    // ---- Count-up numbers ---------------------------------------------------
    function countUp(el, delay) {
        var raw = el.getAttribute('data-count');
        var target = parseFloat(raw);
        if (isNaN(target)) return;
        var decimals = (raw.split('.')[1] || '').length;
        var duration = 1100;
        var start = null;
        el.textContent = (0).toFixed(decimals);
        setTimeout(function () {
            function frame(ts) {
                if (start === null) start = ts;
                var p = Math.min(1, (ts - start) / duration);
                var eased = 1 - Math.pow(1 - p, 3);
                el.textContent = (target * eased).toFixed(decimals);
                if (p < 1) requestAnimationFrame(frame);
                else el.textContent = raw;
            }
            requestAnimationFrame(frame);
        }, delay);
    }

    if (!reduceMotion) {
        Array.prototype.forEach.call(document.querySelectorAll('.count[data-count]'), function (el) {
            countUp(el, el.closest('.podium-card') ? 1500 : 500);
        });
    }

    // ---- Petal burst on first place -----------------------------------------
    var winner = document.querySelector('.podium-card.place-1');
    if (winner && !reduceMotion) {
        var burstColors = ['#ff6b8a', '#ffd166', '#c77dff', '#ff9f43', '#4cc9f0', '#80ed99'];
        setTimeout(function () {
            var burst = document.createElement('span');
            burst.className = 'petal-burst';
            for (var i = 0; i < 28; i++) {
                var p = document.createElement('i');
                var angle = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.4;
                var dist = 90 + Math.random() * 120;
                p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
                p.style.setProperty('--ty', Math.sin(angle) * dist - 40 + 'px');
                p.style.setProperty('--rot', Math.round(Math.random() * 720 - 360) + 'deg');
                p.style.setProperty('--c', burstColors[i % burstColors.length]);
                p.style.setProperty('--delay', Math.random() * 120 + 'ms');
                burst.appendChild(p);
            }
            winner.appendChild(burst);
            setTimeout(function () { burst.remove(); }, 2200);
        }, 2100);
    }

    // ---- Standings table ----------------------------------------------------
    var table = document.getElementById('standings-table');
    var tbody = table && table.querySelector('tbody');
    if (!tbody) return;

    var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr:not(.line-row):not(.group-row)'));
    var lineRow = tbody.querySelector('.line-row');
    var groupRow = tbody.querySelector('.group-row');
    var groupToggle = groupRow && groupRow.querySelector('.group-toggle');
    var groupOpen = false;
    var search = document.getElementById('trainer-search');
    var empty = document.getElementById('search-empty');
    var jumpBtn = document.getElementById('jump-me');
    var sortKey = 'rank';
    var sortDir = 'asc';

    function applyFilter() {
        var query = search ? search.value.trim().toLowerCase() : '';
        var visible = 0;
        rows.forEach(function (row) {
            var match = !query || (row.getAttribute('data-name') || '').indexOf(query) !== -1;
            var collapsed = !query && !groupOpen && row.classList.contains('is-inactive');
            row.hidden = !match || collapsed;
            if (match) visible += 1;
        });
        if (lineRow) lineRow.hidden = !!query || sortKey !== 'rank' || sortDir !== 'asc';
        if (groupRow) groupRow.hidden = !!query;
        if (groupToggle) groupToggle.setAttribute('aria-expanded', groupOpen ? 'true' : 'false');
        if (empty) empty.hidden = visible !== 0;
    }

    function sortRows(key, dir) {
        sortKey = key;
        sortDir = dir;
        var sorted = rows.slice().sort(function (a, b) {
            var ai = a.classList.contains('is-inactive') ? 1 : 0;
            var bi = b.classList.contains('is-inactive') ? 1 : 0;
            if (ai !== bi) return ai - bi;
            var av, bv;
            if (key === 'name') {
                av = a.getAttribute('data-name'); bv = b.getAttribute('data-name');
                return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            }
            av = Number(a.getAttribute('data-' + key)); bv = Number(b.getAttribute('data-' + key));
            if (av === bv) return Number(a.getAttribute('data-rank')) - Number(b.getAttribute('data-rank'));
            return dir === 'asc' ? av - bv : bv - av;
        });
        var lineIndex = -1;
        if (key === 'rank' && dir === 'asc' && lineRow) {
            for (var i = 0; i < sorted.length; i++) {
                if (Number(sorted[i].getAttribute('data-flowers')) < 75) { lineIndex = i; break; }
            }
        }
        var groupPlaced = false;
        sorted.forEach(function (row, i) {
            if (i === lineIndex) tbody.appendChild(lineRow);
            if (groupRow && !groupPlaced && row.classList.contains('is-inactive')) { tbody.appendChild(groupRow); groupPlaced = true; }
            tbody.appendChild(row);
        });
        Array.prototype.forEach.call(table.querySelectorAll('th'), function (th) {
            var btn = th.querySelector('.sort');
            if (!btn) return;
            var active = btn.getAttribute('data-sort') === key;
            th.setAttribute('aria-sort', active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none');
            btn.classList.toggle('is-active', active);
        });
        applyFilter();
    }

    Array.prototype.forEach.call(table.querySelectorAll('.sort'), function (btn) {
        btn.addEventListener('click', function () {
            var key = btn.getAttribute('data-sort');
            var dir = key === sortKey ? (sortDir === 'asc' ? 'desc' : 'asc') : btn.getAttribute('data-dir');
            sortRows(key, dir);
        });
    });

    if (groupToggle) {
        groupToggle.addEventListener('click', function () {
            groupOpen = !groupOpen;
            applyFilter();
        });
    }

    tbody.addEventListener('click', function (event) {
        if (event.target.closest('button')) return;
        var row = event.target.closest('tr');
        if (!row || !row.getAttribute('data-id')) return;
        var link = event.target.closest('a');
        if (link && (event.metaKey || event.ctrlKey || event.shiftKey)) return;
        if (openDrawer(row.getAttribute('data-id'))) {
            event.preventDefault();
        } else if (!link && row.getAttribute('data-href')) {
            window.location.href = row.getAttribute('data-href');
        }
    });

    if (search) {
        search.addEventListener('input', applyFilter);
        search.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') { search.value = ''; applyFilter(); }
        });
    }

    // ---- "This is me" -------------------------------------------------------
    var meId = read('woh-me');

    function applyMe() {
        rows.forEach(function (row) {
            var isMe = meId && row.getAttribute('data-id') === meId;
            row.classList.toggle('is-me', !!isMe);
            var btn = row.querySelector('.me-btn');
            if (btn) btn.setAttribute('aria-pressed', isMe ? 'true' : 'false');
        });
        if (jumpBtn) jumpBtn.hidden = !meId || !document.querySelector('.standings-table tr[data-id="' + meId + '"]');
    }

    tbody.addEventListener('click', function (event) {
        var btn = event.target.closest('.me-btn');
        if (!btn) return;
        event.preventDefault();
        var id = btn.getAttribute('data-id');
        meId = meId === id ? null : id;
        store('woh-me', meId);
        applyMe();
    });

    if (jumpBtn) jumpBtn.addEventListener('click', function () { if (meId) jumpTo(meId, true); });

    expandGroup = function () { if (!groupOpen) { groupOpen = true; applyFilter(); } };
    if (meId) {
        var meRow = document.querySelector('.standings-table tr[data-id="' + meId + '"]');
        if (meRow && meRow.classList.contains('is-inactive')) groupOpen = true;
    }
    applyMe();
    applyFilter();
})();
