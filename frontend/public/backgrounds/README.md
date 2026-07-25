# Background images

Drop high-quality cinema / film stills here:

- `.webp` (preferred)
- `.jpg` / `.jpeg` / `.png` / `.avif`

One image is chosen from a light hash of the current **UTC minute**,
**once per page load**. It does not change until the user refreshes.

## Performance tips

- Prefer **WebP**
- Aim for about **1600–2000px** wide
- Target roughly **150–400KB** per image (backgrounds are faded, so heavy files are wasted)
- Restart the Vite dev server (or rebuild) after adding/removing files

Open this folder on Windows:

```bat
explorer K:\projects\cinema\frontend\public\backgrounds
```
