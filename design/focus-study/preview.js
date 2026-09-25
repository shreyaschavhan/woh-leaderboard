(async function () {
  'use strict';

  // Load the existing page as context; never copy or rewrite production files.
  // Its analytics scripts are intentionally not executed in this local study.
  const host = document.getElementById('site-preview');
  try {
    const response = await fetch(new URL('index.html', document.baseURI));
    if (!response.ok) throw new Error('Leaderboard preview could not load.');
    const page = new DOMParser().parseFromString(await response.text(), 'text/html');
    page.querySelectorAll('script:not([type="application/json"])').forEach(node => node.remove());
    host.replaceChildren(...Array.from(page.body.childNodes));
    host.querySelector('#focus-session')?.remove();
    host.querySelector('.focus-shortcut')?.remove();
    host.querySelector('.content').prepend(document.getElementById('focus-template').content.cloneNode(true));
    const script = document.createElement('script');
    script.src = new URL('script.js', document.baseURI).href;
    document.body.append(script);
    const focusShortcut = document.createElement('button');
    focusShortcut.type = 'button';
    focusShortcut.className = 'chip';
    focusShortcut.textContent = '✦ Your training';
    focusShortcut.addEventListener('click', () => document.getElementById('focus-session').scrollIntoView());
    host.querySelector('.topbar-actions').prepend(focusShortcut);
  } catch (error) {
    host.textContent = error.message + ' Serve this folder from the repository root.';
    return;
  }

  const byId = id => document.getElementById(id);
  const card = document.querySelector('.focus-card');
  const dialog = byId('focus-handoff');
  const primary = byId('focus-primary');
  const secondary = byId('focus-secondary');
  let state = 'focus';
  let handoff = 'finish';
  let minutes = 24;

  const states = {
    idle: { status: 'Ready when you are', sync: 'No active session', title: 'Great things take focus.', description: 'Your next adventure starts with one small step.', number: 'Let’s go', unit: '', caption: '', taskLabel: 'YOUR NEXT MOVE', task: 'Pick one thing. Give it your attention.', primary: 'Start session', secondary: '', note: 'Choose your session and begin on Focumon.', party: 'Your party is ready.', footer: 'A little focus goes a long way.' },
    focus: { status: 'Focusing', sync: 'Updated just now', title: 'In your element.', description: 'One thing at a time. Something great is taking shape.', unit: 'min', caption: 'focused this session', taskLabel: 'WORKING ON', task: 'Build something that matters', primary: 'Open Focumon', secondary: 'Finish session', note: 'Session controls open in Focumon.', party: 'Better, together.', footer: 'Small steps. Legendary consistency.' },
    break: { status: 'Taking a break', sync: 'Updated just now', title: 'Even heroes take a breath.', description: 'Step back. Stretch out. Your progress is right here.', unit: 'min', caption: 'focused before this break', taskLabel: 'READY WHEN YOU ARE', task: 'Build something that matters', primary: 'Resume on Focumon', secondary: 'Finish session', note: 'Focus time stays put while you recharge.', party: 'Rest is part of the adventure.', footer: 'Come back with a little more energy.' },
    complete: { status: 'Session complete', sync: 'Confirmed by Focumon', title: 'That’s time well spent.', description: 'You showed up. You made progress. That counts.', unit: 'min', caption: 'focused this session', taskLabel: 'SESSION FINISHED', task: 'Build something that matters', primary: 'Start another session', secondary: '', note: 'A new session begins on Focumon.', party: 'Another chapter, together.', footer: 'Consistency is your superpower.' },
    stale: { status: 'Status unavailable', sync: 'Last checked 3 min ago', title: 'Your progress isn’t lost.', description: 'We can’t check Focumon right now. Your session may still be running.', unit: 'min', caption: 'last known focus time', taskLabel: 'LAST KNOWN SESSION', task: 'Build something that matters', primary: 'Check again', secondary: 'Open Focumon', note: 'Check Focumon before starting a new session.', party: 'We’ll catch up shortly.', footer: 'Last known state: focusing.' }
  };

  function setButton(button, text, external) {
    button.replaceChildren(document.createTextNode(text));
    if (external) {
      const arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      button.append(arrow);
    }
  }

  function render(next, resetMinutes = false) {
    if (!states[next]) return;
    if (resetMinutes) minutes = next === 'idle' ? 0 : 24;
    state = next;
    const view = states[state];
    card.dataset.state = state;
    byId('focus-status').lastElementChild.textContent = view.status;
    byId('focus-sync').textContent = view.sync;
    byId('focus-headline').textContent = view.title;
    byId('focus-description').textContent = view.description;
    byId('focus-minutes').textContent = view.number || String(minutes).padStart(2, '0');
    byId('focus-unit').textContent = view.unit;
    byId('focus-time-caption').textContent = view.caption;
    document.querySelector('.focus-time').setAttribute('aria-label', state === 'idle' ? 'Ready to begin' : `${minutes} minutes, ${view.caption}`);
    byId('focus-task-label').textContent = view.taskLabel;
    byId('focus-task-name').textContent = view.task;
    byId('focus-action-note').textContent = view.note;
    byId('focus-party-caption').textContent = view.party;
    byId('focus-footer-message').textContent = view.footer;
    setButton(primary, view.primary, state !== 'stale');
    setButton(secondary, view.secondary, true);
    secondary.hidden = !view.secondary;
    document.querySelectorAll('[data-preview-state]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.previewState === state)));
    byId('focus-announcement').textContent = `${view.status}. ${state === 'idle' ? 'Ready for a new session.' : `${minutes} minutes focused.`}`;
  }

  function openHandoff(action) {
    handoff = action;
    const copy = {
      start: ['Begin on Focumon', 'Choose your session there. This panel updates once your session starts.', 'Preview starting a session'],
      finish: ['Finish on Focumon', 'Your session stays active until you confirm there. We’ll show it as finished once Focumon does.', 'Preview confirming the finish'],
      break: ['Your session on Focumon', 'Take a break using Focumon’s session controls. Your focused minutes stay here.', 'Preview taking a break'],
      resume: ['Back to focus', 'Resume your session on Focumon. We’ll pick up the change here.', 'Preview resuming focus'],
      check: ['Check your session on Focumon', 'See your current session there while this panel reconnects.', 'Preview connection restored']
    }[action];
    byId('handoff-title').textContent = copy[0];
    byId('handoff-description').textContent = copy[1];
    byId('handoff-confirm').textContent = copy[2];
    byId('handoff-minutes').textContent = minutes;
    document.querySelector('.focus-handoff-recap').hidden = action === 'start';
    dialog.showModal();
  }

  primary.addEventListener('click', () => {
    if (state === 'stale') { render('focus'); return; }
    openHandoff(state === 'idle' || state === 'complete' ? 'start' : state === 'break' ? 'resume' : 'break');
  });
  secondary.addEventListener('click', () => openHandoff(state === 'stale' ? 'check' : 'finish'));
  byId('handoff-confirm').addEventListener('click', () => {
    if (handoff === 'start') minutes = 0;
    render(handoff === 'finish' ? 'complete' : handoff === 'break' ? 'break' : 'focus');
    dialog.close();
    primary.focus();
  });
  document.querySelector('.focus-dialog-close').addEventListener('click', () => dialog.close());
  document.querySelectorAll('[data-preview-state]').forEach(button => button.addEventListener('click', () => render(button.dataset.previewState, true)));
  byId('focus-preview-theme').addEventListener('click', () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  });
  byId('focus-garden').addEventListener('click', () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
  const requestedState = new URLSearchParams(location.search).get('state');
  render(states[requestedState] ? requestedState : 'focus', true);
  await document.fonts.ready;
  requestAnimationFrame(() => document.getElementById('focus-session').scrollIntoView({ behavior: 'instant' }));
})();
