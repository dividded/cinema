import { lazy, Suspense } from 'react';
import { PageShell } from './components/PageShell';
import { LoadingMessage } from './components/styled/Feedback';
import { listById } from './lists/catalog';
import SchedulePage from './pages/SchedulePage';
import { useLocation } from './router';

// The schedule is the landing page and ships in the main bundle; the others load on demand.
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const ListPage = lazy(() => import('./pages/ListPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function Page() {
  const { path } = useLocation();
  if (path === '/') return <SchedulePage />;
  if (path === '/history') return <HistoryPage />;

  const listMatch = /^\/lists\/([\w-]+)$/.exec(path);
  const list = listMatch && listById(listMatch[1]);
  if (list) return <ListPage key={list.id} list={list} />;

  return <NotFoundPage />;
}

export default function App() {
  return (
    <PageShell>
      <Suspense fallback={<LoadingMessage compact />}>
        <Page />
      </Suspense>
    </PageShell>
  );
}
