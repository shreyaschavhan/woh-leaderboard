// The UI changes session state only after a successful public-state observation.
export function initialState(trainer = '') {
    return { trainer, phase: trainer ? 'loading' : 'choose', session: null, checkedAt: null };
}

export function acceptSnapshot(previous, data, now = Date.now()) {
    if (!data || data.trainer !== previous.trainer || !['idle', 'focus', 'break'].includes(data.state)) {
        throw new Error('Unexpected trainer or session state');
    }
    const checkedAt = Date.parse(data.checkedAt);
    if (!Number.isFinite(checkedAt) || checkedAt > now + 30000 || now - checkedAt > 120000) {
        throw new Error('Session observation is not fresh');
    }
    if (data.state === 'idle') {
        return {
            ...previous, checkedAt,
            phase: previous.session ? 'complete' : 'idle'
        };
    }
    const session = data.session;
    if (!session || !/^\d{1,12}$/.test(String(session.id)) ||
        !Number.isSafeInteger(session.focusMinutes) || session.focusMinutes < 0 ||
        !/^\d{1,12}$/.test(String(session.centerId)) ||
        typeof session.name !== 'string' || typeof session.centerName !== 'string') {
        throw new Error('Incomplete session observation');
    }
    return {
        trainer: previous.trainer, phase: data.state, checkedAt,
        session: {
            id: String(session.id), name: session.name.slice(0, 240),
            focusMinutes: session.focusMinutes, approximate: session.approximate === true,
            centerId: String(session.centerId), centerName: session.centerName.slice(0, 120)
        }
    };
}

export function unavailable(previous) {
    return { ...previous, phase: 'stale' };
}

export function sessionLinks(model, defaultCenter) {
    const root = 'https://www.focumon.com';
    const id = model.session?.id;
    return {
        open: model.trainer ? `${root}/focus_with/${encodeURIComponent(model.trainer)}` : `${root}/`,
        start: `${root}/focus_sessions/new?training_center_id=${encodeURIComponent(defaultCenter)}`,
        finish: id ? `${root}/focus_sessions/${id}/conclusion_review` : null,
        summary: id ? `${root}/focus_sessions/${id}` : null
    };
}
