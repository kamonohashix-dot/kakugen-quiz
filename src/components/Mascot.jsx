import { useEffect, useState } from 'react'

const FACE = {
  idle:     '🦊',
  happy:    '🤩',
  sad:      '😢',
  thinking: '🤔',
}

const HAPPY_PARTICLES = ['✨', '⭐', '💫', '🌟', '✨']
const SAD_PARTICLES   = ['💧', '💦', '💧']

export default function Mascot({ state = 'idle', size = 'md' }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (state === 'happy') {
      const ps = HAPPY_PARTICLES.map((emoji, i) => ({
        id: i,
        emoji,
        x: (Math.random() - 0.5) * 90,
        delay: i * 0.1,
      }))
      setParticles(ps)
      const t = setTimeout(() => setParticles([]), 1400)
      return () => clearTimeout(t)
    }
    if (state === 'sad') {
      const ps = SAD_PARTICLES.map((emoji, i) => ({
        id: i,
        emoji,
        x: (i - 1) * 20,
        delay: i * 0.15,
      }))
      setParticles(ps)
      const t = setTimeout(() => setParticles([]), 1200)
      return () => clearTimeout(t)
    }
    setParticles([])
  }, [state])

  const sizeMap = { sm: 52, md: 72, lg: 96 }
  const fontSize = sizeMap[size] ?? 72

  return (
    <div
      className={`mascot mascot--${state}`}
      style={{ position: 'relative', display: 'inline-block', lineHeight: 1 }}
      role="img"
      aria-label="マスコット"
    >
      <span style={{ fontSize, display: 'block' }}>{FACE[state] ?? FACE.idle}</span>

      {particles.map(p => (
        <span
          key={p.id}
          className="mascot-particle"
          style={{
            left: `calc(50% + ${p.x}px)`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
