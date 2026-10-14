import { beforeEach, describe, expect, it, vi } from 'vitest'

const harness = vi.hoisted(() => ({
  listeners: {} as Record<string, (event: unknown) => void>,
  effects: [] as Array<() => unknown>,
}))
vi.mock('react', () => ({
  useRef: (value: unknown) => ({ current: value === null ? {
    addEventListener: (name: string, handler: (event: unknown) => void) => { harness.listeners[name] = handler },
    removeEventListener: vi.fn(),
  } : value }),
  useState: (value: unknown) => [value, vi.fn()],
  useEffect: (effect: () => unknown) => { harness.effects.push(effect) },
}))
vi.mock('@phosphor-icons/react', () => ({ ArrowClockwise: () => null, ArrowDown: () => null }))
import { PullToRefresh } from './PullToRefresh'

function touch(x: number, y: number, count = 1) {
  return { touches: Array.from({ length: count }, () => ({ clientX: x, clientY: y })), cancelable: true, preventDefault: vi.fn() }
}

beforeEach(() => {
  vi.unstubAllGlobals()
  harness.listeners = {}
  harness.effects = []
  vi.stubGlobal('Element', class {})
  vi.stubGlobal('window', { scrollY: 0, location: { reload: vi.fn() } })
  vi.stubGlobal('navigator', {})
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  PullToRefresh({ children: null })
  harness.effects.forEach((effect) => effect())
})

describe('pull to refresh', () => {
  it('refreshes once after a sufficient downward pull', async () => {
    harness.listeners.touchstart(touch(50, 100))
    const move = touch(50, 270)
    harness.listeners.touchmove(move)
    harness.listeners.touchend({})
    harness.listeners.touchend({})
    await vi.waitFor(() => expect(window.location.reload).toHaveBeenCalledOnce())
    expect(move.preventDefault).toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('index.html?refresh='), expect.objectContaining({ cache: 'no-store' }))
  })

  it.each(['short', 'horizontal', 'cancel', 'scrolled', 'multitouch'])('does not refresh for %s gestures', (kind) => {
    if (kind === 'scrolled') window.scrollY = 100
    harness.listeners.touchstart(touch(50, 100))
    harness.listeners.touchmove(touch(kind === 'horizontal' ? 400 : 50, kind === 'short' ? 140 : 270, kind === 'multitouch' ? 2 : 1))
    if (kind === 'cancel') harness.listeners.touchcancel({})
    harness.listeners.touchend({})
    expect(fetch).not.toHaveBeenCalled()
  })

  it('keeps the application open when the network fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'))
    harness.listeners.touchstart(touch(50, 100))
    harness.listeners.touchmove(touch(50, 270))
    harness.listeners.touchend({})
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    expect(window.location.reload).not.toHaveBeenCalled()
  })
})
