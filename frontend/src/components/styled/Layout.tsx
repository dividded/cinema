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
  gap: 1.5rem;
  margin-bottom: 3rem;
  padding: 2rem 1rem;
  text-align: left;
  background: linear-gradient(180deg, rgba(19,21,26,0) 0%, rgba(19,21,26,1) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
`

export const Title = styled.h1`
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 40%, #d0d0d0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 4rem;
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.03em;
  position: relative;
  display: inline-block;
  line-height: 1.1;
  text-shadow: 0 0 40px rgba(255, 255, 255, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  &:hover::before {
    opacity: 1;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -0.75rem;
    left: 0;
    width: 4rem;
    height: 4px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%);
    border-radius: 2px;
  }
  
  @media (max-width: 768px) {
    font-size: 2.75rem;
    
    &::after {
      width: 3rem;
      height: 3px;
    }
  }
`

export const MovieList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
  max-width: 900px;
  margin: 0 auto;
`

export const DateSection = styled.div`
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
` 