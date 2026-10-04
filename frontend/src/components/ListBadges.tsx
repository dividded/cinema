import styled from '@emotion/styled';
import { memo } from 'react';
import { filmAnchor, listById, listPath } from '../lists/catalog';
import { ListHit } from '../lists/match';
import { Link } from '../router';

/** A full-width row under the card, so three badges fit on one line even on phones. */
const Row = styled.span`
  flex: 1 0 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.35rem;
  margin-top: 0.4rem;
  direction: ltr;
  unicode-bidi: isolate;
`;

const Badge = styled(Link, { shouldForwardProp: (prop) => prop !== '$tone' })<{ $tone: 'gold' | 'plain' }>`
  display: inline-flex;
  align-items: baseline;
  gap: 0.28rem;
  max-width: 100%;
  padding: 0.12rem 0.42rem 0.1rem;
  border-radius: 3px;
  font-size: 0.64rem;
  line-height: 1.35;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  transition: filter 0.15s ease, transform 0.15s ease;

  ${(p) =>
    p.$tone === 'gold'
      ? `
    color: #4a3a05;
    background: linear-gradient(135deg, #f3dc8a 0%, #dcb646 55%, #f0d77e 100%);
    box-shadow: inset 0 0 0 1px rgba(122, 92, 8, 0.28), 0 1px 0 rgba(255, 255, 255, 0.4);
  `
      : `
    color: var(--ink-soft);
    background: rgba(255, 255, 255, 0.35);
    box-shadow: inset 0 0 0 1px rgba(26, 25, 22, 0.22);
  `}

  &:hover {
    color: ${(p) => (p.$tone === 'gold' ? '#2e2402' : 'var(--ink)')};
    filter: brightness(1.04);
  }

  &:active {
    transform: translateY(1px);
  }

  .star {
    font-size: 0.7rem;
    line-height: 1;
  }

  .rank {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }

  /* Short names on phones so three badges fit next to the screenings column. */
  .short {
    display: none;
  }
  @media (max-width: 480px) {
    letter-spacing: 0.04em;
    .long {
      display: none;
    }
    .short {
      display: inline;
    }
  }
`;

const SHORT_NAMES: Record<string, string> = {
  'ss-directors-2012': 'S&S Dir',
  'ss-critics-2012': 'S&S Crit',
  'tspdt-1000': 'TSPDT',
};

export const ListBadges = memo(function ListBadges({ hits }: { hits: readonly ListHit[] }) {
  if (hits.length === 0) return null;
  return (
    <Row>
      {hits.map((hit) => {
        const list = listById(hit.list)!;
        const tone = list.tone;
        return (
          <Badge
            key={hit.list}
            to={`${listPath(list.id)}#${filmAnchor(hit.rank, hit.film.imdb)}`}
            $tone={tone}
            title={`#${hit.rank} on ${list.title}`}
          >
            {tone === 'gold' && <span className="star" aria-hidden="true">★</span>}
            <span className="long">{list.badge}</span>
            <span className="short">{SHORT_NAMES[list.id]}</span>
            <span className="rank">#{hit.rank}</span>
          </Badge>
        );
      })}
    </Row>
  );
});
