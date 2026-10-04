import styled from '@emotion/styled';

const Box = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 0.4rem 0.9rem;
  padding: 1.75rem 0;
  text-align: center;

  p {
    color: var(--ink);
    font-family: 'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-size: 1.15rem;
  }

  button {
    appearance: none;
    border: none;
    background: transparent;
    padding: 0 0 0.1rem;
    color: var(--ink);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    box-shadow: inset 0 -1px 0 var(--ink);
  }
`;

/**
 * Shown when the search and filters hide everything: names what is active and offers to
 * clear it, e.g. Nothing matches “vertigo” and Pre-2020.
 */
export function NoMatches({ query, filters, onClear }: { query: string; filters: readonly string[]; onClear: () => void }) {
  const parts = [...(query.trim() === '' ? [] : [`“${query.trim()}”`]), ...filters];
  return (
    <Box>
      <p>Nothing matches {parts.length > 0 ? parts.join(' and ') : 'the filters'}.</p>
      <button type="button" onClick={onClear}>
        Clear
      </button>
    </Box>
  );
}
