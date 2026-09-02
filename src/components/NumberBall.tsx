type NumberBallProps = {
  number: number
  selected?: boolean
  muted?: boolean
  size?: 'small' | 'regular'
}

export function NumberBall({ number, selected = true, muted = false, size = 'regular' }: NumberBallProps) {
  return (
    <span className={`number-ball number-ball--${size} ${selected ? 'is-selected' : ''} ${muted ? 'is-muted' : ''}`}>
      {String(number).padStart(2, '0')}
    </span>
  )
}

export function NumberGrid({ numbers, compare }: { numbers: number[]; compare?: number[] }) {
  const selected = new Set(numbers)
  const comparison = compare ? new Set(compare) : null
  return (
    <div className="number-grid" aria-label={`Dezenas ${numbers.join(', ')}`}>
      {Array.from({ length: 60 }, (_, index) => index + 1).map((number) => (
        <NumberBall
          key={number}
          number={number}
          selected={selected.has(number)}
          muted={Boolean(comparison && selected.has(number) && !comparison.has(number))}
          size="small"
        />
      ))}
    </div>
  )
}
