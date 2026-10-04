import fs from 'node:fs'
import type { Plugin } from 'vite'

/** index.html marks where the script goes: early in <head>, before the stylesheet. */
const PLACEHOLDER = '<!-- background-preload -->'
import { BACKGROUND_ROTATE_MS, seededUnit } from '../src/utils/rotatingBackground'

/** Background names (without extension); each needs a .webp and should have an .avif. */
function listBackgrounds(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.webp'))
    .map((name) => name.slice(0, -'.webp'.length))
    .sort((a, b) => a.localeCompare(b))
}

/**
 * Inlines the background list and picker into index.html. The script picks this minute's
 * image and preloads it at high priority, in parallel with the JS bundle; the app reads the
 * pick from `window.__CINEMA_BACKGROUND__`.
 */
export function backgroundsPlugin(backgroundsDir: string): Plugin {
  let base = '/'

  return {
    name: 'backgrounds',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml(html) {
      const names = listBackgrounds(backgroundsDir)
      const script = `(function () {
  var names = ${JSON.stringify(names)};
  if (!names.length) return;
  var seededUnit = ${seededUnit.toString()};
  window.__CINEMA_BACKGROUNDS__ = names;
  // ?debugbg=<name> picks a background (variants are resolved by the app).
  var debug = /[?&]debugbg=([^&]*)/.exec(location.search);
  var wanted = debug && decodeURIComponent(debug[1]);
  var name = wanted && names.indexOf(wanted) >= 0
    ? wanted
    : names[Math.floor(seededUnit(Math.floor(Date.now() / ${BACKGROUND_ROTATE_MS})) * names.length)];
  window.__CINEMA_BACKGROUND__ = name;
  if (wanted && name !== wanted) return;
  var link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.type = 'image/avif';
  link.href = ${JSON.stringify(`${base}backgrounds/`)} + encodeURIComponent(name) + '.avif';
  link.setAttribute('fetchpriority', 'high');
  document.head.appendChild(link);
})();`
      return html.replace(PLACEHOLDER, `<script>${script}</script>`)
    },
  }
}
