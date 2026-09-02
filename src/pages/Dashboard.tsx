import { ChartLine, Database, GridFour, Repeat, Sigma } from '@phosphor-icons/react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { calculateAggregateStats, calculateNumberStats, drawMetrics, formatDrawDate, selectWindow } from '../analysis/statistics'
import type { Draw, Metadata } from '../analysis/types'
import type { WindowSize } from '../components/WindowControl'
import { WindowControl } from '../components/WindowControl'
import { NumberGrid } from '../components/NumberBall'

export function Dashboard({ draws, metadata, windowSize, setWindowSize }: {
  draws: Draw[]
  metadata: Metadata
  windowSize: WindowSize
  setWindowSize: (value: WindowSize) => void
}) {
  const selected = selectWindow(draws, windowSize)
  const aggregate = calculateAggregateStats(selected)
  const numberStats = calculateNumberStats(selected)
  const latest = draws.at(-1)!
  const latestMetrics = drawMetrics(latest.b, draws.at(-2)?.b)
  const topNumbers = [...numberStats].sort((a, b) => b.frequency - a.frequency).slice(0, 5)

  return (
    <div className="page-stack">
      <section className="page-intro page-intro--split">
        <div>
          <p className="eyebrow">Visão geral</p>
          <h1>Concurso {metadata.latestContest}</h1>
          <p className="intro-copy">Sorteado em {formatDrawDate(metadata.latestDrawDate)}. Estatísticas calculadas localmente.</p>
        </div>
        <WindowControl value={windowSize} onChange={setWindowSize} />
      </section>

      <section className="latest-panel">
        <div className="latest-panel__board"><NumberGrid numbers={latest.b} /></div>
        <div className="latest-panel__facts">
          <div><span>Impares</span><strong>{latestMetrics.odd}</strong></div>
          <div><span>Soma</span><strong>{latestMetrics.sum}</strong></div>
          <div><span>Baixas</span><strong>{latestMetrics.low}</strong></div>
          <div><span>Repetidas</span><strong>{latestMetrics.repeated}</strong></div>
        </div>
      </section>

      <section className="metric-strip" aria-label="Resumo da base">
        <div><Database size={20} /><span>Concursos</span><strong>{selected.length.toLocaleString('pt-BR')}</strong></div>
        <div><Sigma size={20} /><span>Soma média</span><strong>{aggregate.meanSum.toFixed(1).replace('.', ',')}</strong></div>
        <div><GridFour size={20} /><span>Baixas media</span><strong>{aggregate.meanLow.toFixed(1).replace('.', ',')}</strong></div>
        <div><Repeat size={20} /><span>Repetição média</span><strong>{aggregate.meanRepeated.toFixed(1).replace('.', ',')}</strong></div>
      </section>

      <section className="analysis-grid">
        <div className="chart-section">
          <div className="section-heading">
            <div><p className="eyebrow">Distribuição</p><h2>Soma das dezenas</h2></div>
            <ChartLine size={22} />
          </div>
          <div className="chart-wrap" role="img" aria-label="Histograma da soma das dezenas">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregate.sumHistogram} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid vertical={false} stroke="#dfd2c3" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1e4d8' }} contentStyle={{ borderRadius: 6, borderColor: '#dfd2c3' }} />
                <Bar dataKey="value" name="Concursos" fill="#d86f18" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ranking-section">
          <div className="section-heading"><div><p className="eyebrow">Frequência</p><h2>Mais presentes</h2></div></div>
          <ol className="ranking-list">
            {topNumbers.map((stat, index) => (
              <li key={stat.number}>
                <span className="ranking-index">{index + 1}</span>
                <span className="ranking-number">{String(stat.number).padStart(2, '0')}</span>
                <div className="ranking-bar"><i style={{ width: `${stat.percentage}%` }} /></div>
                <strong>{stat.percentage.toFixed(1).replace('.', ',')}%</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
