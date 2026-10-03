# Background images

One still is picked from a hash of the current **UTC minute**, once per page load, by an
inline script in `index.html` (see `scripts/backgroundsPlugin.ts`). That script also
preloads the image so it arrives together with the page.

Each background is a pair of files with the same name: `<name>.avif` (served to modern
browsers) and `<name>.webp` (fallback). Add one with:

```bash
yarn optimize-background path/to/still.jpg [name]
```

This resizes to 1600px wide and compresses heavily (typically 15–60 KB per file); the
images are shown faded, so the extra compression isn't visible. Rebuild or restart the
dev server afterwards.
