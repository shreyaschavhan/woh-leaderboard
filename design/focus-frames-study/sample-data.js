// Deterministic examples for design review, never claims about live activity.
(() => {
  const params = new URLSearchParams(location.search);
  const scenarios = new Set(['focus', 'choose', 'break', 'ready', 'quiet', 'offline']);
  const scenario = scenarios.has(params.get('sample')) ? params.get('sample') : 'focus';
  const theme = params.get('theme') === 'dark' ? 'dark' : 'light';
  const view = params.get('view') === 'before' ? 'before' : 'after';
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.frameView = view;
  if (params.has('capture')) document.documentElement.dataset.frameCapture = '';
  const review = window.frameReview = {
    scenario, view, theme, requests: [], errors: [], ready: false,
  };
  window.addEventListener('error', event => review.errors.push(event.message));
  window.addEventListener('unhandledrejection', event => review.errors.push(String(event.reason)));
  const nativeFetch = window.fetch.bind(window);
  const examples = {
    saamm_qpme: { minutes: 24, name: 'mindset', state: 'focus' },
    shreyas: { minutes: 47, name: 'Building my bug bounty AI system', state: 'focus' },
    t3po: { minutes: 18, name: 'Learning', state: 'focus' },
    Srishti_QuOP: { minutes: 126, name: 'Read and reflect', state: 'break' },
  };
  function observation(trainer) {
    const example = examples[trainer];
    let state = scenario === 'quiet' ? 'idle' : example?.state || 'idle';
    if (trainer === 'shreyas' && scenario === 'break') state = 'break';
    if (trainer === 'shreyas' && scenario === 'ready') state = 'idle';
    return {
      trainer, state, checkedAt: new Date().toISOString(),
      session: state === 'idle' ? null : {
        id: String(900000 + Object.keys(examples).indexOf(trainer)),
        focusMinutes: example.minutes, approximate: false, name: example.name,
        centerId: '30354', centerName: 'The Goals Slayers Corp.',
      },
    };
  }
  window.fetch = async (input, options) => {
    const url = new URL(input instanceof Request ? input.url : String(input), document.baseURI);
    const personal = url.pathname.match(/\/api\/focus\/([^/]+)\/?$/);
    const community = url.pathname.match(/\/api\/community\/(\d+)\/?$/);
    if (!personal && !community) return nativeFetch(input, options);
    review.requests.push({ path: url.pathname, mocked: true });
    if (scenario === 'offline') return new Response('{}', { status: 503 });
    let body;
    if (personal) body = observation(decodeURIComponent(personal[1]));
    else {
      const roster = JSON.parse(document.getElementById('trainer-data').textContent);
      const page = Number(community[1]);
      body = {
        page, total: roster.length, pageSize: 8, pages: Math.max(1, Math.ceil(roster.length / 8)),
        checkedAt: new Date().toISOString(),
        trainers: roster.slice(page * 8, (page + 1) * 8).map(trainer => observation(trainer.id)),
      };
    }
    return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
  };
})();
