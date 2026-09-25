import config from './focus-config.js';
import { initialCommunity, acceptCommunityPage, validateCommunityPage, unavailableCommunity, expireCommunity, communitySummary } from './community-state.mjs';

const section = document.getElementById('focusing-now');
if (section) initializeCommunity();

function initializeCommunity() {
    const $ = id => document.getElementById(id);
    let roster;
    try { roster = JSON.parse($('trainer-data').textContent); } catch { return; }
    const trainers = new Map(roster.map(trainer => [trainer.id, trainer]));
    const board = section.querySelector('.guild-board');
    const dialog = $('guild-member-dialog');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    const apiBase = local ? 'http://127.0.0.1:8787/api/community/' : config.apiBase ? new URL('../community/', config.apiBase).href : '';
    let model = initialCommunity([...trainers.keys()]);
    let filter = 'all';
    let selected = null;
    let me = '';
    let controller = null;
    let generation = 0;
    let pollTimer;
    let ageTimer;
    let failures = 0;
    let lastAttempt = 0;
    let announcement = '';
    try { me = localStorage.getItem('woh-me') || ''; } catch { /* Optional preference. */ }

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }
    function sprite(source, className) {
        const image = element('img', className);
        image.src = source;
        image.alt = '';
        image.draggable = false;
        return image;
    }
    const duration = item => `${item.session.approximate ? '≈' : ''}${item.session.focusMinutes}`;
    const stale = item => item.state === 'unavailable';
    function details(id) {
        selected = id;
        renderDialog();
        dialog.showModal();
    }
    function renderDialog() {
        const trainer = trainers.get(selected);
        const item = model.get(selected);
        if (!trainer || !item) return;
        $('guild-dialog-name').textContent = trainer.name;
        $('guild-dialog-avatar').src = trainer.avatar;
        $('guild-dialog-companion').src = trainer.focumon;
        $('guild-dialog-status').textContent = stale(item) ? 'Status unconfirmed' : item.state === 'break' ? 'Taking a break' : item.state === 'focus' ? 'Focusing' : 'Session ended';
        dialog.querySelector('.guild-dialog-time').hidden = !item.session;
        $('guild-dialog-minutes').textContent = item.session ? duration(item) : '—';
        $('guild-dialog-caption').textContent = stale(item) ? 'last known focus time' : item.state === 'break' ? 'focused before this break' : 'focused this session';
        $('guild-dialog-link').href = `https://www.focumon.com/focus_with/${encodeURIComponent(selected)}`;
    }
    function member(item) {
        const trainer = trainers.get(item.trainer);
        const button = element('button', `guild-member${stale(item) ? ' is-stale' : ''}`);
        button.type = 'button';
        button.dataset.trainer = item.trainer;
        button.setAttribute('aria-label', `${trainer.name}${item.trainer === me ? ', you' : ''}. ${stale(item) ? 'Status unconfirmed, last known' : 'Focusing,'} ${item.session.approximate ? 'about ' : ''}${item.session.focusMinutes} minutes focused. View details.`);
        button.append(element('span', 'guild-member-status', stale(item) ? 'Unconfirmed' : 'Focusing'));
        const arrow = element('span', 'guild-member-link', '↗');
        arrow.setAttribute('aria-hidden', 'true');
        button.append(arrow);
        const art = element('span', 'guild-member-art');
        art.setAttribute('aria-hidden', 'true');
        art.append(element('span', 'guild-member-ground'), sprite(trainer.avatar, 'guild-member-avatar'), sprite(trainer.focumon, 'guild-member-companion'));
        const info = element('span', 'guild-member-info');
        const nameBlock = element('span');
        const name = element('span', 'guild-member-name', trainer.name);
        if (item.trainer === me) name.append(element('span', 'guild-you', 'YOU'));
        nameBlock.append(name, element('span', 'guild-member-caption', stale(item) ? 'Last known focus time' : 'Focused this session'));
        const length = String(item.session.focusMinutes).length;
        const time = element('span', `guild-member-time${length > 2 ? ' is-long' : ''}${length > 3 ? ' is-very-long' : ''}`);
        time.append(element('strong', '', duration(item)), element('span', '', 'min'));
        info.append(nameBlock, time);
        button.append(art, info);
        button.addEventListener('click', () => details(item.trainer));
        return button;
    }
    function resting(item) {
        const trainer = trainers.get(item.trainer);
        const button = element('button', `guild-rest-member${stale(item) ? ' is-stale' : ''}`);
        button.type = 'button';
        button.dataset.trainer = item.trainer;
        button.setAttribute('aria-label', `${trainer.name}. ${stale(item) ? 'Status unconfirmed, last known break.' : 'Taking a break.'} ${item.session.approximate ? 'About ' : ''}${item.session.focusMinutes} minutes focused before this break. View details.`);
        const art = element('span', 'guild-rest-portrait');
        art.setAttribute('aria-hidden', 'true');
        art.append(sprite(trainer.avatar, ''));
        const copy = element('span');
        copy.append(element('span', 'guild-rest-name', trainer.name), element('span', 'guild-rest-detail', stale(item) ? 'Last known: on a break' : 'Focus time paused'));
        const time = element('span', 'guild-rest-duration', `${duration(item)} `);
        time.append(element('small', '', 'min focused'));
        const arrow = element('span', 'guild-rest-arrow', '↗');
        arrow.setAttribute('aria-hidden', 'true');
        button.append(art, copy, time, arrow);
        button.addEventListener('click', () => details(item.trainer));
        return button;
    }
    function restoreCardFocus(id) {
        if (!id) return;
        const card = [...section.querySelectorAll('[data-trainer]')].find(button => button.dataset.trainer === id);
        (card || $('guild-refresh')).focus({ preventScroll: true });
    }
    function render() {
        const summary = communitySummary(model);
        const checking = !!controller;
        const loading = summary.loading > 0 && !summary.checked && !summary.unknown;
        const offline = !summary.checked && summary.unknown > 0;
        const activeCard = document.activeElement?.dataset.trainer;
        const sessions = summary.sessions.sort((a, b) => trainers.get(a.trainer).name.localeCompare(trainers.get(b.trainer).name));
        const focused = filter === 'break' ? [] : sessions.filter(item => item.lastState === 'focus');
        const breaks = filter === 'focus' ? [] : sessions.filter(item => item.lastState === 'break');
        const phase = loading ? 'loading' : offline ? 'offline' : summary.unknown ? 'partial' : summary.sessions.length ? 'live' : 'empty';
        section.dataset.state = board.dataset.state = phase;
        section.setAttribute('aria-busy', String(checking));
        board.dataset.filter = filter;
        $('guild-focus-count').textContent = summary.checked ? summary.focusing : '—';
        $('guild-break-count').textContent = summary.checked ? summary.resting : '—';
        section.querySelector('.guild-totals').setAttribute('aria-label', `${summary.focusing} confirmed focusing, ${summary.resting} confirmed on a break. ${summary.unknown} unconfirmed, ${summary.loading} pending.`);
        $('guild-all-count').textContent = summary.sessions.length || (summary.checked === summary.total ? 0 : '—');
        $('guild-roster-size').textContent = summary.total;
        $('guild-live-label').textContent = loading ? 'CHECKING THE GUILD' : offline ? 'THE SIGNAL IS QUIET' : 'ALONGSIDE YOU';
        $('guild-loading').hidden = !loading;
        $('guild-roster').replaceChildren(...focused.map(member));
        $('guild-roster').hidden = !focused.length;
        $('guild-rest-list').replaceChildren(...breaks.map(resting));
        $('guild-rest').hidden = !breaks.length;
        $('guild-notice').hidden = !summary.unknown;
        $('guild-notice-copy').textContent = offline ? 'Live status is unavailable. Any sessions below are last known, not confirmed live.' : `${summary.unknown} ${summary.unknown === 1 ? 'trainer could' : 'trainers could'} not be checked. Only confirmed sessions count as live.`;
        const age = summary.checkedAt ? Math.max(0, Math.floor((Date.now() - summary.checkedAt) / 60000)) : 0;
        $('guild-updated').textContent = checking ? 'Checking…' : !summary.checked ? 'Status unavailable' : age ? `Updated ${age} min ago` : 'Updated just now';
        $('guild-refresh').disabled = checking || !apiBase;
        $('guild-coverage').textContent = summary.loading ? `Checking the guild · ${summary.checked} of ${summary.total} confirmed.` : `${summary.checked} of ${summary.total} trainers checked.${summary.unknown ? ` ${summary.unknown} unconfirmed.` : ''}`;
        $('guild-empty').hidden = loading || focused.length + breaks.length > 0;
        const uncertain = summary.unknown > 0 || summary.loading > 0;
        $('guild-empty-title').textContent = uncertain ? 'Some signals are quiet.' : filter === 'break' ? 'No breaks right now.' : 'A quiet moment before the next quest.';
        $('guild-empty-description').textContent = uncertain ? 'We can’t confirm every trainer’s status yet. Refresh to check again.' : filter === 'break' ? 'Focus time stays put whenever someone takes a breather.' : 'No one is focusing right now. Make a little room for your next chapter.';
        section.querySelector('.guild-empty .guild-kicker').textContent = uncertain ? 'WAITING FOR THE GUILD' : 'THE FIRE IS STILL WARM';
        section.querySelector('.guild-empty .guild-join').hidden = uncertain;
        section.querySelectorAll('.guild-filters button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
        if (dialog.open) renderDialog();
        else restoreCardFocus(activeCard);
        const message = loading ? 'Checking public focus sessions.' : `${summary.focusing} confirmed focusing. ${summary.resting} on a break.${summary.unknown ? ` ${summary.unknown} unconfirmed.` : ''}`;
        if (message !== announcement) { $('guild-announcement').textContent = message; announcement = message; }
    }

    function schedule() {
        clearTimeout(pollTimer);
        if (!document.hidden && apiBase) pollTimer = setTimeout(poll, Math.min(120000, (config.communityPollMs || 60000) * (2 ** Math.min(failures, 1))));
    }
    async function poll() {
        clearTimeout(pollTimer);
        if (document.hidden || controller || !apiBase) return;
        const current = ++generation;
        const requestController = new AbortController();
        controller = requestController;
        lastAttempt = Date.now();
        const seen = new Set();
        render();
        async function page(number, expected) {
            const signal = AbortSignal.any([requestController.signal, AbortSignal.timeout(24000)]);
            const response = await fetch(new URL(String(number), apiBase), { credentials: 'omit', signal, headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error('Community status unavailable');
            const data = validateCommunityPage(await response.json());
            if (data.page !== number || expected && (data.total !== expected.total || data.pages !== expected.pages)) throw new Error('Community membership changed');
            if (current !== generation) return null;
            for (const item of data.trainers) {
                if (seen.has(item.trainer)) throw new Error('Duplicate community membership');
            }
            for (const item of data.trainers) seen.add(item.trainer);
            model = acceptCommunityPage(model, data);
            render();
            return data;
        }
        try {
            const first = await page(0);
            if (!first || current !== generation) return;
            let next = 1;
            await Promise.all(Array.from({ length: Math.min(2, first.pages - 1) }, async () => {
                while (next < first.pages && current === generation) {
                    const number = next++;
                    try { await page(number, first); } catch { /* Missing pages become unconfirmed below. */ }
                }
            }));
        } catch { /* A failed first page cannot identify current membership. */ }
        finally {
            if (current === generation) {
                model = expireCommunity(unavailableCommunity(model, [...trainers.keys()].filter(id => !seen.has(id))));
                failures = communitySummary(model).checked ? 0 : failures + 1;
                controller = null;
                render();
                schedule();
            }
        }
    }
    function pause() {
        clearTimeout(pollTimer);
        clearInterval(ageTimer);
        generation += 1;
        controller?.abort();
        controller = null;
    }
    function resume() {
        if (document.hidden) return;
        clearInterval(ageTimer);
        model = expireCommunity(model);
        render();
        ageTimer = setInterval(() => { model = expireCommunity(model); render(); }, 15000);
        if (Date.now() - lastAttempt > 15000 || communitySummary(model).loading) poll();
        else schedule();
    }
    section.querySelectorAll('.guild-filters button').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; render(); }));
    $('guild-refresh').addEventListener('click', () => { if (Date.now() - lastAttempt > 5000) poll(); });
    dialog.querySelector('.guild-dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => restoreCardFocus(selected));
    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    document.addEventListener('woh:me-change', event => { me = event.detail?.id || ''; render(); });
    window.addEventListener('storage', event => {
        if (event.key === 'woh-me' || event.key === null) { me = event.newValue || ''; render(); }
    });
    document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume());
    window.addEventListener('focus', resume);
    window.addEventListener('pagehide', pause);
    window.addEventListener('pageshow', event => { if (event.persisted) resume(); });
    if (!apiBase) model = unavailableCommunity(model);
    resume();
}
