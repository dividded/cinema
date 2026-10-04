import { Link } from '@tanstack/react-router'
import { Title, TitleLetter } from './styled/Layout'

const WORD = 'Cinematheque!'

/** Soft natural wobble — Caveat already reads handwritten; keep this subtle. */
const WOBBLE: readonly { rotate: number; y: number; scale?: number }[] = [
  { rotate: -3.2, y: 1, scale: 1.28 }, // C — a bit larger
  { rotate: 1.8, y: -1 },
  { rotate: -1.2, y: 0 },
  { rotate: 2.0, y: 1 },
  { rotate: -1.6, y: -1 },
  { rotate: 1.0, y: 0 },
  { rotate: -2.0, y: 1 },
  { rotate: 1.4, y: -1 },
  { rotate: -0.9, y: 0 },
  { rotate: 1.8, y: 1 },
  { rotate: -1.4, y: -1 },
  { rotate: 1.1, y: 0 },
  { rotate: 2.6, y: -1, scale: 1.08 }, // !
]

export function BrandTitle() {
  return (
    <Title>
      <Link to="/" aria-label="Cinematheque! Schedule">
      {WORD.split('').map((char, index) => {
        const wobble = WOBBLE[index] ?? { rotate: 0, y: 0 }
        return (
          <TitleLetter
            key={`${char}-${index}`}
            $rotate={wobble.rotate}
            $y={wobble.y}
            $scale={wobble.scale}
          >
            {char}
          </TitleLetter>
        )
      })}
      </Link>
    </Title>
  )
}
