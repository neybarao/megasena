import { ChartBar, ClockCounterClockwise, DotsThree, Flask, GridFour, Sparkle, X } from '@phosphor-icons/react'
import { useState } from 'react'
import type { WindowSize } from './components/WindowControl'
import { useData } from './hooks/useData'
import { Backtest } from './pages/Backtest'
import { Dashboard } from './pages/Dashboard'
import { Generator } from './pages/Generator'
import { Numbers } from './pages/Numbers'

type Page = 'dashboard' | 'numbers' | 'generator' | 'backtest'

const navItems = [
  { id: 'dashboard' as const, label: 'Painel', icon: ChartBar },
  { id: 'numbers' as const, label: 'Dezenas', icon: GridFour },
  { id: 'generator' as const, label: 'Gerar', icon: Sparkle },
  { id: 'backtest' as const, label: 'Teste', icon: Flask },
]

function App() {
  const data = useData()
  const [page, setPage] = useState<Page>('dashboard')
  const [windowSize, setWindowSize] = useState<WindowSize>(100)
  const [showInfo, setShowInfo] = useState(false)

  if (data.status === 'loading') return <LoadingScreen />
  if (data.status === 'error') return <ErrorScreen message={data.error} />

  const updatedAt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.metadata.sourceUpdatedAt))

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => setPage('dashboard')} aria-label="Ir para o painel">
          <img className="brand-mark" src={`${import.meta.env.BASE_URL}icons/icon-192-v1.png`} alt="" />
          <span><strong>Mega-Sena</strong><small>analise estatistica</small></span>
        </button>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={page === item.id ? 'is-active' : ''} type="button" onClick={() => setPage(item.id)}><Icon size={18} />{item.label}</button> })}
        </nav>
        <button className="icon-button" type="button" onClick={() => setShowInfo(true)} aria-label="Informações da base" title="Informações da base"><DotsThree size={24} weight="bold" /></button>
      </header>

      <main className="main-content">
        {page === 'dashboard' && <Dashboard draws={data.draws} metadata={data.metadata} windowSize={windowSize} setWindowSize={setWindowSize} />}
        {page === 'numbers' && <Numbers draws={data.draws} windowSize={windowSize} setWindowSize={setWindowSize} />}
        {page === 'generator' && <Generator draws={data.draws} />}
        {page === 'backtest' && <Backtest draws={data.draws} />}
      </main>

      <nav className="mobile-nav" aria-label="Navegação principal">
        {navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={page === item.id ? 'is-active' : ''} type="button" onClick={() => setPage(item.id)}><Icon size={22} weight={page === item.id ? 'fill' : 'regular'} /><span>{item.label}</span></button> })}
      </nav>

      {showInfo && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowInfo(false)}><section className="info-sheet" role="dialog" aria-modal="true" aria-labelledby="info-title" onMouseDown={(event) => event.stopPropagation()}><button className="icon-button info-sheet__close" type="button" onClick={() => setShowInfo(false)} aria-label="Fechar"><X size={22} /></button><ClockCounterClockwise size={28} /><p className="eyebrow">Base de dados</p><h2 id="info-title">Atualizacao e origem</h2><dl><div><dt>Ultimo concurso</dt><dd>{data.metadata.latestContest} - {data.metadata.latestDrawDate}</dd></div><div><dt>Concursos carregados</dt><dd>{data.metadata.contestCount.toLocaleString('pt-BR')}</dd></div><div><dt>XLSX atualizado</dt><dd>{updatedAt}</dd></div></dl><a href={data.metadata.source} target="_blank" rel="noreferrer">Abrir pagina oficial da CAIXA</a><p className="fine-print">A aplicacao funciona sem API. Os calculos usam somente o arquivo incluido nesta versao.</p></section></div>}
    </div>
  )
}

function LoadingScreen() {
  return <main className="state-screen"><div className="state-logo"><img className="brand-mark" src={`${import.meta.env.BASE_URL}icons/icon-192-v1.png`} alt="" /></div><div className="skeleton skeleton--title" /><div className="skeleton skeleton--copy" /><div className="skeleton skeleton--panel" /><p>Preparando as estatisticas...</p></main>
}

function ErrorScreen({ message }: { message: string }) {
  return <main className="state-screen"><span className="state-error">!</span><h1>Nao foi possivel abrir a base</h1><p>{message}</p><button className="button button--primary" type="button" onClick={() => window.location.reload()}>Tentar novamente</button></main>
}

export default App
