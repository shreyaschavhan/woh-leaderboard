import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { Miniflare, Response } from 'miniflare';

for (const mode of ['focus', 'fallback', 'mixed']) {
    test(`a cold ${mode} batch stays within 48 upstream fetches and three concurrent connections`, () => checkBudget(mode));
}

async function checkBudget(mode) {
    const source = await readFile(new URL('../worker.js', import.meta.url), 'utf8');
    const profile = await readFile(new URL('fixtures/inactive-profile.html', import.meta.url), 'utf8');
    const members = Array.from({ length: 8 }, (_, i) => `member_${i}`);
    const usesFallback = index => mode === 'fallback' || mode === 'mixed' && index % 2 === 1;
    const profileRequests = new Set();
    const statsRequests = new Set();
    let fetches = 0;
    let active = 0;
    let peak = 0;
    const runtime = new Miniflare({
        telemetry: { enabled: false }, logRequests: false,
        workers: [{
            config: {
                name: 'community-budget', compatibilityDate: '2026-09-23',
                manifest: { mainModule: 'worker.js', modules: { 'worker.js': { type: 'esm', contents: source } } },
                env: { ALLOWED_TRAINERS: { type: 'text', value: members.join(',') } }
            },
            dev: { outboundService: { type: 'fetcher', handler: async request => {
                fetches += 1;
                active += 1;
                peak = Math.max(peak, active);
                await setTimeout(5);
                active -= 1;
                const path = new URL(request.url).pathname;
                const redirect = target => new Response(null, { status: 302, headers: { Location: target } });
                if (path.startsWith('/focus_with/')) return redirect(`/training_centers/${100 + Number(path.at(-1))}-hop-1`);
                if (path.startsWith('/training_centers/')) {
                    const [, center, hop] = path.match(/(\d+)-hop-(\d)$/);
                    if (Number(hop) < 4) return redirect(`/training_centers/${center}-hop-${Number(hop) + 1}`);
                    const index = Number(center) - 100;
                    if (usesFallback(index)) return new Response(`<h1>Center</h1><div id="focus_sessions_training_center_${center}"></div>`, { headers: { 'Content-Type': 'text/html' } });
                    return new Response(`<h1>Center</h1><div id="mini_display_focus_session_${9000 + index}"><a href="/trainers/member_${index}">Member</a>Focusing...<a href="/focus_sessions/${9000 + index}/mini_stats">Task</a></div>`, { headers: { 'Content-Type': 'text/html' } });
                }
                if (path.startsWith('/trainers/')) {
                    const index = Number(path.at(-1));
                    profileRequests.add(index);
                    return new Response(profile.replaceAll('{{trainer}}', `member_${index}`), { headers: { 'Content-Type': 'text/html' } });
                }
                statsRequests.add(Number(path.match(/focus_sessions\/(\d+)/)?.[1]) - 9000);
                return new Response('<turbo-stream><template>Focused for 15 minutes</template></turbo-stream>', { headers: { 'Content-Type': 'text/vnd.turbo-stream.html' } });
            } } }
        }]
    });
    try {
        const response = await runtime.dispatchFetch('https://budget.test/api/community/0');
        assert.equal(response.status, 200);
        const data = await response.json();
        assert.equal(data.trainers.length, 8);
        for (const [index, item] of data.trainers.entries()) {
            assert.equal(item.state, usesFallback(index) ? 'idle' : 'focus');
            assert.equal(profileRequests.has(index), usesFallback(index));
            assert.equal(statsRequests.has(index), !usesFallback(index));
        }
        assert.equal(fetches, 48);
        assert.ok(peak <= 3, `peak connections: ${peak}`);
        await runtime.dispatchFetch('https://budget.test/api/community/0');
        assert.equal(fetches, 48, 'cached batch avoids another upstream sweep');
    } finally { await runtime.dispose(); }
}
