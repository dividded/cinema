import styled from '@emotion/styled'

export const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(160deg, #13151a 0%, #1a1d23 100%);
  color: #fff;
  padding: 1rem;
  font-size: 1.1rem;
`

export const Header = styled.header`
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem 1rem;
  background: linear-gradient(180deg, rgba(19,21,26,0) 0%, rgba(19,21,26,1) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`

export const Title = styled.h1`
  color: #646cff;
  font-size: 2.8rem;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
  letter-spacing: -0.5px;
  text-shadow: 0 0 20px rgba(100, 108, 255, 0.3);
`

export const MovieList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 1200px;
  margin: 0 auto;
`

export const DateSection = styled.div`
  margin-bottom: 2rem;
` 