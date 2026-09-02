import { CheckCircle, Copy } from '@phosphor-icons/react'
import type { GeneratedGame } from '../analysis/types'
import { NumberBall } from './NumberBall'

export function GameRow({ game, index, hits }: { game: GeneratedGame; index: number; hits?: number }) {
  const text = game.numbers.map((number) => String(number).padStart(2, '0')).join(' ')

  return (
    <article className="game-row">
      <div className="game-row__heading">
        <span>Jogo {String(index + 1).padStart(2, '0')}</span>
        {hits === undefined ? (
          <span className="game-row__metrics">
            {game.metrics.odd} impares · soma {game.metrics.sum} · {game.metrics.low}/{game.metrics.high} baixa/alta
          </span>
        ) : (
          <strong className={`hit-count hit-count--${hits >= 4 ? 'good' : 'neutral'}`}>
            <CheckCircle size={16} weight="fill" /> {hits} acertos
          </strong>
        )}
        <button className="copy-button" type="button" onClick={() => navigator.clipboard?.writeText(text)} aria-label={`Copiar jogo ${index + 1}`}>
          <Copy size={16} />
        </button>
      </div>
      <div className="ball-line">
        {game.numbers.map((number) => <NumberBall key={number} number={number} size="small" />)}
      </div>
    </article>
  )
}
