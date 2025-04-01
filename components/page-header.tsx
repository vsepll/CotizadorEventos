import { ReactNode } from "react"

interface PageHeaderProps {
  heading: string
  description?: string
  children?: ReactNode
}

export function PageHeader({
  heading,
  description,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        {description && (
          <p className="text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  )
} 