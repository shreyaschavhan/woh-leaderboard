const FOCUMON = 'https://www.focumon.com';
const pending = new Map();
const recent = new Map();
const TTL = 25000;
const PAGE_SIZE = 8;
const MAX_ROSTER = 256;

function clean(text) {
    return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity) => {
        const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
        if (entity[0] !== '#') return named[entity.toLowerCase()] || match;
        const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }).replace(/\s+/g, ' ').trim();
}

function pathOf(href) {
    try {
        const url = new URL(href, FOCUMON);
        return url.origin === FOCUMON ? url.pathname : '';
    } catch { return ''; }
}

async function publicPage(path, trainer, deadline, maxHops = 5) {
    let url = new URL(path, FOCUMON);
    const timeout = AbortSignal.timeout(10000);
    const signal = deadline ? AbortSignal.any([timeout, deadline]) : timeout;
    for (let hop = 0; hop < maxHops; hop++) {
        const response = await fetch(url, {
            method: 'GET', redirect: 'manual', signal,
            headers: { Accept: 'text/html, text/vnd.turbo-stream.html', 'Accept-Language': 'en' }
        });
        if ([301, 302, 303, 307, 308].includes(response.status)) {
            const target = new URL(response.headers.get('Location') || '', url);
            await response.body?.cancel();
            if (target.origin !== FOCUMON || target.search ||
                !(target.pathname === `/trainers/${trainer}` || /^\/training_centers\/\d+(?:-[\w-]+)?$/.test(target.pathname))) {
                throw new Error('Unexpected public redirect');
            }
            url = target;
            continue;
        }
        if (!response.ok || !/text\/(?:html|vnd\.turbo-stream\.html)/i.test(response.headers.get('Content-Type') || '')) {
            await response.body?.cancel();
            throw new Error('Public state unavailable');
        }
        const reader = response.body.getReader();
        const chunks = [];
        let length = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            length += value.length;
            if (length > 1500000) { await reader.cancel(); throw new Error('Public response too large'); }
            chunks.push(value);
        }
        return { path: url.pathname, response: new Response(new Blob(chunks), { headers: { 'Content-Type': 'text/html; charset=utf-8' } }) };
    }
    throw new Error('Too many public redirects');
}

async function parsePublicPage(response, trainer) {
    const cards = [];
    let current = null;
    let sessionLink = null;
    let heading = '';
    let readingHeading = false;
    let headingSeen = false;
    let ownProfile = false;
    const rewriter = new HTMLRewriter()
        .on('[id^="mini_display_focus_session_"]', {
            element(element) {
                const id = element.getAttribute('id').match(/^mini_display_focus_session_(\d+)$/)?.[1];
                current = id ? { id, text: '', own: false, name: '', linkedId: null } : null;
                const card = current;
                element.onEndTag(() => { if (card) cards.push(card); current = null; });
            },
            text(chunk) { if (current) current.text += chunk.text; }
        })
        .on('a[href]', {
            element(element) {
                const path = pathOf(element.getAttribute('href'));
                if (path === `/trainers/${trainer}`) {
                    ownProfile = true;
                    if (current) current.own = true;
                }
                if (current) {
                    const id = path.match(/^\/focus_sessions\/(\d+)\/mini_stats$/)?.[1];
                    if (id) {
                        current.linkedId = id;
                        sessionLink = current;
                        element.onEndTag(() => { sessionLink = null; });
                    }
                }
            },
            text(chunk) { if (sessionLink) sessionLink.name += chunk.text; }
        })
        .on('h1', {
            element(element) {
                readingHeading = !headingSeen;
                headingSeen = true;
                element.onEndTag(() => { readingHeading = false; });
            },
            text(chunk) { if (readingHeading) heading += chunk.text; }
        });
    await rewriter.transform(response).text();
    return { cards: cards.filter(card => card.own), ownProfile, heading: clean(heading).slice(0, 120) };
}

async function parseMinutes(response) {
    let text = '';
    await new HTMLRewriter().on('template', { text(chunk) { text += chunk.text; } }).transform(response).text();
    text = clean(text);
    const duration = text.match(/Focused for\s+((?:(?:about|less than|over|almost)\s+)?(?:(?:\d+|an?|one)\s+(?:seconds?|minutes?|hours?|days?)\s*(?:,\s*|and\s*)?)+)/i)?.[1];
    if (!duration) throw new Error('Unrecognized public duration');
    let seconds = 0;
    for (const part of duration.matchAll(/(\d+|an?|one)\s+(seconds?|minutes?|hours?|days?)/gi)) {
        const value = /^\d+$/.test(part[1]) ? Number(part[1]) : 1;
        const scale = /^day/i.test(part[2]) ? 86400 : /^hour/i.test(part[2]) ? 3600 : /^minute/i.test(part[2]) ? 60 : 1;
        seconds += value * scale;
    }
    const minutes = /less than (?:a|one|1) minute/i.test(duration) ? 0 : Math.floor(seconds / 60);
    if (!Number.isSafeInteger(minutes) || minutes < 0) throw new Error('Invalid public duration');
    return { focusMinutes: minutes, approximate: /about|over|almost|less than/i.test(duration) && minutes !== 0 };
}

