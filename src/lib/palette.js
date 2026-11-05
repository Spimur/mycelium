// Gedämpfte Erdtöne, die zu carbon/bone passen. Lila bleibt die Hauptakzentfarbe.
export const PALETTE = [
  { id: 'violet', name: 'Lila', hex: '#8A4FFF' },
  { id: 'moss', name: 'Moos', hex: '#7E9F5B' },
  { id: 'amber', name: 'Bernstein', hex: '#D69A3A' },
  { id: 'rust', name: 'Rost', hex: '#C8553D' },
  { id: 'teal', name: 'Petrol', hex: '#3E9C9C' },
  { id: 'sky', name: 'Himmel', hex: '#5B8DEF' },
  { id: 'rose', name: 'Rosé', hex: '#D96C9A' },
  { id: 'stone', name: 'Stein', hex: '#8C8A80' },
]

export const colorHex = (id, fallback = '#8A4FFF') => PALETTE.find((c) => c.id === id)?.hex ?? fallback

// Hintergrund und Randfarbe für Termine im Kalender
export function eventStyle(color) {
  const hex = colorHex(color)
  return {
    background: `color-mix(in srgb, ${hex} 20%, var(--c-bg))`,
    borderColor: hex,
  }
}

export const NODE_ICONS = ['📓', '📁', '🍄', '🌱', '🌿', '🪴', '💡', '✏️', '📌', '⭐', '🎯', '📚', '🎓', '💼', '🏠', '✈️', '🎨', '🎵', '🧪', '💰', '❤️', '🗓️', '✅', '🔒']
