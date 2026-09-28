import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { Miniflare, Response } from 'miniflare';

const scenarios = [
    'empty', 'with_others', 'cached', 'focus', 'break', 'direct_idle',
    'active_text', 'active_link', 'break_profile', 'renamed_text', 'join_only', 'invalid_join',
    'wrong_identity', 'duplicate_identity', 'missing_identity', 'missing_scaffold', 'missing_main',
    'duplicate_main', 'duplicate_heading', 'truncated', 'profile_redirect', 'profile_error', 'profile_type', 'profile_timeout',
    'wrong_center', 'unknown_center', 'truncated_center', 'duplicate_center', 'center_error',
    'bad_card_id', 'incomplete_card', 'duplicate_card', 'unknown_state', 'duration_error'
];
const counts = new Map();
let runtime;
let fixture;
const html = body => new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
const redirect = location => new Response(null, { status: 302, headers: { Location: location } });
const profile = trainer => fixture.replaceAll('{{trainer}}', trainer);
const card = (trainer, id, state = 'Focusing...', stats = true) =>
    `<div id="mini_display_focus_session_${id}"><a href="/trainers/${trainer}">Trainer</a>${state}${stats ? `<a href="/focus_sessions/${Number.isInteger(id) ? id : 123}/mini_stats">Task</a>` : ''}</div>`;

function profileResponse(trainer) {
    let body = profile(trainer);
    const activity = {
        active_text: '<p>Focusing right now...</p>',
        active_link: '<a href="/training_centers/500">Join</a>',
        break_profile: '<p>Taking a break...</p>',
        renamed_text: '<p>Session in progress</p><a href="/training_centers/500">Continue</a>',
        join_only: '<a>Join</a>',
        invalid_join: '<a href="https://other.example/changed">Join</a>'
    }[trainer];
    if (activity) body = body.replace('<!-- activity -->', activity);
    if (trainer === 'wrong_identity') body = profile('someone_else');
    if (trainer === 'duplicate_identity') body = body.replace('</main>', `<dialog id="social_share_modal" data-qr-code-data-to-encode-value="https://www.focumon.com/trainers/someone_else"></dialog></main>`);
    if (trainer === 'missing_identity') body = body.replace('data-qr-code-data-to-encode-value', 'data-changed');
    if (trainer === 'missing_scaffold') body = body.replace('Focudex', 'Unavailable');
    if (trainer === 'missing_main') body = body.replace(/main/g, 'section');
    if (trainer === 'duplicate_main') body = body.replace('</body>', '<main></main></body>');
    if (trainer === 'duplicate_heading') body = body.replace('</main>', '<h1>Another profile</h1></main>');
    if (trainer === 'truncated') body = body.slice(0, body.indexOf('</main>'));
    if (trainer === 'profile_redirect') return redirect('/trainers/profile_redirect');
    if (trainer === 'profile_error') return new Response('Unavailable', { status: 503 });
    if (trainer === 'profile_type') return new Response(body, { headers: { 'Content-Type': 'application/json' } });
    if (trainer === 'profile_timeout') return setTimeout(10500).then(() => html(body));
    return html(body);
}

before(async () => {
    const source = await readFile(new URL('../worker.js', import.meta.url), 'utf8');
    fixture = await readFile(new URL('fixtures/inactive-profile.html', import.meta.url), 'utf8');
    runtime = new Miniflare({
        telemetry: { enabled: false }, logRequests: false,
        workers: [{
            config: {
                name: 'profile-fallback-tests', compatibilityDate: '2026-09-23',
                manifest: { mainModule: 'worker.js', modules: { 'worker.js': { type: 'esm', contents: source } } },
                env: { ALLOWED_TRAINERS: { type: 'text', value: scenarios.join(',') } }
            },
            dev: { outboundService: { type: 'fetcher', handler: request => {
                const url = new URL(request.url);
                assert.equal(url.origin, 'https://www.focumon.com');
                assert.equal(request.method, 'GET');
                assert.equal(request.headers.get('Cookie'), null);
                counts.set(url.pathname, (counts.get(url.pathname) || 0) + 1);
                if (url.pathname.startsWith('/focus_with/')) {
                    const trainer = url.pathname.split('/').at(-1);
                    return redirect(trainer === 'direct_idle' ? '/trainers/direct_idle' : `/training_centers/${500 + scenarios.indexOf(trainer)}`);
                }
                if (url.pathname.startsWith('/trainers/')) return profileResponse(url.pathname.split('/').at(-1));
                if (url.pathname.startsWith('/training_centers/')) {
                    const center = Number(url.pathname.split('/').at(-1));
                    const trainer = scenarios[center - 500];
                    if (trainer === 'center_error') return new Response('Unavailable', { status: 503 });
                    if (trainer === 'unknown_center') return html('<h1>Please sign in</h1>');
                    let own = '';
                    if (['focus', 'break', 'duration_error', 'unknown_state'].includes(trainer)) own = card(trainer, trainer === 'focus' ? 900 : trainer === 'break' ? 901 : 123, trainer === 'break' ? 'Taking a break...' : trainer === 'unknown_state' ? 'Unknown' : 'Focusing...');
                    if (trainer === 'bad_card_id') own = card(trainer, 'invalid');
                    if (trainer === 'incomplete_card') own = card(trainer, 123, 'Focusing...', false);
                    if (trainer === 'duplicate_card') own = card(trainer, 123) + card(trainer, 123);
                    if (trainer === 'with_others') own = card('someone_else', 123);
                    let body = `<h1>Center</h1><div id="focus_sessions_training_center_${trainer === 'wrong_center' ? 9999 : center}">${own}</div>`;
                    if (trainer === 'truncated_center') body = body.slice(0, -6);
                    if (trainer === 'duplicate_center') body += `<div id="focus_sessions_training_center_${center}"></div>`;
                    return html(body);
                }
                if (/^\/focus_sessions\/90[01]\/mini_stats$/.test(url.pathname)) return html('<turbo-stream><template>Focused for 24 minutes</template></turbo-stream>');
                // The task remains unknown when duration cannot be read; a
                // profile fallback must never run after this stats request.
                return html('<turbo-stream><template>Unrecognized duration</template></turbo-stream>');
            } } }
        }]
    });
});
after(async () => { await runtime?.dispose(); });
const get = trainer => runtime.dispatchFetch(`https://focus.test/api/focus/${trainer}`);

