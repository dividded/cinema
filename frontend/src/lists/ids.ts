// Shared with vite.config.ts (which writes a page per route for GitHub Pages), so this file
// must stay free of imports.

export const LIST_IDS = ['ss-directors-2012', 'ss-critics-2012', 'tspdt-1000'] as const;

export type ListId = (typeof LIST_IDS)[number];

/** Every app route besides "/", without the leading slash. */
export const STATIC_ROUTES = ['history', ...LIST_IDS.map((id) => `lists/${id}`)];
