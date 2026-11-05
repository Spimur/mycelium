import { MiniMonth } from './shared'

export default function YearView({ cursor, occs, onPickDay }) {
  const year = cursor.getFullYear()
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-10 gap-y-8 px-6 py-6 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }, (_, m) => (
          <MiniMonth key={m} month={new Date(year, m, 1)} occs={occs} onSelect={onPickDay} compact />
        ))}
      </div>
    </div>
  )
}
