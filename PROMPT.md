# Build YTM Restyle with your coding agent

If you do not want to clone this repository, give the prompt below to a
coding agent that can edit files and control a browser. The agent builds the
extension from zero.

YouTube Music changes its page structure from time to time. The selectors in
the prompt were correct in November 2026. The prompt tells the agent to check
them in the live page first.

---

## Prompt

Build a Manifest V3 browser extension named "YTM Restyle" that restyles
`https://music.youtube.com`. Use plain CSS and plain JavaScript. Use no build
step, no framework, and no dependencies.

### Rules

- Before you write a style, inspect the live page. Confirm that each selector
  and each CSS variable in this prompt still exists. If one is gone, find its
  replacement in the live DOM.
- After each feature, load the result in a real browser page and look at a
  screenshot. Do not report a feature as done until you have seen it.
- Make the smallest change that gives the result. Do not restyle parts that
  this prompt does not name.
- Keep keyboard focus styles and `prefers-reduced-motion` support.

### Files

- `manifest.json`: a content script (`style.css` and `content.js`) on
  `https://music.youtube.com/*` at `document_start`, the `storage`
  permission, and an action popup.
- `style.css`: all styles. Put each feature group in one nested block,
  `html:not(.ytmx-no-<group>) { ... }`, so each group is on by default and a
  class on `<html>` turns it off. Put tunable values in CSS variables on
  `html`.
- `content.js`: applies the settings, paints the ambient canvas, and adds the
  small DOM parts that CSS cannot add.
- `popup.html` and `popup.js`: one switch for each group, plus sliders. Save
  to `chrome.storage.local`, because a slider drag exceeds the write limit of
  `chrome.storage.sync`. Apply changes immediately through
  `chrome.storage.onChanged`. Add a reset button.

### Feature groups

1. **Look.** Set the site color variables on `html`
   (`--ytmusic-general-background-c`, `--ytmusic-background`,
   `--ytmusic-nav-bar`, `--ytmusic-player-bar-background`) to a near-black
   background and a translucent glass color. Add `backdrop-filter` blur to
   `#nav-bar-background` and `#player-bar-background`. Use a system font
   stack. Round the artwork, but keep circle crops
   (`[thumbnail-crop="MUSIC_THUMBNAIL_CROP_CIRCLE"]`) as circles.
2. **Layout.** On `ytmusic-app`, set `--ytmusic-content-width` to give 48px
   side gutters. Show five large cards in a row with
   `--ytmusic-carousel-item-base-width`. Give each
   `ytmusic-two-row-item-renderer` padding, a radius, and a brighter
   background on hover. Make the card play button white, and move it up into
   view on hover.
3. **Home page.** Turn shelves of song rows (`ytmusic-carousel` that contains
   `ytmusic-responsive-list-item-renderer`) into a grid of tiles: three
   columns, four rows of 64px, artwork flush with the tile edge. Make the
   mood chip header `position: sticky` below the navigation bar. Add a
   "Hide shelves" setting: a list of words, and a shelf is hidden when its
   title contains one of them.
4. **Declutter.** Hide `ytmusic-mealbar-promo-renderer`,
   `ytmusic-statement-banner-renderer`,
   `ytmusic-guide-signin-promo-renderer`,
   `ytmusic-tastebuilder-shelf-renderer`, `ytmusic-cast-button`, and
   `#nav-bar-divider`. Dim the secondary player buttons until the pointer or
   the focus is on the player bar.
5. **Ambient mode.** Append a 64x36 `<canvas>` to `<html>`. Style it
   `position: fixed`, `z-index: -1`, larger than the window, with a 48px blur
   and 0.55 opacity. Ten times each second, draw the current source on it
   with `globalAlpha` 0.12, which gives a slow fade. The source is the
   `<video>` when `ytmusic-player` has the `video-mode` attribute. If not, it
   is `ytmusic-player-bar img.image`. Do not draw while the tab is hidden.
6. **Floating panels.** Make the player bar a floating pill: inset
   `[slot="player-bar"]` and `#player-bar-background` 12px from the left,
   right, and bottom, with a 20px radius. Make the open sidebar
   (`ytmusic-guide-renderer:not([is-collapsed])`) a rounded panel that stops
   above the pill. Use the same surface for all panels: white at 5.5%
   opacity with a 1px inner border.
7. **Now-playing page.** In `ytmusic-player-page`, make `#main-panel` a
   centered column. Below the artwork, add a title block. Its text comes from
   `ytmusic-player-bar .title` and from the `title` attribute of
   `ytmusic-player-bar .byline`. Scale the artwork to 0.92 while the video
   element is paused. Put `#side-panel` in a rounded panel. Make lyrics
   (`ytmusic-description-shelf-renderer[is-track-lyrics-page] .description`)
   22px and bold. Add a "Focus" button that hides `#main-panel`, centers
   `#side-panel` at 760px, and shows centered 32px lyrics.
8. **Player bar order.** Change only the grid of `ytmusic-player-bar`:
   `grid-template-areas: "middle start end"` with columns
   `minmax(0, 1fr) auto minmax(0, 1fr)`. This puts the track on the left and
   the transport controls in the center.

### Known traps

- The page `body` is an opaque black strip, 112px high. It covers the ambient
  canvas. Make it transparent.
- `.background-gradient.ytmusic-browse-response` repeats down the page. If
  you make the gradient end in `transparent`, also set
  `background-repeat: no-repeat`, or dark bands show on the home page.
- `ytmusic-player-page` has an opaque background. When you make it
  transparent, hide `ytmusic-app-layout > [slot="content"]` while
  `ytmusic-app-layout` has the `player-page-open` attribute.
- On the open player page, remove the backgrounds of `#nav-bar-background`,
  `#player-bar-background`, and `#mini-guide-background`. If not, the ambient
  color does not fill the window.
- `a.image-wrapper` in a card has a fixed width. Set it to `100%` when you
  add padding to the card.
- The site draws the progress slider track 16px to the right of the slider
  box. Correct `#progress-bar` when you inset the player bar.
- Size rules for the now-playing artwork must apply only when
  `ytmusic-player-page` has `player-page-open`. If not, the mini player
  becomes very large.
- The site opens `#suggestion-list` before it has suggestions. Hide the list
  while it has no `ytmusic-search-suggestion` or
  `ytmusic-responsive-list-item-renderer`.
- The player bar play icon is 40px. Set `--yt-icon-button-icon-width` and
  `--yt-icon-button-icon-height` if you change the button size.
- The page uses Trusted Types. Do not use `eval` or `innerHTML` in
  `content.js`. Build elements with `document.createElement`.

### Checks before you finish

Look at screenshots of these states, with a track playing:

- The home page at the top, and after a scroll.
- The now-playing page with a song, and with a music video.
- The now-playing page with the lyrics tab, with focus mode on and off.
- The search box with no text, and with typed text.
- Each popup switch turned off, then on again.

Tell the user which states you did not see.
