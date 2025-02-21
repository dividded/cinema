import styled from '@emotion/styled'

export const Container = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
  background: linear-gradient(160deg, #13151a 0%, #1a1d23 100%);
  color: #fff;
  font-size: 1.1rem;
`

export const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0 1rem;
  text-align: center;
  background: linear-gradient(180deg, rgba(19,21,26,0) 0%, rgba(19,21,26,1) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  gap: 2rem;
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
`

export const DateSection = styled.div`
  margin-bottom: 2rem;
` 