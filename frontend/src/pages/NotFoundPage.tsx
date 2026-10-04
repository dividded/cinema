import styled from '@emotion/styled';
import { BrandTitle } from '../components/BrandTitle';
import { MainNav } from '../components/PageShell';
import { Header, TitleBlock } from '../components/styled/Layout';
import { Link } from '../router';

const Message = styled.p`
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 3rem 1rem 4rem;
  font-family: 'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: 1.35rem;
  color: var(--ink-soft);
`;

export default function NotFoundPage() {
  return (
    <>
      <Header>
        <TitleBlock>
          <BrandTitle />
          <MainNav />
        </TitleBlock>
      </Header>
      <Message>
        This reel is missing. <Link to="/">Back to the schedule</Link>
      </Message>
    </>
  );
}
