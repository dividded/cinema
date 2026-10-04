import { AnchorHTMLAttributes, MouseEvent, useSyncExternalStore } from 'react';

// A minimal client-side router: the app only has a handful of flat routes, so the History API
// is enough. GitHub Pages serves a copy of index.html at each route (see scripts/routesPlugin.ts).

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** The current path inside the app ("/", "/history", ...), without the deploy base. */
export function appPath(pathname: string = window.location.pathname): string {
  const path = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  return path.replace(/\/+$/, '') || '/';
}

/** A full URL path for an app path, including the deploy base. */
export const href = (path: string): string => `${BASE}${path === '/' ? '/' : path}`;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
}

const snapshot = () => window.location.pathname + window.location.search;

/** Re-renders on navigation; returns the app path and the query string. */
export function useLocation(): { path: string; search: URLSearchParams } {
  const location = useSyncExternalStore(subscribe, snapshot);
  const [pathname, search = ''] = location.split('?');
  return { path: appPath(pathname), search: new URLSearchParams(search) };
}

/** Keeps debug flags (e.g. ?debugbg) while moving between pages. */
function carriedSearch(): string {
  const current = new URLSearchParams(window.location.search);
  const kept = new URLSearchParams();
  for (const [key, value] of current) if (key.startsWith('debug')) kept.set(key, value);
  const text = kept.toString();
  return text ? `?${text.replace(/=(&|$)/g, '$1')}` : '';
}

/** The URL for an app path that may end in a #hash, keeping the debug flags. */
function urlFor(to: string): string {
  const [path, hash] = to.split('#');
  return href(path) + carriedSearch() + (hash ? `#${hash}` : '');
}

export function navigate(to: string, { replace = false } = {}): void {
  const url = urlFor(to);
  if (replace) window.history.replaceState(null, '', url);
  else window.history.pushState(null, '', url);
  if (!replace) window.scrollTo(0, 0);
  listeners.forEach((listener) => listener());
}

/** Replaces the query string without a new history entry (used by the debug panel). */
export function setSearch(params: URLSearchParams): void {
  const text = params.toString().replace(/=(&|$)/g, '$1');
  window.history.replaceState(null, '', window.location.pathname + (text ? `?${text}` : '') + window.location.hash);
  listeners.forEach((listener) => listener());
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string };

/** An <a> that navigates in-app on a plain click and behaves like a normal link otherwise. */
export function Link({ to, onClick, ...props }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigate(to);
  };
  return <a href={urlFor(to)} onClick={handleClick} {...props} />;
}
