import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, acceptSnapshot, unavailable, sessionLinks } from '../../../focus-state.mjs';

const now = Date.now();
const snapshot = (state = 'focus', override = {}) => ({
    trainer: 'shreyas', state, checkedAt: new Date(now).toISOString(),
    session: state === 'idle' ? null : { id: '3076718', name: 'Build something', focusMinutes: 24, centerId: '30354', centerName: 'The Goals Slayers Corp.' },
    ...override
});

test('nothing is called active or completed before a successful observation', () => {
    assert.equal(initialState().phase, 'choose');
    assert.equal(initialState('shreyas').phase, 'loading');
    assert.equal(acceptSnapshot(initialState('shreyas'), snapshot('idle'), now).phase, 'idle');
});

test('break, failure and completion keep only observed minutes', () => {
    const active = acceptSnapshot(initialState('shreyas'), snapshot(), now);
    const paused = acceptSnapshot(active, snapshot('break'), now);
    assert.equal(paused.phase, 'break');
    assert.equal(paused.session.focusMinutes, 24);
    const stale = unavailable(paused);
    assert.equal(stale.phase, 'stale');
    assert.deepEqual(stale.session, paused.session);
    const complete = acceptSnapshot(stale, snapshot('idle'), now);
    assert.equal(complete.phase, 'complete');
    assert.equal(complete.session.focusMinutes, 24);
    assert.equal(acceptSnapshot(complete, snapshot('idle'), now).phase, 'complete');
});

test('a new trainer cannot inherit another trainer’s session or response', () => {
    const changed = initialState('someone_else');
    assert.equal(changed.session, null);
    assert.throws(() => acceptSnapshot(changed, snapshot(), now), /trainer/);
});

test('new session IDs replace the completed session instead of carrying its minutes', () => {
    let model = acceptSnapshot(initialState('shreyas'), snapshot(), now);
    model = acceptSnapshot(model, snapshot('idle'), now);
    const next = snapshot();
    next.session.id = '3076719'; next.session.focusMinutes = 0;
    model = acceptSnapshot(model, next, now);
    assert.equal(model.phase, 'focus');
    assert.equal(model.session.id, '3076719');
    assert.equal(model.session.focusMinutes, 0);
});

test('stale, future, unknown and malformed responses are not trusted', () => {
    for (const override of [
        { checkedAt: new Date(now - 121000).toISOString() },
        { checkedAt: new Date(now + 31000).toISOString() },
        { checkedAt: 'not a date' }, { state: 'finished' }, { session: null },
        { session: { ...snapshot().session, focusMinutes: -1 } },
        { session: { ...snapshot().session, focusMinutes: 1.5 } },
        { session: { ...snapshot().session, id: 'bad/path' } }
    ]) assert.throws(() => acceptSnapshot(initialState('shreyas'), snapshot('focus', override), now));
});

test('handoff links use only Focumon navigation routes, never mutation endpoints', () => {
    const active = acceptSnapshot(initialState('shreyas'), snapshot(), now);
    const links = sessionLinks(active, '30354');
    assert.equal(links.finish, 'https://www.focumon.com/focus_sessions/3076718/conclusion_review');
    assert.equal(links.start, 'https://www.focumon.com/focus_sessions/new?training_center_id=30354');
    assert.equal(links.open, 'https://www.focumon.com/focus_with/shreyas');
    assert.equal(active.phase, 'focus');
    assert.equal(sessionLinks(initialState('shreyas'), '30354').finish, null);
});
