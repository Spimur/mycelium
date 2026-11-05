import { useMemo } from 'react'

// Deterministischer Zufall, damit das Geflecht bei jedem Render gleich aussieht
function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const smoothPath = (pts) => {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2
    const my = (pts[i][1] + pts[i + 1][1]) / 2
    d += `Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`
  }
  const last = pts.at(-1)
  return d + `L${last[0].toFixed(1)} ${last[1].toFixed(1)}`
}

// Simuliert wachsende Hyphen: Spitzen wandern mit leichter Krümmung und verzweigen sich zufällig
function growHyphae({ width, height, seed = 7, origins, density = 1 }) {
  const rand = mulberry32(seed)
  const hyphae = []
  const knots = []
  const tips = origins.map(([x, y, angle]) => ({ x, y, angle, life: 70 + rand() * 50, depth: 0, pts: [[x, y]], bend: 0 }))
  let budget = 2600 * density

  while (tips.length && budget-- > 0) {
    const tip = tips[Math.floor(rand() * tips.length)]
    tip.bend = tip.bend * 0.85 + (rand() - 0.5) * 0.22
    tip.angle += tip.bend
    const step = 5 + rand() * 4
    tip.x += Math.cos(tip.angle) * step
    tip.y += Math.sin(tip.angle) * step
    tip.pts.push([tip.x, tip.y])
    tip.life -= 1

    const outside = tip.x < -20 || tip.y < -20 || tip.x > width + 20 || tip.y > height + 20
    if (!outside && tip.depth < 5 && tip.pts.length > 4 && rand() < 0.045 * density) {
      const dir = rand() < 0.5 ? -1 : 1
      tips.push({
        x: tip.x,
        y: tip.y,
        angle: tip.angle + dir * (0.45 + rand() * 0.7),
        life: tip.life * (0.55 + rand() * 0.3),
        depth: tip.depth + 1,
        pts: [[tip.x, tip.y]],
        bend: 0,
      })
      knots.push({ x: tip.x, y: tip.y, r: Math.max(0.8, 2.2 - tip.depth * 0.4) })
    }
    if (tip.life <= 0 || outside) {
      tips.splice(tips.indexOf(tip), 1)
      if (tip.pts.length > 2) hyphae.push({ d: smoothPath(tip.pts), depth: tip.depth })
      if (!outside && rand() < 0.5) knots.push({ x: tip.x, y: tip.y, r: 1 + rand() * 1.2, tip: true })
    }
  }
  tips.forEach((tip) => tip.pts.length > 2 && hyphae.push({ d: smoothPath(tip.pts), depth: tip.depth }))
  return { hyphae, knots }
}

/**
 * Feines Myzel-Geflecht als Hintergrund. Nimmt die aktuelle Textfarbe an (currentColor).
 * origins: Startpunkte als [x, y, winkel] im Koordinatensystem width × height.
 */
export function MyceliumBackdrop({ width = 800, height = 600, seed, origins, density, animate = false, className = '', style }) {
  // origins ist meist ein Literal; als JSON verglichen, damit sich das Geflecht nicht bei jedem Render neu bildet
  const originsKey = JSON.stringify(origins)
  const { hyphae, knots } = useMemo(
    () => growHyphae({ width, height, seed, origins: JSON.parse(originsKey), density }),
    [width, height, seed, density, originsKey],
  )

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none ${className}`}
      style={style}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        {hyphae.map((h, i) => (
          <path
            key={i}
            d={h.d}
            pathLength={1}
            strokeWidth={Math.max(0.45, 1.5 - h.depth * 0.25)}
            strokeOpacity={Math.max(0.35, 1 - h.depth * 0.14)}
            strokeDasharray={animate ? 1 : undefined}
            className={animate ? 'animate-grow' : undefined}
            style={animate ? { animationDelay: `${h.depth * 0.35}s` } : undefined}
          />
        ))}
      </g>
      <g fill="currentColor">
        {knots.map((k, i) => (
          <circle
            key={i}
            cx={k.x}
            cy={k.y}
            r={k.r}
            className={animate ? 'animate-fade' : undefined}
            style={animate ? { animationDelay: `${1.2 + (i % 12) * 0.08}s` } : undefined}
          />
        ))}
      </g>
    </svg>
  )
}

export function Logo({ className = 'size-7' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M5 14.5C5 8 10 3.5 16 3.5S27 8 27 14.5Z" fill="var(--c-accent)" />
      <circle cx="11.5" cy="9.5" r="1.4" fill="var(--c-bg)" opacity="0.85" />
      <circle cx="19" cy="7.6" r="1" fill="var(--c-bg)" opacity="0.85" />
      <circle cx="21.5" cy="11.5" r="1.2" fill="var(--c-bg)" opacity="0.85" />
      <path d="M13.6 14.5 13.2 20.5h5.6l-.4-6Z" fill="currentColor" />
      <path
        d="M16 20.5c-.4 2.6-2.6 4-5.6 5.3M16 20.5c.5 2.8 2.7 4.2 6 4.8M16 20.5v7.8M12.7 24.4c-.8 1.7-.4 3.2-1.8 4.6M19.6 24.7c1.3 1.6.9 3.2 2.3 4.4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Wordmark({ className = '' }) {
  return <span className={`font-display text-[22px] leading-none tracking-tight ${className}`}>mycelium</span>
}
