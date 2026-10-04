import styled from '@emotion/styled';
import { Link, Outlet, useMatchRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { useRotatingBackground } from '../hooks/useRotatingBackground';
import { BackgroundLayer } from './BackgroundLayer';
import { Container } from './styled/Layout';

const BackgroundDebugPanel = lazy(() => import('./BackgroundDebugPanel'));

const Nav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.2rem 1rem;
  margin-top: 0.7rem;
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  a {
    color: var(--ink-soft);
    text-decoration: none;
    padding-bottom: 0.1rem;
    border-bottom: 1px solid transparent;
    opacity: 0.75;
    transition: opacity 0.15s ease, border-color 0.15s ease;
  }
  a:hover,
  a[aria-current='page'] {
    opacity: 1;
    color: var(--ink);
    border-bottom-color: var(--ink);
  }
`;

/** Small links under the title: schedule, history and the film lists. */
export function MainNav() {
  const onList = useMatchRoute()({ to: '/lists/$listId' }) !== false;
  return (
    <Nav aria-label="Pages">
      <Link to="/" activeOptions={{ exact: true }}>
        Schedule
      </Link>
      <Link to="/history">History</Link>
      {/* Each list page links to the other two. */}
      <Link to="/lists/$listId" params={{ listId: 'ss-directors-2012' }} aria-current={onList ? 'page' : undefined}>
        Lists
      </Link>
    </Nav>
  );
}

/** Names the still at the top of the page. */
const Credit = styled.footer`
  position: relative;
  z-index: 1;
  max-width: 820px;
  margin: 0 auto;
  padding: 1.25rem 1.25rem 2.5rem;
  font-size: 0.74rem;
  color: var(--muted);

  i {
    font-style: italic;
    color: var(--ink-soft);
  }

  @media (max-width: 768px) {
    padding: 1rem 1rem 2rem;
  }
`;

export function PageShell() {
  const { background, debug } = useRotatingBackground();
  return (
    <Container>
      <BackgroundLayer background={background} />
      <Outlet />
      {background && (
        <Credit>
          Top image: <i>{background.film}</i>, {background.director}, {background.year}
        </Credit>
      )}
      {debug && (
        <Suspense fallback={null}>
          <BackgroundDebugPanel current={background?.name ?? null} />
        </Suspense>
      )}
    </Container>
  );
}