async function observe(trainer, deadline) {
    const page = await publicPage(`/focus_with/${trainer}`, trainer, deadline);
    const parsed = await parsePublicPage(page.response, trainer);
    if (page.path === `/trainers/${trainer}` && parsed.ownProfile && parsed.cards.length === 0) {
        return { trainer, state: 'idle', session: null, checkedAt: new Date().toISOString() };
    }
    const centerId = page.path.match(/^\/training_centers\/(\d+)(?:-[\w-]+)?$/)?.[1];
    if (!centerId || parsed.cards.length !== 1) throw new Error('Own session could not be identified');
    const card = parsed.cards[0];
    const name = clean(card.name);
    if (card.id !== card.linkedId || !name) throw new Error('Incomplete own-session card');
    const status = clean(card.text).replace(name, '');
    const focusing = /Focusing\.{0,3}/i.test(status);
    const onBreak = /Taking a break\.{0,3}/i.test(status);
    if (focusing === onBreak) throw new Error('Unknown session state');
    // A stats redirect is a changed/unknown session, never another page to follow.
    const stats = await publicPage(`/focus_sessions/${card.id}/mini_stats`, trainer, deadline, 1);
    if (stats.path !== `/focus_sessions/${card.id}/mini_stats`) throw new Error('Session changed during observation');
    const duration = await parseMinutes(stats.response);
    return {
        trainer, state: onBreak ? 'break' : 'focus', checkedAt: new Date().toISOString(),
        session: { id: card.id, name: name.slice(0, 240), ...duration, centerId, centerName: parsed.heading || 'Focumon training center' }
    };
}

function cors(response, origin) {
    const headers = new Headers(response.headers);
    headers.set('Vary', 'Origin');
    headers.set('X-Content-Type-Options', 'nosniff');
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    return new Response(response.body, { status: response.status, headers });
}

function json(data, status = 200) {
    return Response.json(data, { status, headers: { 'Cache-Control': status === 200 ? 'public, max-age=25' : 'no-store' } });
}

async function observation(trainer, deadline) {
    let result = recent.get(trainer);
    if (result && result.expires > Date.now()) return result;
    if (!pending.has(trainer)) {
        pending.set(trainer, observe(trainer, deadline).then(
            data => ({ data, status: 200, expires: Date.now() + TTL }),
            () => ({ data: { error: 'Focumon status is temporarily unavailable' }, status: 503, expires: Date.now() + 5000 })
        ).finally(() => pending.delete(trainer)));
    }
    result = await pending.get(trainer);
    if (recent.size >= MAX_ROSTER) recent.delete(recent.keys().next().value);
    recent.set(trainer, result);
    return result;
}

async function communityPage(page, allowed) {
    const members = allowed.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const trainers = new Array(members.length);
    const deadline = AbortSignal.timeout(18000);
    let next = 0;
    // At most three open upstream connections. Eight observations need at most
    // 48 fetches (five focus-link hops + one stats request each), plus two cache
    // calls: within the Workers Free limit of 50 subrequests per invocation.
    await Promise.all(Array.from({ length: Math.min(3, members.length) }, async () => {
        while (next < members.length) {
            const index = next++;
            const trainer = members[index];
            const result = await observation(trainer, deadline);
            const data = result.data;
            trainers[index] = result.status === 200 ? {
                trainer, state: data.state, checkedAt: data.checkedAt,
                session: data.session ? {
                    id: data.session.id, focusMinutes: data.session.focusMinutes,
                    approximate: data.session.approximate
                } : null
            } : { trainer, state: 'unavailable', checkedAt: null, session: null };
        }
    }));
    return {
        page, pageSize: PAGE_SIZE, pages: Math.max(1, Math.ceil(allowed.length / PAGE_SIZE)),
        total: allowed.length, checkedAt: new Date().toISOString(), trainers
    };
}

async function getCommunity(url, page, allowed, ctx) {
    if (page >= Math.max(1, Math.ceil(allowed.length / PAGE_SIZE))) return json({ error: 'Unknown page' }, 404);
    // Roster changes cannot reuse a batch cached for a different membership.
    const key = new Request(`${url.origin}/api/community/${page}?roster=${encodeURIComponent(allowed.join(','))}`);
    const cached = await caches.default.match(key);
    if (cached) return cached;
    const pendingKey = `community:${allowed.join(',')}:${page}`;
    if (!pending.has(pendingKey)) pending.set(pendingKey, communityPage(page, allowed).finally(() => pending.delete(pendingKey)));
    const data = await pending.get(pendingKey);
    const response = json(data);
    // Briefly share incomplete batches, while allowing a prompt retry.
    if (data.trainers.some(trainer => trainer.state === 'unavailable')) response.headers.set('Cache-Control', 'public, max-age=5');
    ctx.waitUntil(caches.default.put(key, response.clone()));
    return response;
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const origin = request.headers.get('Origin');
        const origins = (env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim());
        if (origin && !origins.includes(origin)) return json({ error: 'Origin not allowed' }, 403);
        if (request.method === 'OPTIONS') {
            return cors(new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' } }), origin);
        }
        if (request.method !== 'GET') return cors(json({ error: 'Read-only endpoint' }, 405), origin);
        const allowed = [...new Set((env.ALLOWED_TRAINERS || '').split(',').map(value => value.trim()).filter(value => /^[A-Za-z0-9_-]{1,80}$/.test(value)))].sort().slice(0, MAX_ROSTER);
        const page = url.pathname.match(/^\/api\/community\/(0|[1-9]\d{0,2})$/)?.[1];
        if (page !== undefined && !url.search) return cors(await getCommunity(url, Number(page), allowed, ctx), origin);
        const trainer = url.pathname.match(/^\/api\/focus\/([A-Za-z0-9_-]{1,80})$/)?.[1];
        if (!trainer || url.search || !allowed.includes(trainer)) return cors(json({ error: 'Unknown trainer' }, 404), origin);
        const key = new Request(`${url.origin}/api/focus/${trainer}`);
        const cached = await caches.default.match(key);
        if (cached) return cors(cached, origin);
        const result = await observation(trainer);
        const response = json(result.data, result.status);
        if (result.status === 200) ctx.waitUntil(caches.default.put(key, response.clone()));
        return cors(response, origin);
    }
};
