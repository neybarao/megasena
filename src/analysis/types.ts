export type Draw = {
  n: number
  d: string
  b: number[]
}

export type Metadata = {
  source: string
  sourceLabel: string
  sourceUpdatedAt: string
  latestContest: number
  latestDrawDate: string
  contestCount: number
  generatedAt: string
}

export type NumberStat = {
  number: number
  frequency: number
  percentage: number
  delay: number
  maxDelay: number
  lastContest: number | null
}

export type RangeDistribution = {
  label: string
  count: number
}

export type DrawMetrics = {
  odd: number
  even: number
  low: number
  high: number
  sum: number
  ranges: RangeDistribution[]
  rows: number[]
  columns: number[]
  repeated: number
  longestSequence: number
  sequences: number[][]
}

export type HistogramBin = {
  label: string
  value: number
}

export type AggregateStats = {
  meanSum: number
  minSum: number
  maxSum: number
  meanOdd: number
  meanLow: number
  meanRepeated: number
  sumHistogram: HistogramBin[]
  oddHistogram: HistogramBin[]
  lowHighHistogram: HistogramBin[]
  repeatedHistogram: HistogramBin[]
  rangeAverages: RangeDistribution[]
}

export type GeneratorConfig = {
  frequencyWeight: number
  delayWeight: number
  targetOdd: [number, number]
  targetLow: [number, number]
  sumRange: [number, number]
  maxSequence: number
  maxRepeat: number
  maxPerRange: number
}

export type GeneratedGame = {
  numbers: number[]
  metrics: DrawMetrics
  score: number
}

export type BacktestResult = {
  target: Draw
  games: Array<GeneratedGame & { hits: number }>
  analysisSize: number
}
