import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  notFound,
  retainSearchParams,
} from '@tanstack/react-router';
import { z } from 'zod';
import { PageShell } from './components/PageShell';
import { LoadingMessage } from './components/LoadingMessage';
import { ListIdSchema } from './lists/catalog';
import SchedulePage from './pages/SchedulePage';

const rootSearchSchema = z.object({
  /** Shows the background picker; a value picks that background. */
  debugbg: z.string().optional().catch(undefined),
});

const rootRoute = createRootRoute({
  validateSearch: rootSearchSchema,
  // The debug flag stays on while moving between pages.
  search: { middlewares: [retainSearchParams(['debugbg'])] },
  component: PageShell,
  notFoundComponent: lazyRouteComponent(() => import('./pages/NotFoundPage')),
});

// The schedule is the landing page and ships in the main bundle; the others load on demand.
const scheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: SchedulePage,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: lazyRouteComponent(() => import('./pages/HistoryPage')),
});

export const listRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lists/$listId',
  params: {
    parse: ({ listId }) => {
      const parsed = ListIdSchema.safeParse(listId);
      if (!parsed.success) throw notFound();
      return { listId: parsed.data };
    },
    stringify: ({ listId }) => ({ listId }),
  },
  component: lazyRouteComponent(() => import('./pages/ListPage')),
});

const routeTree = rootRoute.addChildren([scheduleRoute, historyRoute, listRoute]);

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
  scrollRestoration: true,
  defaultPreload: 'intent',
  defaultPendingComponent: () => <LoadingMessage compact />,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
