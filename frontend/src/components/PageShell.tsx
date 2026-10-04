import styled from '@emotion/styled';
import { lazy, ReactNode, Suspense } from 'react';
import { useRotatingBackground } from '../hooks/useRotatingBackground';
import { LISTS, listPath } from '../lists/catalog';
import { Link, useLocation } from '../router';
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

/** Small links under the title: schedule and history. */
export function MainNav() {
  const { path } = useLocation();
  return (
    <Nav aria-label="Pages">
      <Link to="/" aria-current={path === '/' ? 'page' : undefined}>Schedule</Link>
      <Link to="/history" aria-current={path === '/history' ? 'page' : undefined}>History</Link>
    </Nav>
  );
}

const Footer = styled.footer`
  position: relative;
  z-index: 1;
  max-width: 820px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 3rem;
  border-top: 1px solid var(--line);
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.25rem;
  font-size: 0.78rem;
  color: var(--muted);

  span {
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 0.68rem;
  }
  a {
    color: var(--ink-soft);
    text-underline-offset: 0.2em;
    text-decoration-color: var(--line-strong);
  }

  @media (max-width: 768px) {
    padding: 1.25rem 1rem 2.5rem;
  }
`;

export function PageShell({ children }: { children: ReactNode }) {
  const { background, debug } = useRotatingBackground();
  return (
    <Container>
      <BackgroundLayer background={background} />
      {children}
      <Footer>
        <span>Lists</span>
        {LISTS.map((list) => (
          <Link key={list.id} to={listPath(list.id)}>{list.shortName}</Link>
        ))}
        <Link to="/history">History</Link>
      </Footer>
      {debug && (
        <Suspense fallback={null}>
          <BackgroundDebugPanel current={background?.name ?? null} />
        </Suspense>
      )}
    </Container>
  );
}
