import config from './focus-config.js';
import { initialState, acceptSnapshot, unavailable, sessionLinks } from './focus-state.mjs';

const section = document.getElementById('focus-session');
if (section) initializeFocus();

function initializeFocus() {
    const $ = id => document.getElementById(id);
    const card = section.querySelector('.focus-card');
    const picker = $('focus-trainer-select');
    const primary = $('focus-primary');
    const secondary = $('focus-secondary');
    const retry = $('focus-retry');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let roster;
    try { roster = JSON.parse($('trainer-data').textContent); } catch { return; }
    const trainers = new Map(roster.map(trainer => [trainer.id, trainer]));
    for (const trainer of [...roster].sort((a, b) => a.name.localeCompare(b.name))) {
        picker.add(new Option(trainer.name, trainer.id));
    }

    const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    const apiBase = local ? 'http://127.0.0.1:8787/api/focus/' : config.apiBase;
    let model = initialState();
    let generation = 0;
    let controller = null;
    let pollTimer = null;
    let failures = 0;
    let lastAttempt = 0;
    let handoffPending = false;
    let announcement = '';

    const views = {
        choose: ['Find your focus', 'Your next chapter starts here.', 'Choose your trainer to see your Focumon session.', 'YOUR NEXT MOVE', 'Pick one thing. Give it your attention.', 'Your party is ready.'],
        loading: ['Checking Focumon', 'Your training awaits.', 'Finding your current session…', 'YOUR NEXT MOVE', 'A little focus goes a long way.', 'Getting ready.'],
        idle: ['Ready when you are', 'Great things take focus.', 'Your next adventure starts with one small step.', 'YOUR NEXT MOVE', 'Pick one thing. Give it your attention.', 'Your party is ready.'],
        focus: ['Focusing', 'In your element.', 'One thing at a time. Something great is taking shape.', 'WORKING ON', '', 'Better, together.'],
        break: ['Taking a break', 'Even heroes take a breath.', 'Step back. Stretch out. Your progress is right here.', 'READY WHEN YOU ARE', '', 'Rest is part of the adventure.'],
        complete: ['Session ended', 'That’s time well spent.', 'You showed up. You made progress. That counts.', 'SESSION FINISHED', '', 'Another chapter, together.'],
        stale: ['Status unavailable', 'Your training is still yours.', 'We can’t check Focumon right now. Your session may still be running.', 'LAST KNOWN SESSION', 'Open Focumon to check your session.', 'We’ll catch up shortly.'],
        disconnected: ['Live tracking unavailable', 'Your training awaits.', 'Start, pause, or finish your session on Focumon. Live status isn’t available here yet.', 'YOUR NEXT MOVE', 'Make a little room for focus.', 'Your party is ready.']
    };

    function ageLabel() {
        if (!model.checkedAt) return '';
        const age = Math.max(0, Math.floor((Date.now() - model.checkedAt) / 60000));
        if (model.phase === 'stale') return age ? `Last checked ${age} min ago` : 'Last checked just now';
        return age ? `Updated ${age} min ago` : 'Updated just now';
    }

    function setLink(element, text, href) {
        element.hidden = !href;
        if (!href) { element.removeAttribute('href'); return; }
        element.href = href;
        element.replaceChildren(document.createTextNode(text));
        const arrow = document.createElement('span');
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '↗';
        element.append(arrow);
    }

    function render() {
        const phase = model.phase;
        const view = views[phase];
        const session = model.session;
        const links = sessionLinks(model, config.trainingCenterId);
        card.dataset.state = phase;
        card.setAttribute('aria-busy', String(phase === 'loading'));
        $('focus-status').lastElementChild.textContent = view[0];
        $('focus-sync').textContent = phase === 'idle' ? 'No active session' : ageLabel();
        $('focus-headline').textContent = view[1];
        $('focus-description').textContent = view[2];
        $('focus-task-label').textContent = phase === 'stale' && !session ? 'YOUR NEXT MOVE' : view[3];
        $('focus-task-name').textContent = session?.name || view[4] || 'Focus session';
        $('focus-party-caption').textContent = view[5];
        $('focus-minutes').textContent = phase === 'idle' ? 'Let’s go' : session ? `${session.approximate ? '≈' : ''}${session.focusMinutes}` : '—';
        section.querySelector('.focus-time').classList.toggle('is-long', !!session && String(session.focusMinutes).length >= 3);
        section.querySelector('.focus-time').classList.toggle('is-very-long', !!session && String(session.focusMinutes).length >= 4);
        $('focus-unit').textContent = session ? 'min' : '';
        const timeCaption = !session ? '' : phase === 'stale' ? 'last known focus time' : phase === 'complete' ? 'last tracked focus time' : phase === 'break' ? 'focused before this break' : 'focused this session';
        $('focus-time-caption').textContent = timeCaption;
        section.querySelector('.focus-time').setAttribute('aria-label', session ? `${session.approximate ? 'About ' : ''}${session.focusMinutes} minutes, ${timeCaption}` : view[0]);
        $('focus-center-name').textContent = session?.centerName || config.trainingCenterName;
        $('focus-footer-message').textContent = phase === 'complete' ? 'Consistency is your superpower.' : 'Small steps. Legendary consistency.';
        retry.hidden = phase !== 'stale';
        retry.disabled = !!controller;
        setLink(secondary, '', null);
        if (phase === 'idle' || phase === 'complete') {
            setLink(primary, phase === 'complete' ? 'Start another session' : 'Start session', links.start);
            if (phase === 'complete') setLink(secondary, 'View summary', links.summary);
        } else if (phase === 'focus' || phase === 'break') {
            setLink(primary, phase === 'break' ? 'Resume on Focumon' : 'Open Focumon', links.open);
            setLink(secondary, 'Finish session', links.finish);
        } else if (phase === 'stale') {
            setLink(primary, '', null);
            setLink(secondary, 'Open Focumon', links.open);
        } else {
            setLink(primary, 'Open Focumon', links.open);
        }
        const note = handoffPending ? 'Confirm on Focumon. This panel updates after your session changes.' :
            phase === 'complete' ? 'Open the summary on Focumon for the final total.' :
            phase === 'idle' ? 'Choose your session and begin on Focumon.' :
            phase === 'break' ? 'Focus time stays put while you recharge.' :
            phase === 'stale' ? 'Check Focumon before starting a new session.' : 'Use the same trainer on Focumon.';
        $('focus-action-note').textContent = note;
        $('focus-tracking-note').textContent = apiBase ? 'Session status and focus minutes update from Focumon.' : 'Start and finish sessions on Focumon.';
        const nextAnnouncement = `${model.trainer}:${phase}:${session?.focusMinutes ?? ''}`;
        if (nextAnnouncement !== announcement) {
            $('focus-announcement').textContent = `${view[0]}.${session ? ` ${session.focusMinutes} minutes, ${timeCaption}.` : ''}`;
            announcement = nextAnnouncement;
        }
    }

    function updateParty(trainer) {
        const party = section.querySelector('.focus-party');
        party.hidden = !trainer;
        for (const [className, source] of [['.focus-trainer', trainer?.avatar], ['.focus-companion', trainer?.focumon]]) {
            const image = section.querySelector(className);
            image.hidden = !source;
            if (source) image.src = source;
        }
        $('focus-trainer-name').textContent = trainer?.name || 'YOUR PARTY';
        $('focus-companion-name').textContent = 'FOCUMON';
        section.querySelector('.focus-scene').setAttribute('aria-label', trainer ? `${trainer.name} and their Focumon overlooking a moonlit mountain forest` : 'A moonlit mountain training ground');
    }

    function schedule() {
        clearTimeout(pollTimer);
        if (!apiBase || !model.trainer || document.hidden) return;
        pollTimer = setTimeout(poll, Math.min(120000, config.pollMs * (2 ** Math.min(failures, 2))));
    }

    async function poll() {
        clearTimeout(pollTimer);
        if (!model.trainer || !apiBase || document.hidden || controller) return;
        const requestGeneration = generation;
        const requestTrainer = model.trainer;
        const requestController = new AbortController();
        controller = requestController;
        lastAttempt = Date.now();
        const timeout = setTimeout(() => requestController.abort(), 12000);
        render();
        try {
            const endpoint = new URL(encodeURIComponent(requestTrainer), apiBase.endsWith('/') ? apiBase : `${apiBase}/`);
            const response = await fetch(endpoint, { credentials: 'omit', signal: requestController.signal, headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error('Session check failed');
            const data = await response.json();
            if (requestGeneration !== generation) return;
            const previous = model;
            model = acceptSnapshot(model, data);
            if (previous.phase !== model.phase || previous.session?.id !== model.session?.id) handoffPending = false;
            failures = 0;
        } catch {
            if (requestGeneration !== generation || document.hidden) return;
            model = unavailable(model);
            failures += 1;
        } finally {
            clearTimeout(timeout);
            if (requestGeneration === generation) {
                controller = null;
                render();
                schedule();
            }
        }
    }

    function selectTrainer(id) {
        id = trainers.has(id) ? id : '';
        if (id === model.trainer && model.phase !== 'choose') return;
        generation += 1;
        controller?.abort();
        controller = null;
        clearTimeout(pollTimer);
        handoffPending = false;
        failures = 0;
        model = initialState(id);
        if (id && !apiBase) model.phase = 'disconnected';
        picker.value = id;
        updateParty(trainers.get(id));
        render();
        if (apiBase && id) poll();
    }

    picker.addEventListener('change', () => {
        try {
            if (picker.value) localStorage.setItem('woh-me', picker.value);
            else localStorage.removeItem('woh-me');
        } catch { /* Selection still works in memory when storage is unavailable. */ }
        document.dispatchEvent(new CustomEvent('woh:me-change', { detail: { id: picker.value } }));
    });
    document.addEventListener('woh:me-change', event => selectTrainer(event.detail?.id || ''));
    window.addEventListener('storage', event => {
        if (event.key === 'woh-me' || event.key === null) selectTrainer(event.newValue || '');
    });
    retry.addEventListener('click', () => { if (Date.now() - lastAttempt > 3000) poll(); });
    for (const anchor of [primary, secondary]) {
        anchor.addEventListener('click', () => {
            if (!/^\/focus_sessions\/(?:new|\d+\/conclusion_review)$/.test(new URL(anchor.href).pathname)) return;
            handoffPending = true;
            render();
        });
    }
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) clearTimeout(pollTimer);
        else if (Date.now() - lastAttempt > 5000) poll();
        else schedule();
    });
    window.addEventListener('focus', () => { if (Date.now() - lastAttempt > 5000) poll(); });
    window.addEventListener('pagehide', () => { clearTimeout(pollTimer); controller?.abort(); });
    window.addEventListener('pageshow', event => {
        if (!event.persisted) return;
        try { selectTrainer(localStorage.getItem('woh-me') || ''); } catch { /* Optional preference. */ }
        poll();
    });
    let remembered = '';
    try { remembered = localStorage.getItem('woh-me') || ''; } catch { /* Optional preference. */ }
    selectTrainer(remembered);
    if (location.hash === '#focus-session') section.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth' });
}
