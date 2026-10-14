import { ArrowClockwise, ArrowDown } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

const THRESHOLD = 72

export function PullToRefresh({ children }: { children: ReactNode }) {
  const surface = useRef<HTMLDivElement>(null)
  const busy = useRef(false)
  const [distance, setDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    if (busy.current) return
    busy.current = true
    setRefreshing(true)
    setError('')
    setDistance(0)
    try {
      // Confirm connectivity before reloading; the worker must not mask an offline failure.
      const response = await fetch(`${import.meta.env.BASE_URL}index.html?refresh=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'X-App-Refresh': 'true' },
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) throw new Error('Atualização indisponível.')
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        await registration?.update()
      }
      window.location.reload()
    } catch {
      setError('Não foi possível atualizar. Verifique sua conexão e tente novamente.')
      setRefreshing(false)
      busy.current = false
    }
  }

  useEffect(() => {
    const element = surface.current
    if (!element) return
    let start: { x: number; y: number } | null = null
    let pull = 0
    const reset = () => { start = null; pull = 0; setDistance(0) }
    const onStart = (event: TouchEvent) => {
      if (busy.current || event.touches.length !== 1 || window.scrollY > 0) return
      const target = event.target
      if (target instanceof Element && target.closest('button, a, input, select, textarea, [role="dialog"]')) return
      // Leave independently scrollable charts and panels to their own gestures.
      if (target instanceof Element) {
        for (let parent: Element | null = target; parent && parent !== element; parent = parent.parentElement) {
          const style = getComputedStyle(parent)
          if (/(auto|scroll)/.test(style.overflowY + style.overflowX) &&
            (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth)) return
        }
      }
      start = { x: event.touches[0].clientX, y: event.touches[0].clientY }
      pull = 0
    }
    const onMove = (event: TouchEvent) => {
      if (!start) return
      if (event.touches.length !== 1 || window.scrollY > 0) { reset(); return }
      const dx = event.touches[0].clientX - start.x
      const dy = event.touches[0].clientY - start.y
      if (dy < 0 || Math.abs(dx) > Math.max(12, dy)) { reset(); return }
      if (dy <= 8) return
      if (!event.cancelable) { reset(); return }
      event.preventDefault()
      pull = Math.min(100, (dy - 8) * 0.5)
      setDistance(pull)
    }
    const onEnd = () => {
      const triggered = pull >= THRESHOLD
      reset()
      if (triggered) void refresh()
    }
    element.addEventListener('touchstart', onStart, { passive: true })
    element.addEventListener('touchmove', onMove, { passive: false })
    element.addEventListener('touchend', onEnd)
    element.addEventListener('touchcancel', reset)
    return () => {
      element.removeEventListener('touchstart', onStart)
      element.removeEventListener('touchmove', onMove)
      element.removeEventListener('touchend', onEnd)
      element.removeEventListener('touchcancel', reset)
    }
  }, [])

  const visible = distance > 0 || refreshing
  return (
    <div ref={surface} className="refresh-surface">
      <div className={`refresh-indicator${refreshing ? ' is-refreshing' : ''}`} role="status" aria-live="polite"
        style={{ opacity: visible ? 1 : 0, transform: `translate(-50%, ${visible ? Math.min(distance, 72) : -48}px)` }}>
        {refreshing ? <ArrowClockwise size={18} /> : <ArrowDown size={18} style={{ transform: `rotate(${distance >= THRESHOLD ? 180 : 0}deg)` }} />}
        <span>{!visible ? '' : refreshing ? 'Atualizando…' : distance >= THRESHOLD ? 'Solte para atualizar' : 'Puxe para atualizar'}</span>
      </div>
      <button className="refresh-button" type="button" onClick={() => void refresh()} disabled={refreshing} aria-label="Atualizar aplicação" title="Atualizar aplicação">
        <ArrowClockwise size={18} /> <span>{!visible ? '' : refreshing ? 'Atualizando…' : 'Atualizar'}</span>
      </button>
      {error && <p className="refresh-error" role="alert">{error}</p>}
      {children}
    </div>
  )
}
