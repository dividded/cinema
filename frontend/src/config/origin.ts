import { resolveApiOrigin } from './api';

/** Where the app's data comes from (the Cloudflare Worker). */
export const API_ORIGIN = resolveApiOrigin(import.meta.env.VITE_API_URL, import.meta.env.MODE);
