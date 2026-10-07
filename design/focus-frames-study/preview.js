(() => {
  const review = window.frameReview;
  const $ = id => document.getElementById(id);
  function updateControls() {
    $('frame-before').setAttribute('aria-pressed', String(review.view === 'before'));
    $('frame-after').setAttribute('aria-pressed', String(review.view === 'after'));
    $('frame-caption').textContent = review.view === 'before' ? 'Current rounded frames.' : 'Stepped corners. Same content.';
    $('frame-theme').textContent = review.theme === 'light' ? 'Dark theme' : 'Light theme';
    $('frame-sample').value = review.scenario;
  }
  function saveUrl() {
    const url = new URL(location.href);
    url.searchParams.set('view', review.view);
    url.searchParams.set('theme', review.theme);
    url.searchParams.set('sample', review.scenario);
    try { history.replaceState(null, '', url); } catch { /* A file preview still works. */ }
  }
  function compare(view) {
    const top = scrollY;
    review.view = view;
    document.documentElement.dataset.frameView = view;
    updateControls();
    saveUrl();
    window.scrollTo({ top, behavior: 'instant' });
    $('frame-announcement').textContent = `${view === 'before' ? 'Current' : 'Proposed'} frames. Same sample sessions.`;
  }
  $('frame-before').addEventListener('click', () => compare('before'));
  $('frame-after').addEventListener('click', () => compare('after'));
  $('frame-theme').addEventListener('click', () => {
    review.theme = review.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = review.theme;
    updateControls();
    saveUrl();
  });
  $('theme-toggle').addEventListener('click', () => {
    review.theme = document.documentElement.dataset.theme;
    updateControls();
    saveUrl();
  });
  $('frame-sample').addEventListener('change', () => {
    const url = new URL(location.href);
    url.searchParams.set('sample', $('frame-sample').value);
    url.hash = 'focus-session';
    location.href = url.href;
  });
  $('frame-view-cards').addEventListener('click', () => document.querySelector('.focus-hub').scrollIntoView({ behavior: 'smooth' }));
  // The asset base points to the repo root. Keep fragment jumps in this preview.
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    const target = document.getElementById(anchor.getAttribute('href').slice(1));
    if (target) anchor.addEventListener('click', event => {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Use the real component events rather than a second hand-written renderer.
  document.dispatchEvent(new CustomEvent('woh:me-change', {
    detail: { id: review.scenario === 'choose' ? '' : 'shreyas' },
  }));
  updateControls();
  saveUrl();
  async function settle() {
    await document.fonts.ready;
    const expected = {
      focus: 'focus', choose: 'choose', break: 'break', ready: 'idle', quiet: 'idle', offline: 'stale',
    }[review.scenario];
    const started = performance.now();
    while (document.querySelector('.focus-card').dataset.state !== expected ||
           $('focusing-now').getAttribute('aria-busy') === 'true') {
      if (performance.now() - started > 5000) {
        review.errors.push('Sample panels did not settle.');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    // Off-screen leaderboard portraits are lazy-loaded. Only the reviewed
    // panels need to finish decoding before the comparison is ready.
    await Promise.all([...document.querySelectorAll('.focus-hub img')]
      .filter(image => image.getAttribute('src') && !image.hidden)
      .map(image => {
        image.loading = 'eager';
        return image.decode().catch(() => review.errors.push(`Artwork did not load: ${image.getAttribute('src')}`));
      }));
    review.ready = true;
    if (!document.documentElement.hasAttribute('data-frame-capture')) {
      document.querySelector('.focus-hub').scrollIntoView({ behavior: 'instant' });
    }
  }
  settle();
})();
