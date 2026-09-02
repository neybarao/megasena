import { useEffect, useState } from 'react'
import type { Draw, Metadata } from '../analysis/types'

type DataState =
  | { status: 'loading'; draws: Draw[]; metadata: null; error: null }
  | { status: 'error'; draws: Draw[]; metadata: null; error: string }
  | { status: 'ready'; draws: Draw[]; metadata: Metadata; error: null }

export function useData(): DataState {
  const [state, setState] = useState<DataState>({ status: 'loading', draws: [], metadata: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    const base = import.meta.env.BASE_URL

    Promise.all([
      fetch(`${base}data/results.json`, { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error('Não foi possível carregar os concursos.')
        return response.json() as Promise<Draw[]>
      }),
      fetch(`${base}data/metadata.json`, { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error('Não foi possível carregar os metadados da base.')
        return response.json() as Promise<Metadata>
      }),
    ])
      .then(([draws, metadata]) => setState({ status: 'ready', draws, metadata, error: null }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({
          status: 'error',
          draws: [],
          metadata: null,
          error: error instanceof Error ? error.message : 'Erro inesperado ao carregar a base.',
        })
      })

    return () => controller.abort()
  }, [])

  return state
}
