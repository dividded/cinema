import { useEffect, useState } from 'react';
import { LISTS } from '../lists/catalog';
import { buildListIndex, ListIndex } from '../lists/match';

let indexPromise: Promise<ListIndex> | null = null;

/** Loads the three lists (a separate chunk) and builds the title index once per page load. */
export function loadListIndex(): Promise<ListIndex> {
  indexPromise ??= Promise.all(LISTS.map(async (list) => ({ id: list.id, films: await list.load() }))).then(
    buildListIndex,
  );
  return indexPromise;
}

/**
 * The list index, loaded after the page has rendered so it never delays the schedule.
 * Null until it arrives (badges then appear).
 */
export function useListIndex(): ListIndex | null {
  const [index, setIndex] = useState<ListIndex | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = () =>
      loadListIndex()
        .then((loaded) => !cancelled && setIndex(loaded))
        .catch((err) => console.warn('Could not load film lists:', err));
    if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 1500 });
    else setTimeout(start, 200);
    return () => {
      cancelled = true;
    };
  }, []);

  return index;
}
