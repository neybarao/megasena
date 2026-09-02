export type WindowSize = 50 | 100 | 500 | 'all'

const options: Array<{ value: WindowSize; label: string }> = [
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 500, label: '500' },
  { value: 'all', label: 'Todos' },
]

export function WindowControl({ value, onChange }: { value: WindowSize; onChange: (value: WindowSize) => void }) {
  return (
    <div className="segmented" role="group" aria-label="Período analisado">
      {options.map((option) => (
        <button
          key={option.value}
          className={value === option.value ? 'is-active' : ''}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
