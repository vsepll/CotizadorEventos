import { useState, useEffect, useRef, useCallback } from 'react'

type SetValue<T> = (value: T | ((prevValue: T) => T)) => void

interface UsePersistentStateOptions {
  debounceMs?: number
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options: UsePersistentStateOptions = {}
): [T, SetValue<T>] {
  const {
    debounceMs = 300,
    serialize = JSON.stringify,
    deserialize = JSON.parse
  } = options

  // Ref para evitar actualizaciones innecesarias
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  // Estado interno
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue
    }

    try {
      const item = window.localStorage.getItem(key)
      if (item === null) {
        return defaultValue
      }
      return deserialize(item)
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return defaultValue
    }
  })

  // Función para persistir en localStorage de forma debounceda
  const persistToStorage = useCallback((value: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serialize(value))
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)
      }
    }, debounceMs)
  }, [key, serialize, debounceMs])

  // Setter optimizado
  const setValue: SetValue<T> = useCallback((value) => {
    try {
      const newValue = value instanceof Function ? value(storedValue) : value
      setStoredValue(newValue)
      
      // Solo persistir si ya se inicializó (evitar persistir el valor inicial)
      if (isInitializedRef.current) {
        persistToStorage(newValue)
      }
    } catch (error) {
      console.error(`Error updating state for key "${key}":`, error)
    }
  }, [storedValue, persistToStorage, key])

  // Marcar como inicializado después del primer render
  useEffect(() => {
    isInitializedRef.current = true
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [storedValue, setValue]
}

// Hook especializado para datos de formulario
export function useFormDataPersistence<T>(defaultFormData: T) {
  return usePersistentState('quotationFormData', defaultFormData, {
    debounceMs: 500 // Debounce más largo para formularios
  })
}

// Hook especializado para preferencias de UI
export function useUIPreferences() {
  return usePersistentState('quotationUIPreferences', {
    activeTab: 'event',
    sidebarCollapsed: false
  }, {
    debounceMs: 100 // Respuesta rápida para UI
  })
} 