import { useState, useEffect, useCallback, useRef } from 'react'

interface UseOptimizedFetchOptions<T> {
  url: string
  dependencies?: unknown[]
  cacheKey?: string
  debounceMs?: number
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseOptimizedFetchResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

// Cache simple en memoria
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export function useOptimizedFetch<T = unknown>({
  url,
  dependencies = [],
  cacheKey,
  debounceMs = 300,
  enabled = true,
  onSuccess,
  onError
}: UseOptimizedFetchOptions<T>): UseOptimizedFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const fetchData = useCallback(async () => {
    if (!enabled) return
    
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Verificar cache si hay cacheKey
    if (cacheKey) {
      const cached = cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setData(cached.data as T)
        setLoading(false)
        setError(null)
        onSuccess?.(cached.data as T)
        return
      }
    }
    
    abortControllerRef.current = new AbortController()
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(url, {
        credentials: 'include',
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Guardar en cache si hay cacheKey
      if (cacheKey) {
        cache.set(cacheKey, { data: result, timestamp: Date.now() })
      }
      
      setData(result)
      setError(null)
      onSuccess?.(result)
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        onError?.(error)
      }
    } finally {
      setLoading(false)
    }
  }, [url, enabled, cacheKey, onSuccess, onError])
  
  const debouncedFetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(fetchData, debounceMs)
  }, [fetchData, debounceMs])
  
  useEffect(() => {
    debouncedFetch()
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, dependencies)
  
  return { data, loading, error, refetch: fetchData }
}

// Hook especializado para parámetros globales
export function useGlobalParameters() {
  return useOptimizedFetch({
    url: '/api/admin/parameters',
    cacheKey: 'global-parameters',
    debounceMs: 0 // No debounce para parámetros críticos
  })
}

// Hook especializado para tipos de empleados
export function useEmployeeTypes() {
  return useOptimizedFetch({
    url: '/api/employee-types',
    cacheKey: 'employee-types'
  })
} 