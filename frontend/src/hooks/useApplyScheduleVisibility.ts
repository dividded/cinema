import { RefObject, useLayoutEffect } from 'react';
import { FilterResult } from '../filters/types';

export const SCHEDULE_FILTER_HIDDEN_CLASS = 'schedule-filter-hidden';

const setElementFilteredVisibility = (element: HTMLElement, visible: boolean): void => {
  element.classList.toggle(SCHEDULE_FILTER_HIDDEN_CLASS, !visible);
  element.hidden = !visible;
};

export const useApplyScheduleVisibility = (
  containerRef: RefObject<HTMLElement | null>,
  filterResult: FilterResult,
): void => {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.querySelectorAll<HTMLElement>('[data-movie-key]').forEach((element) => {
      const key = element.dataset.movieKey;
      const visible = key !== undefined && filterResult.visibleMovieKeys.has(key);
      setElementFilteredVisibility(element, visible);
    });

    container.querySelectorAll<HTMLElement>('[data-date-section]').forEach((section) => {
      const date = section.dataset.dateSection;
      if (date === undefined) return;

      const meta = filterResult.dateMeta[date];
      if (!meta) {
        setElementFilteredVisibility(section, true);
        return;
      }

      const visible = !meta.hasAnyMovies || meta.hasVisibleMovies;
      setElementFilteredVisibility(section, visible);
    });
  }, [containerRef, filterResult]);
};