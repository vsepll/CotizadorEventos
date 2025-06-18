import React, { memo } from 'react'
import { Skeleton } from './skeleton'
import { Card, CardContent, CardHeader } from './card'
import { cn } from '@/lib/utils'

interface OptimizedLoadingProps {
  variant?: 'dashboard' | 'form' | 'table' | 'cards' | 'custom'
  className?: string
  count?: number
  height?: string | number
  rounded?: boolean
}

// OPTIMIZACIÓN: Componente memoizado para evitar re-renders
export const OptimizedLoading = memo(function OptimizedLoading({
  variant = 'custom',
  className,
  count = 1,
  height = 'h-4',
  rounded = true
}: OptimizedLoadingProps) {
  const baseClasses = cn(
    'animate-pulse',
    typeof height === 'string' ? height : `h-[${height}px]`,
    rounded && 'rounded-md',
    className
  )

  const renderContent = () => {
    switch (variant) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
            
            {/* Stats cards skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Table skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-6 gap-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'form':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'table':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {/* Table header */}
                  <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                  {/* Table rows */}
                  {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="grid grid-cols-5 gap-4 p-4 border-b">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Skeleton key={j} className="h-4 w-full" />
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'cards':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton key={i} className={baseClasses} />
            ))}
          </div>
        )
    }
  }

  return <div className={cn('w-full', className)}>{renderContent()}</div>
})

// OPTIMIZACIÓN: Componentes especializados para casos comunes
export const DashboardLoading = memo(() => (
  <OptimizedLoading variant="dashboard" />
))

export const FormLoading = memo(() => (
  <OptimizedLoading variant="form" />
))

export const TableLoading = memo(({ rows = 5 }: { rows?: number }) => (
  <OptimizedLoading variant="table" count={rows} />
))

export const CardsLoading = memo(({ count = 6 }: { count?: number }) => (
  <OptimizedLoading variant="cards" count={count} />
))

// OPTIMIZACIÓN: Hook para determinar el loading state más apropiado
export function useOptimizedLoading(type: 'dashboard' | 'form' | 'table' | 'cards' = 'dashboard') {
  return React.useMemo(() => {
    switch (type) {
      case 'dashboard': return DashboardLoading
      case 'form': return FormLoading
      case 'table': return TableLoading
      case 'cards': return CardsLoading
      default: return DashboardLoading
    }
  }, [type])
} 