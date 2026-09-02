import { ArrowsDownUp } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { calculateNumberStats, selectWindow } from '../analysis/statistics'
import type { Draw } from '../analysis/types'
import { NumberBall } from '../components/NumberBall'
import type { WindowSize } from '../components/WindowControl'
import { WindowControl } from '../components/WindowControl'

type SortKey = 'number' | 'frequency' | 'delay' | 'maxDelay'

export function Numbers({ draws, windowSize, setWindowSize }: {
  draws: Draw[]
  windowSize: WindowSize
  setWindowSize: (value: WindowSize) => void
}) {
  const [sortKey, setSortKey] = useState<SortKey>('frequency')
  const stats = useMemo(() => {
    const calculated = calculateNumberStats(selectWindow(draws, windowSize))
    return calculated.sort((a, b) => sortKey === 'number' ? a.number - b.number : b[sortKey] - a[sortKey])
  }, [draws, sortKey, windowSize])

  return (
    <div className="page-stack">
      <section className="page-intro page-intro--split">
        <div><p className="eyebrow">Dezenas</p><h1>Frequencia e atraso</h1><p className="intro-copy">Atraso e a quantidade de concursos desde a ultima aparicao.</p></div>
        <WindowControl value={windowSize} onChange={setWindowSize} />
      </section>
      <div className="sort-control">
        <ArrowsDownUp size={18} />
        <label htmlFor="number-sort">Ordenar por</label>
        <select id="number-sort" value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
          <option value="frequency">Maior frequência</option>
          <option value="delay">Maior atraso atual</option>
          <option value="maxDelay">Maior atraso histórico</option>
          <option value="number">Número</option>
        </select>
      </div>
      <section className="number-table" aria-label="Estatísticas das dezenas">
        <div className="number-table__header"><span>Dezena</span><span>Frequencia</span><span>Atraso</span><span>Ultimo</span></div>
        {stats.map((stat, index) => (
          <div className="number-table__row" key={stat.number} style={{ '--index': index } as React.CSSProperties}>
            <span><NumberBall number={stat.number} size="small" /></span>
            <span><strong>{stat.frequency}</strong><small>{stat.percentage.toFixed(1).replace('.', ',')}%</small></span>
            <span><strong>{stat.delay}</strong><small>concursos</small></span>
            <span><strong>{stat.lastContest ?? '-'}</strong><small>concurso</small></span>
          </div>
        ))}
      </section>
    </div>
  )
}
