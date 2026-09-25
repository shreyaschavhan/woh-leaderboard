import { mountGuild } from './guild-preview.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
let mode = params.get('view') === 'before' ? 'before' : 'after';
let sample = ['live','busy','empty','partial','offline'].includes(params.get('state')) ? params.get('state') : 'live';

function updateReview() {
  $('review-before').setAttribute('aria-pressed', String(mode === 'before'));
  $('review-after').setAttribute('aria-pressed', String(mode === 'after'));
  $('review-caption').textContent = mode === 'before' ? 'Current homepage' : 'Sample sessions';
  $('review-state').disabled = mode === 'before';
  $('review-state').value = sample;
  const url = new URL(location.href);
  url.searchParams.set('view', mode);
  if (sample === 'live') url.searchParams.delete('state');
  else url.searchParams.set('state', sample);
  history.replaceState(null, '', url);
}

const guild = mountGuild(document, $('guild-template'), $('guild-dialog-template'), next => {
  sample = next;
  updateReview();
});
guild.setState(sample);
guild.setVisible(mode === 'after');
updateReview();

// Like the earlier studies: an in-place comparison in the native page.
// Prevent scroll anchoring from moving the view when the added section hides.
function keepPosition(change) {
  const left = window.scrollX;
  const top = window.scrollY;
  change();
  window.scrollTo({left, top, behavior: 'instant'});
}

function setMode(next) {
  keepPosition(() => {
    mode = next;
    guild.setVisible(mode === 'after');
    updateReview();
  });
}

function viewChange() {
  const training = $('focus-session');
  const trainingGap = parseFloat(getComputedStyle(training).marginBottom);
  const guildGap = parseFloat(getComputedStyle(guild.element).marginTop);
  const top = training.getBoundingClientRect().bottom + window.scrollY + Math.max(trainingGap, guildGap) - 20;
  window.scrollTo({top, behavior: 'instant'});
}

$('review-before').addEventListener('click', () => setMode('before'));
$('review-after').addEventListener('click', () => setMode('after'));
$('review-change').addEventListener('click', viewChange);
$('review-state').addEventListener('change', event => {
  keepPosition(() => {
    sample = event.target.value;
    guild.setState(sample);
    updateReview();
  });
});

// The snapshot uses the repository root as its asset base. Keep same-page
// anchors in this preview, while retaining the homepage's normal interactions.
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
});
