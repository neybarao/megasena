import { calculateAggregateStats, calculateNumberStats, drawMetrics, GAME_SIZE, MAX_NUMBER } from './statistics'
import type { BacktestResult, Draw, GeneratedGame, GeneratorConfig } from './types'

export const defaultGeneratorConfig: GeneratorConfig = {
  frequencyWeight: 1,
  delayWeight: 0.72,
  targetOdd: [2, 4],
  targetLow: [2, 4],
  sumRange: [120, 230],
  maxSequence: 2,
  maxRepeat: 2,
  maxPerRange: 2,
}

function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function sampleGame(random: () => number): number[] {
  const pool = Array.from({ length: MAX_NUMBER }, (_, index) => index + 1)
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[pool[index], pool[target]] = [pool[target], pool[index]]
  }
  return pool.slice(0, GAME_SIZE).sort((a, b) => a - b)
}

export function generateGames(draws: Draw[], count = 5, seed = Date.now(), config: GeneratorConfig = defaultGeneratorConfig): GeneratedGame[] {
  if (!draws.length) return []
  const numberStats = calculateNumberStats(draws)
  const aggregate = calculateAggregateStats(draws)
  const previous = draws.at(-1)?.b
  const random = seededRandom(seed)
  const candidates = new Map<string, GeneratedGame>()
  const targetPool = Math.max(15000, count * 3500)
  const minSum = Math.max(config.sumRange[0], Math.floor(aggregate.meanSum - 45))
  const maxSum = Math.min(config.sumRange[1], Math.ceil(aggregate.meanSum + 45))

  for (let index = 0; index < targetPool; index += 1) {
    const numbers = sampleGame(random)
    const metrics = drawMetrics(numbers, previous)
    if (metrics.odd < config.targetOdd[0] || metrics.odd > config.targetOdd[1]) continue
    if (metrics.low < config.targetLow[0] || metrics.low > config.targetLow[1]) continue
    if (metrics.sum < minSum || metrics.sum > maxSum) continue
    if (metrics.longestSequence > config.maxSequence) continue
    if (metrics.repeated > config.maxRepeat) continue
    if (metrics.ranges.some((range) => range.count > config.maxPerRange)) continue

    const frequencyScore = numbers.reduce((total, number) => total + numberStats[number - 1].percentage, 0) / GAME_SIZE
    const delayScore = numbers.reduce((total, number) => total + Math.min(numberStats[number - 1].delay, 25), 0) / GAME_SIZE
    const balancePenalty =
      Math.abs(metrics.sum - aggregate.meanSum) * 0.18 +
      Math.abs(metrics.odd - aggregate.meanOdd) * 2.6 +
      Math.abs(metrics.low - aggregate.meanLow) * 2.4 +
      Math.abs(metrics.repeated - aggregate.meanRepeated) * 2.2
    const score = frequencyScore * config.frequencyWeight + delayScore * config.delayWeight - balancePenalty
    candidates.set(numbers.join('-'), { numbers, metrics, score })
  }

  return [...candidates.values()].sort((a, b) => b.score - a.score).slice(0, count)
}

export function runBacktest(draws: Draw[], targetContest: number, seed?: number): BacktestResult | null {
  const targetIndex = draws.findIndex((draw) => draw.n === targetContest)
  if (targetIndex < 1) return null
  const history = draws.slice(0, targetIndex)
  const target = draws[targetIndex]
  const targetSet = new Set(target.b)
  const games = generateGames(history, 5, seed ?? target.n * 7919).map((game) => ({
    ...game,
    hits: game.numbers.filter((number) => targetSet.has(number)).length,
  }))
  return { target, games, analysisSize: history.length }
}
