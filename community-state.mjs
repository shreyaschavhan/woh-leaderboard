// Only observed minutes are displayed. Local clocks never advance focus time.
export const PAGE_SIZE = 8;
export const FRESH_MS = 120000;

export function initialCommunity(ids) {
    return new Map(ids.map(trainer => [trainer, {
        trainer, state: 'loading', lastState: null, checkedAt: null, session: null
    }]));
}

export function unavailableCommunity(previous, ids = [...previous.keys()]) {
    const next = new Map(previous);
    for (const id of ids) {
        const old = next.get(id);
        if (old) next.set(id, { ...old, state: 'unavailable' });
    }
    return next;
}

export function expireCommunity(previous, now = Date.now()) {
    return unavailableCommunity(previous, [...previous.values()]
        .filter(item => item.checkedAt && now - item.checkedAt > FRESH_MS)
        .map(item => item.trainer));
}

export function validateCommunityPage(data, now = Date.now()) {
    const checkedAt = Date.parse(data?.checkedAt);
    if (!data || !Number.isInteger(data.total) || data.total < 0 || data.total > 256 ||
        data.pageSize !== PAGE_SIZE || data.pages !== Math.max(1, Math.ceil(data.total / PAGE_SIZE)) ||
        !Number.isInteger(data.page) || data.page < 0 || data.page >= data.pages ||
        !Number.isFinite(checkedAt) || checkedAt > now + 30000 || now - checkedAt > FRESH_MS ||
        !Array.isArray(data.trainers) || data.trainers.length !== Math.min(PAGE_SIZE, data.total - data.page * PAGE_SIZE)) {
        throw new Error('Invalid community observation');
    }
    const ids = new Set();
    for (const item of data.trainers) {
        if (!item || typeof item.trainer !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(item.trainer) || ids.has(item.trainer)) {
            throw new Error('Invalid community membership');
        }
        ids.add(item.trainer);
    }
    return data;
}

export function acceptCommunityPage(previous, data, now = Date.now()) {
    validateCommunityPage(data, now);
    const next = new Map(previous);
    for (const item of data.trainers) {
        const old = previous.get(item.trainer);
        if (!old) continue;
        const checkedAt = Date.parse(item.checkedAt);
        const validTime = Number.isFinite(checkedAt) && checkedAt <= now + 30000 && now - checkedAt <= FRESH_MS;
        const active = item.state === 'focus' || item.state === 'break';
        const validSession = item.session && /^\d{1,12}$/.test(String(item.session.id)) &&
            Number.isSafeInteger(item.session.focusMinutes) && item.session.focusMinutes >= 0;
        if (!validTime || !(item.state === 'idle' && item.session === null || active && validSession)) {
            next.set(item.trainer, { ...old, state: 'unavailable' });
            continue;
        }
        // An older edge response must not overwrite a newer observation.
        if (old.checkedAt && checkedAt < old.checkedAt) continue;
        next.set(item.trainer, {
            trainer: item.trainer, state: item.state, lastState: item.state, checkedAt,
            session: active ? {
                id: String(item.session.id), focusMinutes: item.session.focusMinutes,
                approximate: item.session.approximate === true
            } : null
        });
    }
    return expireCommunity(next, now);
}

export function communitySummary(model) {
    const items = [...model.values()];
    const confirmed = items.filter(item => ['idle', 'focus', 'break'].includes(item.state));
    return {
        total: items.length, checked: confirmed.length,
        loading: items.filter(item => item.state === 'loading').length,
        unknown: items.filter(item => item.state === 'unavailable').length,
        focusing: confirmed.filter(item => item.state === 'focus').length,
        resting: confirmed.filter(item => item.state === 'break').length,
        sessions: items.filter(item => item.session && ['focus', 'break'].includes(item.lastState)),
        checkedAt: confirmed.length ? Math.min(...confirmed.map(item => item.checkedAt)) : null
    };
}
