import { describe, expect, it } from 'vitest'
import { generateGames, runBacktest } from './generator'
import { calculateAggregateStats, calculateNumberStats, drawMetrics, getSequences, validateDraw } from './statistics'
import type { Draw } from './types'

const draws: Draw[] = [
  { n: 1, d: '01/01/2026', b: [1, 2, 3, 31, 32, 60] },
  { n: 2, d: '04/01/2026', b: [2, 4, 6, 34, 45, 58] },
  { n: 3, d: '07/01/2026', b: [1, 5, 7, 30, 40, 50] },
  { n: 4, d: '10/01/2026', b: [10, 20, 30, 40, 50, 60] },
  { n: 5, d: '13/01/2026', b: [8, 13, 22, 37, 41, 59] },
  { n: 6, d: '16/01/2026', b: [3, 9, 18, 27, 36, 54] },
  { n: 7, d: '19/01/2026', b: [4, 14, 24, 35, 46, 57] },
  { n: 8, d: '22/01/2026', b: [6, 16, 26, 33, 44, 55] },
]

describe('estatisticas da Mega-Sena', () => {
  it('valida concursos com exatamente 6 dezenas distintas entre 1 e 60', () => {
    expect(() => validateDraw(draws[0])).not.toThrow()
    expect(() => validateDraw({ n: 9, d: '25/01/2026', b: [1, 2, 3, 4, 5, 61] })).toThrow(/fora/)
    expect(() => validateDraw({ n: 9, d: '25/01/2026', b: [1, 2, 3, 4, 5, 5] })).toThrow(/repetidas/)
  })

  it('calcula pares, impares, baixas, altas, soma, faixas, sequencias e repeticao', () => {
    const metrics = drawMetrics([1, 2, 3, 31, 32, 60], [1, 4, 8, 31, 48, 59])
    expect(metrics.odd).toBe(3)
    expect(metrics.even).toBe(3)
    expect(metrics.low).toBe(3)
    expect(metrics.high).toBe(3)
    expect(metrics.sum).toBe(129)
    expect(metrics.ranges.map((range) => range.count)).toEqual([3, 0, 0, 2, 0, 1])
    expect(metrics.repeated).toBe(2)
    expect(getSequences([1, 2, 3, 10, 20, 21])).toEqual([[1, 2, 3], [20, 21]])
  })

  it('calcula frequencia, percentual, atraso atual e ultimo concurso', () => {
    const stats = calculateNumberStats(draws)
    expect(stats[0]).toMatchObject({ number: 1, frequency: 2, delay: 5, lastContest: 3 })
    expect(stats[5]).toMatchObject({ number: 6, frequency: 2, delay: 0, lastContest: 8 })
    expect(stats[59]).toMatchObject({ number: 60, frequency: 2, delay: 4, lastContest: 4 })
  })

  it('agrega distribuicoes estatisticas', () => {
    const aggregate = calculateAggregateStats(draws)
    expect(aggregate.meanOdd).toBeGreaterThan(0)
    expect(aggregate.meanLow).toBeGreaterThan(0)
    expect(aggregate.sumHistogram.length).toBeGreaterThan(0)
    expect(aggregate.rangeAverages).toHaveLength(6)
  })

  it('gera jogos reproduziveis com 6 dezenas distintas entre 1 e 60', () => {
    const first = generateGames(draws, 5, 123)
    const second = generateGames(draws, 5, 123)
    expect(first.map((game) => game.numbers)).toEqual(second.map((game) => game.numbers))
    expect(first).toHaveLength(5)
    first.forEach((game) => {
      expect(game.numbers).toHaveLength(6)
      expect(new Set(game.numbers).size).toBe(6)
      expect(game.numbers.every((number) => number >= 1 && number <= 60)).toBe(true)
    })
  })

  it('executa backtest sem usar o concurso alvo nem concursos futuros', () => {
    const result = runBacktest(draws, 6, 777)
    expect(result?.target.n).toBe(6)
    expect(result?.analysisSize).toBe(5)
    expect(result?.games.every((game) => game.hits >= 0 && game.hits <= 6)).toBe(true)
  })
})
