(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const roster = JSON.parse($('trainer-data').textContent);
  const trainers = new Map(roster.map(trainer => [trainer.id, trainer]));
  const samples = ['focus', 'break', 'idle', 'choose', 'complete', 'busy', 'empty', 'stale'];
  let view = params.get('view') === 'before' ? 'before' : 'after';
  let sample = samples.includes(params.get('state')) ? params.get('state') : 'focus';
  let trainerId = sample === 'choose' ? '' : roster[0].id;
  let previousTrainer = roster[0].id;
  let minutes = 42;
  let action = 'break';
  let opener;
  const picker = $('focus-trainer-select');
  const card = document.querySelector('.focus-card');
  const handoff = $('study-handoff');
  const primary = $('focus-primary');
  const secondary = $('focus-secondary');
  const views = {
    choose: ['Find your focus', 'Your next chapter starts here.', 'Choose your trainer to see your Focumon session.', 'YOUR NEXT MOVE', 'Your party is ready.'],
    idle: ['Ready when you are', 'Great things take focus.', 'Your next adventure starts with one small step.', 'YOUR NEXT MOVE', 'Your party is ready.'],
    focus: ['Focusing', 'In your element.', 'One thing at a time. Something great is taking shape.', 'WORKING ON', 'Better, together.'],
    break: ['Taking a break', 'Even heroes take a breath.', 'Step back. Stretch out. Your progress is right here.', 'READY WHEN YOU ARE', 'Rest is part of the adventure.'],
    complete: ['Session ended', 'That’s time well spent.', 'You showed up. You made progress. That counts.', 'SESSION FINISHED', 'Another chapter, together.'],
    stale: ['Status unavailable', 'Your training is still yours.', 'We can’t check Focumon right now. Your session may still be running.', 'LAST KNOWN SESSION', 'We’ll catch up shortly.']
  };
  const phase = () => !trainerId ? 'choose' : sample === 'busy' ? 'focus' : sample === 'empty' ? 'idle' : sample;
  for (const trainer of [...roster].sort((a, b) => a.name.localeCompare(b.name))) picker.add(new Option(trainer.name, trainer.id));

  const guild = mountGuild(next => {
    if (sample === 'stale' && next === 'live') {
      sample = 'focus';
      render();
    } else {
      minutes = guild.minutesFor(trainerId);
      renderFocus();
      updateReview();
    }
  });

  function setLink(link, label) {
    link.hidden = !label;
    if (!label) return;
    link.href = 'https://www.focumon.com/';
    link.replaceChildren(document.createTextNode(label));
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    link.append(arrow);
  }

  function renderFocus() {
    const current = phase();
    const copy = views[current];
    const trainer = trainers.get(trainerId);
    const hasSession = ['focus', 'break', 'complete', 'stale'].includes(current);
    card.dataset.state = current;
    card.setAttribute('aria-busy', 'false');
    picker.value = trainerId;
    picker.options[0].textContent = view === 'before' ? 'Choose your trainer' : 'Choose trainer';
    $('focus-status').lastElementChild.textContent = copy[0];
    $('focus-sync').textContent = current === 'choose' ? '' : current === 'idle' ? 'No active session' : current === 'stale' ? 'Last checked 3 min ago' : 'Updated just now';
    $('focus-headline').textContent = copy[1];
    $('focus-description').textContent = copy[2];
    $('focus-task-label').textContent = copy[3];
    $('focus-party-caption').textContent = copy[4];
    $('focus-minutes').textContent = hasSession ? minutes : current === 'idle' ? 'Let’s go' : '—';
    $('focus-unit').textContent = hasSession ? 'min' : '';
    $('focus-time-caption').textContent = !hasSession ? '' : current === 'break' ? 'focused before this break' : current === 'stale' ? 'last known focus time' : current === 'complete' ? 'last tracked focus time' : 'focused this session';
    const time = document.querySelector('.focus-time');
    time.hidden = view === 'after' && !hasSession;
    time.classList.toggle('is-long', hasSession && minutes >= 100);
    time.classList.toggle('is-very-long', hasSession && minutes >= 1000);
    time.setAttribute('aria-label', hasSession ? minutes + ' minutes, ' + $('focus-time-caption').textContent : copy[0]);
    document.querySelector('.focus-task').hidden = view === 'after' && !hasSession;
    $('focus-task-name').textContent = hasSession ? 'Build something that matters' : 'Pick one thing. Give it your attention.';
    document.querySelector('.focus-party').hidden = !trainer;
    for (const [selector, imageSource] of [['.focus-trainer', trainer?.avatar], ['.focus-companion', trainer?.focumon]]) {
      const image = document.querySelector(selector);
      image.hidden = !imageSource;
      if (imageSource) image.src = imageSource;
    }
    $('focus-trainer-name').textContent = trainer?.name || 'YOUR PARTY';
    document.querySelector('.focus-scene').setAttribute('aria-label', trainer ? trainer.name + ' and their Focumon overlooking a moonlit mountain forest' : 'A moonlit mountain training ground');
    $('focus-retry').hidden = current !== 'stale';
    setLink(primary, current === 'stale' ? '' : current === 'idle' ? 'Start session' : current === 'complete' ? 'Start another session' : current === 'break' ? 'Resume on Focumon' : 'Open Focumon');
    setLink(secondary, ['focus', 'break'].includes(current) ? 'Finish session' : current === 'stale' ? 'Open Focumon' : current === 'complete' ? 'View summary' : '');
    $('focus-action-note').textContent = current === 'break' ? 'Focus time stays put while you recharge.' : current === 'stale' ? 'Check Focumon before starting a new session.' : 'Use the same trainer on Focumon.';
    $('focus-tracking-note').textContent = 'Start and finish sessions on Focumon.';
    $('focus-announcement').textContent = copy[0] + '.' + (hasSession ? ' ' + minutes + ' minutes focused.' : '');
  }

  function updateReview() {
    document.querySelectorAll('[data-study-style]').forEach(sheet => { sheet.media = sheet.dataset.studyStyle === view ? 'all' : 'not all'; });
    document.documentElement.dataset.studyView = view;
    $('study-before').setAttribute('aria-pressed', String(view === 'before'));
    $('study-after').setAttribute('aria-pressed', String(view === 'after'));
    $('study-state').value = sample;
    $('study-caption').textContent = view === 'before' ? 'Original scale and night palette.' : 'Smaller scenes. More room to breathe.';
    const url = new URL(location.href);
    url.searchParams.set('view', view);
    url.searchParams.set('state', sample);
    try { history.replaceState(null, '', url); } catch { /* Comparison also works from a local file. */ }
  }

  function keepContext(change) {
    const sections = [...document.querySelectorAll('#focus-session,#focusing-now,.spotlights,#standings')];
    const anchor = sections.find(section => { const r = section.getBoundingClientRect(); return r.top <= 160 && r.bottom > 160; });
    const offset = anchor?.getBoundingClientRect().top;
    const top = scrollY;
    change();
    window.scrollTo({ top: anchor ? anchor.getBoundingClientRect().top + scrollY - offset : top, behavior: 'instant' });
  }

  function render() {
    const current = phase();
    guild.setState(sample === 'busy' ? 'busy' : sample === 'empty' ? 'empty' : sample === 'stale' ? 'offline' : 'live');
    guild.setPersonal(trainerId, current, minutes);
    renderFocus();
    updateReview();
  }

  function chooseSample(next) {
    if (!samples.includes(next)) return;
    sample = next;
    if (next === 'choose') { previousTrainer = trainerId || previousTrainer; trainerId = ''; }
    else trainerId ||= previousTrainer;
    keepContext(render);
  }

  function compare(next) {
    keepContext(() => { view = next; updateReview(); renderFocus(); });
    $('study-announcement').textContent = (view === 'before' ? 'Original' : 'Proposed') + ' design. Same sample sessions.';
  }

  function openHandoff(next, button) {
    action = next;
    opener = button;
    const labels = {
      start: ['Begin on Focumon', 'Preview starting a session'],
      break: ['Your session on Focumon', 'Preview taking a break'],
      resume: ['Back to focus', 'Preview resuming focus'],
      finish: ['Finish on Focumon', 'Preview confirming the finish'],
      check: ['Check your session', 'Preview connection restored'],
      summary: ['Time well spent', 'Return to your session']
    }[next];
    $('study-handoff-title').textContent = labels[0];
    $('study-confirm').textContent = labels[1];
    handoff.showModal();
  }

  primary.addEventListener('click', event => {
    event.preventDefault();
    const current = phase();
    if (current === 'choose') { picker.focus(); return; }
    openHandoff(['idle', 'complete'].includes(current) ? 'start' : current === 'break' ? 'resume' : 'break', primary);
  });
  secondary.addEventListener('click', event => {
    event.preventDefault();
    openHandoff(phase() === 'stale' ? 'check' : phase() === 'complete' ? 'summary' : 'finish', secondary);
  });
  $('focus-retry').addEventListener('click', () => chooseSample('focus'));
  $('study-confirm').addEventListener('click', () => {
    if (action === 'start') minutes = 0;
    handoff.close();
    if (action !== 'summary') chooseSample(action === 'finish' ? 'complete' : action === 'break' ? 'break' : 'focus');
    requestAnimationFrame(() => primary.focus({ preventScroll: true }));
  });
  for (const button of [document.querySelector('.study-close'), $('study-cancel')]) button.addEventListener('click', () => handoff.close());
  handoff.addEventListener('close', () => { if (opener && !opener.hidden) opener.focus({ preventScroll: true }); });
  picker.addEventListener('change', () => {
    trainerId = picker.value;
    if (trainerId) { previousTrainer = trainerId; minutes = guild.minutesFor(trainerId); }
    if (!trainerId) sample = 'choose';
    else if (sample === 'choose') sample = 'focus';
    keepContext(render);
  });
  document.addEventListener('woh:me-change', event => {
    if (!trainers.has(event.detail?.id)) return;
    trainerId = previousTrainer = event.detail.id;
    minutes = guild.minutesFor(trainerId);
    if (sample === 'choose') sample = 'focus';
    keepContext(render);
  });
  $('study-before').addEventListener('click', () => compare('before'));
  $('study-after').addEventListener('click', () => compare('after'));
  $('study-state').addEventListener('change', event => chooseSample(event.target.value));
  $('study-theme').addEventListener('click', () => $('theme-toggle').click());
  $('study-change').addEventListener('click', () => {
    window.scrollTo({ top: $('focus-session').getBoundingClientRect().top + scrollY - 20, behavior: 'instant' });
  });
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const target = $(link.getAttribute('href').slice(1));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth' });
  }));
  render();
  document.documentElement.dataset.studyReady = 'true';
})();
