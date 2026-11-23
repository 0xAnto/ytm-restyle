// Part 1 applies the popup settings. Part 2 paints ambient mode.
// Part 3 adds the title block and the focus button to the now-playing page.
// Part 4 hides home page shelves by title.

// A boolean setting turns a style group on or off with a class on <html>.
// "hide-shelves" is a list of words. Any other setting is the value of a
// CSS variable. See style.css.
const root = document.documentElement;
let hiddenShelfWords = [];
const applySettings = (settings) => {
  for (const [key, value] of Object.entries(settings)) {
    if (key === 'hide-shelves') {
      hiddenShelfWords = (value ?? '')
        .toLowerCase()
        .split(',')
        .map((word) => word.trim())
        .filter(Boolean);
    } else if (typeof value === 'boolean') root.classList.toggle(`ytmx-no-${key}`, !value);
    else if (value === undefined) {
      // The popup reset removes the key. Go back to the style.css default.
      root.classList.remove(`ytmx-no-${key}`);
      root.style.removeProperty(`--ytmx-${key}`);
    } else root.style.setProperty(`--ytmx-${key}`, value);
  }
};
chrome.storage.local.get().then(applySettings);
chrome.storage.onChanged.addListener((changes) =>
  applySettings(
    Object.fromEntries(Object.entries(changes).map(([key, change]) => [key, change.newValue])),
  ),
);

// Ambient mode: paints the current video frame or album art on a small
// canvas behind the page. style.css blurs the canvas and scales it up.
// ponytail: a full-page backdrop, not a glow that follows the video edges.
// If you want the edge glow, position a second canvas on the video rectangle.

const FPS = 10;
const BLEND = 0.12; // Share of the new frame in each paint. Lower = slower fade.

const canvas = document.createElement('canvas');
canvas.id = 'ytmx-ambient';
canvas.width = 64;
canvas.height = 36;
const ctx = canvas.getContext('2d');
ctx.globalAlpha = BLEND;
root.append(canvas);

setInterval(() => {
  if (document.hidden || root.classList.contains('ytmx-no-ambient')) return;
  const video = document.querySelector('video');
  const art = document.querySelector('ytmusic-player-bar img.image');
  const videoMode = document.querySelector('ytmusic-player')?.hasAttribute('video-mode');
  const source =
    videoMode && video?.readyState >= 2 && video.videoWidth
      ? video
      : art?.complete && art.naturalWidth
        ? art
        : null;
  if (!source) return;
  try {
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  } catch {
    // A broken image or a protected frame cannot be painted. Keep the last frame.
  }
}, 1000 / FPS);

// Now-playing page: a title and an artist line below the artwork. The text
// comes from the player bar, so the site stays the single source of the data.
const nowPlaying = document.createElement('div');
nowPlaying.id = 'ytmx-np';
const npTitle = document.createElement('div');
npTitle.id = 'ytmx-np-title';
const npByline = document.createElement('div');
npByline.id = 'ytmx-np-byline';
nowPlaying.append(npTitle, npByline);

const focusButton = document.createElement('button');
focusButton.id = 'ytmx-focus';
focusButton.type = 'button';
focusButton.textContent = 'Focus';
focusButton.setAttribute('aria-pressed', 'false');
focusButton.addEventListener('click', () => {
  const on = root.classList.toggle('ytmx-focus');
  focusButton.textContent = on ? 'Exit focus' : 'Focus';
  focusButton.setAttribute('aria-pressed', String(on));
});

// ponytail: a timer, not a MutationObserver. The check costs four DOM
// queries. Use an observer on ytmusic-player-bar if the timer shows in a profile.
setInterval(() => {
  if (document.hidden || root.classList.contains('ytmx-no-nowplaying')) return;
  const panel = document.querySelector('ytmusic-player-page #main-panel');
  if (!panel) return;
  if (nowPlaying.parentElement !== panel) panel.append(nowPlaying);
  const page = panel.closest('ytmusic-player-page');
  if (focusButton.parentElement !== page) page.append(focusButton);
  const bar = document.querySelector('ytmusic-player-bar');
  const title = bar?.querySelector('.title')?.textContent.trim() ?? '';
  const byline = bar?.querySelector('.byline')?.getAttribute('title') ?? '';
  if (npTitle.textContent !== title) npTitle.textContent = title;
  if (npByline.textContent !== byline) npByline.textContent = byline;
  root.classList.toggle('ytmx-paused', document.querySelector('video')?.paused ?? true);
}, 250);

// Home page: hide each shelf whose title has a word from the "Hide shelves"
// setting. The site adds shelves during a scroll, so this runs on a timer.
setInterval(() => {
  if (document.hidden) return;
  for (const shelf of document.querySelectorAll(
    'ytmusic-browse-response ytmusic-section-list-renderer > #contents > *',
  )) {
    const title = shelf.querySelector('.title')?.textContent.toLowerCase() ?? '';
    shelf.classList.toggle(
      'ytmx-hidden-shelf',
      hiddenShelfWords.some((word) => title.includes(word)),
    );
  }
}, 1000);
