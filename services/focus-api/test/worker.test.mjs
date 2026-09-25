import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, Response } from 'miniflare';

const origin = 'https://shreyaschavhan.github.io';
const scenarios = ['idle', 'focus', 'break', 'missing', 'unknown', 'login', 'redirect', 'duration_error', 'zero', 'long', 'entity'];
const counts = new Map();
let runtime;
const html = body => new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
const redirect = path => new Response(null, { status: 302, headers: { Location: path } });
const card = (trainer, id, status, name = 'Build &amp; test') => `<div id="mini_display_focus_session_${id}"><a href="/trainers/${trainer}">${trainer}</a><p>${status}</p><a href="/focus_sessions/${id}/mini_stats">${name}</a></div>`;

before(async () => {
    const source = await readFile(new URL('../worker.js', import.meta.url), 'utf8');
    runtime = new Miniflare({
        telemetry: { enabled: false }, logRequests: false,
        workers: [{
            config: {
                name: 'focus-tests', compatibilityDate: '2026-09-23',
                manifest: { mainModule: 'worker.js', modules: { 'worker.js': { type: 'esm', contents: source } } },
                env: {
                    ALLOWED_ORIGINS: { type: 'text', value: origin },
                    ALLOWED_TRAINERS: { type: 'text', value: scenarios.join(',') }
                }
            },
            dev: {
                outboundService: { type: 'fetcher', handler: request => {
                    const url = new URL(request.url);
                    assert.equal(url.origin, 'https://www.focumon.com');
                    assert.equal(request.method, 'GET');
                    assert.equal(request.headers.get('Cookie'), null);
                    assert.equal(request.headers.get('Authorization'), null);
                    counts.set(url.pathname, (counts.get(url.pathname) || 0) + 1);
                    if (url.pathname.startsWith('/focus_with/')) {
                        const name = url.pathname.split('/').at(-1);
                        if (name === 'idle') return redirect('/trainers/idle');
                        if (name === 'login') return redirect('/landing');
                        if (name === 'redirect') return redirect('https://example.com/unexpected');
                        return redirect(`/training_centers/${900 + scenarios.indexOf(name)}-test-center`);
                    }
                    if (url.pathname === '/trainers/idle') return html('<h1>Idle trainer</h1><a href="/trainers/idle">Profile</a>');
                    if (url.pathname.startsWith('/training_centers/')) {
                        const index = Number(url.pathname.match(/\d+/)[0]) - 900;
                        const name = scenarios[index];
                        const status = name === 'break' ? 'Taking a break...' : name === 'unknown' ? 'Something changed' : 'Focusing...';
                        const own = name === 'missing' ? '' : card(name, 10000 + index, status);
                        return html(`<h1>The <span>Test Center</span></h1><h1>The Test Center</h1>${card('someone_else', 9999, 'Taking a break...')}${own}`);
                    }
                    const index = Number(url.pathname.match(/focus_sessions\/(\d+)/)?.[1]) - 10000;
                    const name = scenarios[index];
                    const duration = name === 'duration_error' ? 'unrecognized duration' : name === 'zero' ? 'less than a minute' : name === 'long' ? '2 hours and 7 minutes' : '24 minutes';
                    return new Response(`<turbo-stream action="append" target="modal"><template><h3>${name}'s focus session</h3><p>Focused for <b>${duration}</b></p><p>Build &amp; test</p></template></turbo-stream>`, { headers: { 'Content-Type': 'text/vnd.turbo-stream.html' } });
                } }
            }
        }]
    });
});
after(async () => { await runtime?.dispose(); });
const get = (trainer, options = {}) => runtime.dispatchFetch(`https://focus.test/api/focus/${trainer}`, { headers: { Origin: origin }, ...options });

test('an observed own profile means idle, with the configured CORS origin', async () => {
    const response = await get('idle');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
    assert.equal(response.headers.get('Set-Cookie'), null);
    assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null);
    assert.equal((await response.json()).state, 'idle');
});

test('selects the matching trainer, not the first session card, and parses Turbo templates', async () => {
    const response = await get('focus');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.state, 'focus');
    assert.equal(body.session.id, '10001');
    assert.equal(body.session.focusMinutes, 24);
    assert.equal(body.session.name, 'Build & test');
    assert.equal(body.session.centerName, 'The Test Center');
});

test('break, sub-minute, and multi-hour observations retain their meaning', async () => {
    const paused = await (await get('break')).json();
    assert.equal(paused.state, 'break');
    assert.equal(paused.session.focusMinutes, 24);
    const zero = await (await get('zero')).json();
    assert.equal(zero.session.focusMinutes, 0);
    const long = await (await get('long')).json();
    assert.equal(long.session.focusMinutes, 127);
});

test('missing own card, unfamiliar state, login redirect, and unreadable duration stay unknown', async () => {
    for (const trainer of ['missing', 'unknown', 'login', 'redirect', 'duration_error']) {
        const response = await get(trainer);
        assert.equal(response.status, 503, trainer);
        assert.equal(response.headers.get('Cache-Control'), 'no-store');
        assert.equal((await response.json()).state, undefined);
    }
});

test('repeated checks reuse the cached observation', async () => {
    await get('entity');
    const before = counts.get('/focus_with/entity');
    await get('entity');
    assert.equal(counts.get('/focus_with/entity'), before);
});

test('the API is bounded to known trainers and read-only requests', async () => {
    assert.equal((await get('not-on-roster')).status, 404);
    assert.equal((await get('focus?url=https://example.com')).status, 404);
    assert.equal((await get('focus', { method: 'POST' })).status, 405);
    assert.equal((await get('focus', { headers: { Origin: 'https://unrelated.example' } })).status, 403);
    assert.equal((await get('focus', { method: 'OPTIONS' })).status, 204);
});

test('community pages cover the allowlisted roster once, retaining unknown statuses', async () => {
    const request = page => runtime.dispatchFetch(`https://focus.test/api/community/${page}`, { headers: { Origin: origin } });
    const firstResponse = await request(0);
    assert.equal(firstResponse.status, 200);
    assert.equal(firstResponse.headers.get('Access-Control-Allow-Origin'), origin);
    const first = await firstResponse.json();
    const second = await (await request(1)).json();
    assert.equal(first.pageSize, 8);
    assert.equal(first.pages, 2);
    assert.equal(first.total, scenarios.length);
    assert.equal(first.trainers.length, 8);
    const all = [...first.trainers, ...second.trainers];
    assert.deepEqual(all.map(item => item.trainer), [...scenarios].sort());
    assert.equal(all.find(item => item.trainer === 'idle').state, 'idle');
    assert.equal(all.find(item => item.trainer === 'break').session.focusMinutes, 24);
    assert.equal(all.find(item => item.trainer === 'unknown').state, 'unavailable');
    const focus = all.find(item => item.trainer === 'focus');
    assert.equal(focus.state, 'focus');
    assert.equal(focus.session.name, undefined, 'community responses omit personal task names');
    assert.equal(focus.session.centerName, undefined);
    const before = [...counts.values()].reduce((sum, count) => sum + count, 0);
    await request(0);
    assert.equal([...counts.values()].reduce((sum, count) => sum + count, 0), before);
    assert.equal((await request(2)).status, 404);
    assert.equal((await request('0?url=https://example.com')).status, 404);
    assert.equal((await request('-1')).status, 404);
});