test('an empty recognized center uses the complete own profile to confirm idle', async () => {
    for (const trainer of ['empty', 'with_others']) {
        const response = await get(trainer);
        assert.equal(response.status, 200, trainer);
        const data = await response.json();
        assert.equal(data.trainer, trainer);
        assert.equal(data.state, 'idle');
        assert.equal(data.session, null);
        assert.ok(Number.isFinite(Date.parse(data.checkedAt)));
        assert.equal(counts.get(`/trainers/${trainer}`), 1);
    }
    assert.equal(counts.get('/focus_sessions/123/mini_stats'), undefined);
});

test('either an active message or a Join control prevents an idle fallback', async () => {
    for (const trainer of ['active_text', 'active_link', 'break_profile', 'renamed_text', 'join_only', 'invalid_join']) {
        const response = await get(trainer);
        assert.equal(response.status, 503, trainer);
        assert.equal((await response.json()).state, undefined);
        assert.equal(counts.get(`/trainers/${trainer}`), 1);
    }
});

test('present focus and break cards keep their existing path without a profile request', async () => {
    for (const trainer of ['focus', 'break']) {
        const response = await get(trainer);
        assert.equal(response.status, 200);
        const data = await response.json();
        assert.equal(data.state, trainer);
        assert.equal(data.session.focusMinutes, 24);
        assert.equal(counts.get(`/trainers/${trainer}`), undefined);
    }
});

test('failed, redirected, mismatched and incomplete profiles remain unavailable', async () => {
    for (const trainer of scenarios.slice(scenarios.indexOf('wrong_identity'), scenarios.indexOf('wrong_center'))) {
        const response = await get(trainer);
        assert.equal(response.status, 503, trainer);
        assert.equal(response.headers.get('Cache-Control'), 'no-store');
        assert.equal(counts.get(`/trainers/${trainer}`), 1, 'fallback redirects are not followed');
    }
});

test('unrecognized centers and malformed own cards never trigger the fallback', async () => {
    for (const trainer of scenarios.slice(scenarios.indexOf('wrong_center'))) {
        assert.equal((await get(trainer)).status, 503, trainer);
        assert.equal(counts.get(`/trainers/${trainer}`), undefined, trainer);
    }
});

test('normal profile redirects stay idle and the successful fallback is cached', async () => {
    assert.equal((await (await get('direct_idle')).json()).state, 'idle');
    assert.equal(counts.get('/trainers/direct_idle'), 1);
    const first = await get('cached');
    assert.equal(first.status, 200);
    assert.equal(first.headers.get('Cache-Control'), 'public, max-age=25');
    assert.equal((await get('cached')).status, 200);
    assert.equal(counts.get('/focus_with/cached'), 1);
    assert.equal(counts.get('/trainers/cached'), 1);
});

test('the profile fallback shares the community deadline', async () => {
    const source = (await readFile(new URL('../worker.js', import.meta.url), 'utf8'))
        .replace('AbortSignal.timeout(18000)', 'AbortSignal.timeout(500)');
    let profiles = 0;
    const bounded = new Miniflare({
        telemetry: { enabled: false }, logRequests: false,
        workers: [{
            config: {
                name: 'profile-deadline-test', compatibilityDate: '2026-09-23',
                manifest: { mainModule: 'worker.js', modules: { 'worker.js': { type: 'esm', contents: source } } },
                env: { ALLOWED_TRAINERS: { type: 'text', value: 'slow' } }
            },
            dev: { outboundService: { type: 'fetcher', handler: async request => {
                const path = new URL(request.url).pathname;
                if (path === '/focus_with/slow') return redirect('/training_centers/1');
                if (path === '/training_centers/1') return html('<div id="focus_sessions_training_center_1"></div>');
                assert.equal(path, '/trainers/slow');
                profiles++;
                await setTimeout(1000);
                return html(profile('slow'));
            } } }
        }]
    });
    try {
        const response = await bounded.dispatchFetch('https://focus.test/api/community/0');
        const data = await response.json();
        assert.equal(profiles, 1, 'deadline is reached during the profile check');
        assert.equal(data.trainers[0].state, 'unavailable');
        assert.equal(data.trainers[0].session, null);
    } finally { await bounded.dispose(); }
});
