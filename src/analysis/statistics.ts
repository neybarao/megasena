import type { AggregateStats, Draw, DrawMetrics, HistogramBin, NumberStat, RangeDistribution } from './types'

export const MIN_NUMBER = 1
export const MAX_NUMBER = 60
export const GAME_SIZE = 6
export const RANGE_LABELS = ['01-10', '11-20', '21-30', '31-40', '41-50', '51-60']

export function validateDraw(draw: Draw): void {
  if (!Number.isInteger(draw.n) || draw.n < 1) throw new Error(`Concurso invalido: ${draw.n}.`)
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(draw.d)) throw new Error(`Data invalida no concurso ${draw.n}: ${draw.d}.`)
  if (draw.b.length !== GAME_SIZE) throw new Error(`Concurso ${draw.n} precisa ter exatamente ${GAME_SIZE} dezenas.`)
  if (new Set(draw.b).size !== GAME_SIZE) throw new Error(`Concurso ${draw.n} contem dezenas repetidas.`)
  if (draw.b.some((number) => number < MIN_NUMBER || number > MAX_NUMBER || !Number.isInteger(number))) {
    throw new Error(`Concurso ${draw.n} contem dezenas fora de ${MIN_NUMBER}-${MAX_NUMBER}.`)
  }
}

export function getSequences(numbers: number[]): number[][] {
  const sorted = [...numbers].sort((a, b) => a - b)
  const sequences: number[][] = []
  let current = [sorted[0]]

  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index] === sorted[index - 1] + 1) current.push(sorted[index])
    else {
      if (current.length > 1) sequences.push(current)
      current = [sorted[index]]
    }
  }
  if (current.length > 1) sequences.push(current)
  return sequences
}

export function drawMetrics(numbers: number[], previous?: number[]): DrawMetrics {
  const rows = Array(6).fill(0) as number[]
  const columns = Array(10).fill(0) as number[]
  const previousSet = new Set(previous ?? [])
  const ranges = RANGE_LABELS.map((label) => ({ label, count: 0 }))

  numbers.forEach((number) => {
    rows[Math.floor((number - 1) / 10)] += 1
    columns[(number - 1) % 10] += 1
    ranges[Math.floor((number - 1) / 10)].count += 1
  })

  const sequences = getSequences(numbers)
  const odd = numbers.filter((number) => number % 2 !== 0).length
  const low = numbers.filter((number) => number <= 30).length

  return {
    odd,
    even: numbers.length - odd,
    low,
    high: numbers.length - low,
    sum: numbers.reduce((total, number) => total + number, 0),
    ranges,
    rows,
    columns,
    repeated: numbers.filter((number) => previousSet.has(number)).length,
    longestSequence: Math.max(1, ...sequences.map((sequence) => sequence.length)),
    sequences,
  }
}

export function calculateNumberStats(draws: Draw[]): NumberStat[] {
  const latestFirst = [...draws].reverse()
  return Array.from({ length: MAX_NUMBER }, (_, index) => {
    const number = index + 1
    const appearances: number[] = []
    draws.forEach((draw, drawIndex) => {
      if (draw.b.includes(number)) appearances.push(drawIndex)
    })

    const latestAppearance = latestFirst.findIndex((draw) => draw.b.includes(number))
    let maxDelay = appearances[0] ?? draws.length
    for (let i = 1; i < appearances.length; i += 1) {
      maxDelay = Math.max(maxDelay, appearances[i] - appearances[i - 1] - 1)
    }
    if (appearances.length) maxDelay = Math.max(maxDelay, draws.length - 1 - appearances.at(-1)!)

    return {
      number,
      frequency: appearances.length,
      percentage: draws.length ? (appearances.length / draws.length) * 100 : 0,
      delay: latestAppearance < 0 ? draws.length : latestAppearance,
      maxDelay,
      lastContest: appearances.length ? draws[appearances.at(-1)!].n : null,
    }
  })
}

function histogram(values: number[], start: number, end: number, step = 1): HistogramBin[] {
  const bins: HistogramBin[] = []
  for (let low = start; low <= end; low += step) {
    const high = Math.min(end, low + step - 1)
    bins.push({ label: low === high ? String(low) : `${low}-${high}`, value: values.filter((value) => value >= low && value <= high).length })
  }
  return bins
}

function mean(values: number[]): number {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0
}

export function calculateAggregateStats(draws: Draw[]): AggregateStats {
  if (!draws.length) {
    return {
      meanSum: 0, minSum: 0, maxSum: 0, meanOdd: 0, meanLow: 0, meanRepeated: 0,
      sumHistogram: [], oddHistogram: [], lowHighHistogram: [], repeatedHistogram: [], rangeAverages: [],
    }
  }

  const metrics = draws.map((draw, index) => drawMetrics(draw.b, draws[index - 1]?.b))
  const sums = metrics.map((metric) => metric.sum)
  const odds = metrics.map((metric) => metric.odd)
  const lows = metrics.map((metric) => metric.low)
  const repeated = metrics.slice(1).map((metric) => metric.repeated)
  const rangeAverages: RangeDistribution[] = RANGE_LABELS.map((label, rangeIndex) => ({
    label,
    count: mean(metrics.map((metric) => metric.ranges[rangeIndex].count)),
  }))

  return {
    meanSum: mean(sums),
    minSum: Math.min(...sums),
    maxSum: Math.max(...sums),
    meanOdd: mean(odds),
    meanLow: mean(lows),
    meanRepeated: mean(repeated),
    sumHistogram: histogram(sums, 40, 260, 10),
    oddHistogram: histogram(odds, 0, 6),
    lowHighHistogram: histogram(lows, 0, 6),
    repeatedHistogram: histogram(repeated, 0, 6),
    rangeAverages,
  }
}

export function selectWindow(draws: Draw[], size: number | 'all'): Draw[] {
  return size === 'all' ? draws : draws.slice(-size)
}

export function formatDrawDate(value: string): string {
  const [day, month, year] = value.split('/')
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(Number(year), Number(month) - 1, Number(day)))
    .replace('.', '')
}
