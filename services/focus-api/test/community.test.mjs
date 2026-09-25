import test from 'node:test';
import assert from 'node:assert/strict';
import { initialCommunity, acceptCommunityPage, unavailableCommunity, expireCommunity, communitySummary, validateCommunityPage, FRESH_MS } from '../../../community-state.mjs';

const now = Date.now();
const item = (trainer, state = 'focus', minutes = 24) => ({
    trainer, state, checkedAt: new Date(now).toISOString(),
    session: state === 'idle' ? null : { id: '3076718', focusMinutes: minutes, approximate: false }
});
const page = trainers => ({ page: 0, pageSize: 8, pages: 1, total: trainers.length, checkedAt: new Date(now).toISOString(), trainers });

test('pending and unavailable trainers are never reported as confirmed idle or live', () => {
    const initial = initialCommunity(['one', 'two']);
    assert.equal(communitySummary(initial).checked, 0);
    assert.equal(communitySummary(initial).loading, 2);
    const partial = acceptCommunityPage(initial, page([item('one'), { trainer: 'two', state: 'unavailable' }]), now);
    const summary = communitySummary(partial);
    assert.equal(summary.checked, 1);
    assert.equal(summary.focusing, 1);
    assert.equal(summary.unknown, 1);
});

test('breaks retain observed focus minutes; failures retain but do not count stale sessions', () => {
    let model = acceptCommunityPage(initialCommunity(['one', 'two']), page([item('one'), item('two', 'break', 32)]), now);
    assert.equal(communitySummary(model).resting, 1);
    model = unavailableCommunity(model, ['one']);
    assert.equal(communitySummary(model).focusing, 0);
    assert.equal(communitySummary(model).sessions.length, 2);
    assert.equal(model.get('one').session.focusMinutes, 24);
    assert.equal(model.get('two').session.focusMinutes, 32);
    assert.equal(expireCommunity(model, now + 60000).get('two').session.focusMinutes, 32);
});

test('confirmed idle removes an ended session and a new session resets its time', () => {
    let model = acceptCommunityPage(initialCommunity(['one']), page([item('one')]), now);
    model = acceptCommunityPage(model, page([item('one', 'idle')]), now);
    assert.equal(communitySummary(model).sessions.length, 0);
    assert.equal(model.get('one').session, null);
    const next = item('one', 'focus', 0);
    next.session.id = '3076719';
    model = acceptCommunityPage(model, page([next]), now);
    assert.equal(model.get('one').session.focusMinutes, 0);
    assert.equal(model.get('one').session.id, '3076719');
});

test('expired observations stop contributing to live counts, including idle coverage', () => {
    let model = acceptCommunityPage(initialCommunity(['one', 'two']), page([item('one'), item('two', 'idle')]), now);
    model = expireCommunity(model, now + FRESH_MS + 1);
    assert.equal(communitySummary(model).checked, 0);
    assert.equal(communitySummary(model).unknown, 2);
    assert.equal(communitySummary(model).sessions.length, 1);
});

test('malformed or old individual data cannot create a live session', () => {
    for (const bad of [
        { ...item('one'), checkedAt: new Date(now - FRESH_MS - 1).toISOString() },
        { ...item('one'), state: 'finished' },
        { ...item('one'), session: null },
        { ...item('one'), session: { ...item('one').session, focusMinutes: -1 } },
        { ...item('one'), session: { ...item('one').session, focusMinutes: 1.5 } },
        { ...item('one'), session: { ...item('one').session, id: '../bad' } }
    ]) {
        const result = acceptCommunityPage(initialCommunity(['one']), page([bad]), now);
        assert.equal(communitySummary(result).focusing, 0);
        assert.equal(communitySummary(result).unknown, 1);
    }
});

test('pagination is bounded and duplicated membership or expired batches are rejected', () => {
    for (const bad of [
        { ...page([item('one')]), total: 10000 },
        { ...page([item('one')]), pages: 99 },
        { ...page([item('one')]), page: -1 },
        { ...page([item('one')]), checkedAt: new Date(now - FRESH_MS - 1).toISOString() },
        page([item('one'), item('one')])
    ]) assert.throws(() => validateCommunityPage(bad, now));
});

test('unrelated trainers and older observations cannot replace the local roster or newer state', () => {
    let model = acceptCommunityPage(initialCommunity(['one']), page([item('one'), item('unrelated')]), now);
    const old = { ...item('one', 'idle'), checkedAt: new Date(now - 1000).toISOString() };
    model = acceptCommunityPage(model, page([old]), now);
    assert.equal(model.size, 1);
    assert.equal(model.get('one').state, 'focus');
});
