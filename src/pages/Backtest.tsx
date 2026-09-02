import { Flask, Target } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { runBacktest } from '../analysis/generator'
import { formatDrawDate } from '../analysis/statistics'
import type { Draw } from '../analysis/types'
import { GameRow } from '../components/GameRow'
import { NumberBall } from '../components/NumberBall'

export function Backtest({ draws }: { draws: Draw[] }) {
  const recentTargets = draws.slice(-100).reverse()
  const [targetContest, setTargetContest] = useState(draws.at(-1)?.n ?? 2)
  const [seed, setSeed] = useState(12345)
  const result = useMemo(() => runBacktest(draws, targetContest, seed), [draws, seed, targetContest])

  if (!result) return null
  const best = Math.max(...result.games.map((game) => game.hits))

  return (
    <div className="page-stack">
      <section className="page-intro page-intro--split">
        <div><p className="eyebrow">Teste retroativo</p><h1>Analisar sem conhecer o resultado</h1><p className="intro-copy">A base e cortada antes do concurso escolhido; so depois comparamos os jogos.</p></div>
        <div className="field"><label htmlFor="target-contest">Concurso testado</label><select id="target-contest" value={targetContest} onChange={(event) => setTargetContest(Number(event.target.value))}>{recentTargets.map((draw) => <option key={draw.n} value={draw.n}>{draw.n} - {draw.d}</option>)}</select><label htmlFor="seed">Semente</label><input id="seed" type="number" value={seed} onChange={(event) => setSeed(Number(event.target.value))} /></div>
      </section>

      <section className="backtest-result">
        <div>
          <span className="icon-tile"><Flask size={24} /></span>
          <p>Base usada</p><strong>{result.analysisSize.toLocaleString('pt-BR')} concursos anteriores</strong>
        </div>
        <div>
          <span className="icon-tile"><Target size={24} /></span>
          <p>Melhor resultado</p><strong>{best} acertos em 6</strong>
        </div>
      </section>

      <section className="actual-result">
        <div className="section-heading"><div><p className="eyebrow">Resultado real</p><h2>Concurso {result.target.n}</h2></div><span>{formatDrawDate(result.target.d)}</span></div>
        <div className="ball-line">{result.target.b.map((number) => <NumberBall key={number} number={number} size="small" />)}</div>
      </section>

      <section className="games-list">
        {result.games.map((game, index) => <GameRow key={game.numbers.join('-')} game={game} index={index} hits={game.hits} />)}
      </section>
    </div>
  )
}
