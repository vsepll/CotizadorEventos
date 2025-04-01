"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"

const STATUS_LABELS = {
  "all": "Todas",
  "DRAFT": "Borradores",
  "REVIEW": "En Revisión",
  "APPROVED": "Aprobadas",
  "REJECTED": "Rechazadas"
}

export function QuotationStatusFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeStatus, setActiveStatus] = useState<string>("all")
  
  // Initialize from URL query param
  useEffect(() => {
    const statusParam = searchParams.get("status")
    if (statusParam && Object.keys(STATUS_LABELS).includes(statusParam)) {
      setActiveStatus(statusParam)
    }
  }, [searchParams])
  
  // Handle status change
  const handleStatusChange = (status: string) => {
    setActiveStatus(status)
    
    // Update URL to reflect selected status
    const params = new URLSearchParams(searchParams.toString())
    
    if (status === "all") {
      params.delete("status")
    } else {
      params.set("status", status)
    }
    
    // Push new URL with updated params
    router.push(`?${params.toString()}`)
  }
  
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">Filtrar por Estado</h2>
      <Tabs value={activeStatus} onValueChange={handleStatusChange} className="w-fit">
        <TabsList>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
} 