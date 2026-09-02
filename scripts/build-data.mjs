import { execFileSync } from 'node:child_process'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync, strFromU8 } from 'fflate'
import { XMLParser } from 'fast-xml-parser'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const xlsxPath = resolve(root, 'public/data/megasena.xlsx')
const resultsPath = resolve(root, 'public/data/results.json')
const metadataPath = resolve(root, 'public/data/metadata.json')

const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: false, trimValues: false })
const COLUMN_NAMES = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index))

function fail(message) {
  throw new Error(`XLSX da Mega-Sena invalido: ${message}`)
}

function asArray(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function columnName(ref) {
  return String(ref ?? '').replace(/\d+/g, '')
}

function excelDate(serial) {
  const days = Number(serial)
  if (!Number.isFinite(days)) return String(serial)
  const date = new Date(Date.UTC(1899, 11, 30 + days))
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function normalizeHeader(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function cellValue(cell, sharedStrings) {
  const type = cell?.['@_t']
  const raw = cell?.v ?? cell?.is?.t ?? ''
  if (type === 's') return sharedStrings[Number(raw)] ?? ''
  if (type === 'inlineStr') return cell?.is?.t ?? ''
  return String(raw).trim()
}

async function readWorkbook() {
  let bytes
  try {
    bytes = new Uint8Array(await readFile(xlsxPath))
  } catch {
    fail('coloque o arquivo oficial em public/data/megasena.xlsx antes de rodar o build.')
  }
  const archive = unzipSync(bytes)
  const sheetXml = archive['xl/worksheets/sheet1.xml']
  if (!sheetXml) fail('a aba principal xl/worksheets/sheet1.xml nao foi encontrada.')

  const sharedXml = archive['xl/sharedStrings.xml']
  const sharedStrings = sharedXml
    ? asArray(parser.parse(strFromU8(sharedXml))?.sst?.si).map((item) => {
        const parts = asArray(item?.r)
        if (parts.length) return parts.map((part) => part?.t ?? '').join('')
        return String(item?.t ?? '')
      })
    : []

  const parsed = parser.parse(strFromU8(sheetXml))
  return asArray(parsed?.worksheet?.sheetData?.row).map((row) => {
    const values = new Map()
    asArray(row.c).forEach((cell, index) => values.set(columnName(cell?.['@_r']) || COLUMN_NAMES[index], cellValue(cell, sharedStrings)))
    return values
  })
}

function findColumns(headerRow) {
  const entries = [...headerRow.entries()].map(([column, value]) => [column, normalizeHeader(value)])
  const contest = entries.find(([, value]) => ['concurso', 'numeroconcurso', 'nconcurso'].includes(value))?.[0]
  const date = entries.find(([, value]) => value.includes('data') && (value.includes('sorteio') || value.includes('apuracao')))?.[0]
  const balls = entries
    .filter(([, value]) => /^(bola|dezena|d)[0-9]{1,2}$/.test(value) || /^(bola|dezena)[0-9]{1,2}$/.test(value))
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([column]) => column)
  if (!contest) fail('nao encontrei a coluna de concurso.')
  if (!date) fail('nao encontrei a coluna de data do sorteio.')
  if (balls.length < 6) fail('nao encontrei seis colunas de dezenas.')
  return { contest, date, balls: balls.slice(0, 6) }
}

function sourceUpdatedAt(fileStats) {
  if (process.env.SOURCE_UPDATED_AT) return process.env.SOURCE_UPDATED_AT
  try {
    const value = execFileSync('git', ['log', '-1', '--format=%cI', '--', 'public/data/megasena.xlsx'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (value) return value
  } catch {
    // mtime is the deterministic fallback when git metadata is unavailable.
  }
  return fileStats.mtime.toISOString()
}

const rows = await readWorkbook()
if (rows.length < 2) fail('a planilha nao contem concursos.')

const columns = findColumns(rows[0])
const seen = new Set()
const results = rows.slice(1).filter((row) => row.size).map((row) => {
  const contest = Number(row.get(columns.contest))
  const rawDate = row.get(columns.date)
  const date = /^\d+(\.\d+)?$/.test(rawDate) ? excelDate(rawDate) : String(rawDate).trim()
  const balls = columns.balls.map((column) => Number(row.get(column))).sort((a, b) => a - b)

  if (!Number.isInteger(contest) || contest < 1) fail(`concurso invalido: ${row.get(columns.contest)}.`)
  if (seen.has(contest)) fail(`concurso duplicado: ${contest}.`)
  seen.add(contest)
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) fail(`data invalida no concurso ${contest}: ${date}.`)
  if (balls.length !== 6 || new Set(balls).size !== 6 || balls.some((ball) => !Number.isInteger(ball) || ball < 1 || ball > 60)) {
    fail(`dezenas invalidas no concurso ${contest}.`)
  }
  return { n: contest, d: date, b: balls }
}).sort((a, b) => a.n - b.n)

results.forEach((draw, index) => {
  if (draw.n !== index + 1) fail(`concurso ausente ou fora de sequencia antes do ${draw.n}; esperado ${index + 1}.`)
})

const fileStats = await stat(xlsxPath)
const latest = results.at(-1)
const metadata = {
  source: 'https://loterias.caixa.gov.br/Paginas/Mega-Sena.aspx',
  sourceLabel: 'Loterias CAIXA - Mega-Sena',
  sourceUpdatedAt: sourceUpdatedAt(fileStats),
  latestContest: latest.n,
  latestDrawDate: latest.d,
  contestCount: results.length,
  generatedAt: new Date().toISOString(),
}

await writeFile(resultsPath, `${JSON.stringify(results)}\n`)
await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`)
console.log(`Base validada: ${results.length} concursos da Mega-Sena, ate o no ${latest.n} (${latest.d}).`)
