"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { QuotationResults as QuotationResultsComponent } from "@/components/quotation-results"
import type { QuotationResults } from "@/lib/calculations"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { generateQuotationPDF } from "@/lib/pdf-generator"
import { ArrowLeft, FileDown, Calendar, DollarSign, Users, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface QuotationData extends QuotationResults {
  id: string
  name: string
  eventType: string
  totalAmount: number
  ticketPrice: number
  createdAt: string
  userId: string
  status?: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'REJECTED'
}

interface QuotationDetailsProps {
  id: string
}

export function QuotationDetails({ id }: QuotationDetailsProps) {
  const [quotation, setQuotation] = useState<QuotationData | null>(null)
  const [comparisonQuotation, setComparisonQuotation] = useState<QuotationData | null>(null)
  const [availableQuotations, setAvailableQuotations] = useState<QuotationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const response = await fetch(`/api/quotations/${id}`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          
          if (response.status === 404) {
            setError('No se encontró la cotización. Es posible que haya sido eliminada.')
            toast({
              title: "Error",
              description: "No se encontró la cotización. Es posible que haya sido eliminada.",
              variant: "destructive",
            })
            return
          }
          
          if (response.status === 401) {
            setError('No tienes autorización para ver esta cotización.')
            toast({
              title: "Error",
              description: "No tienes autorización para ver esta cotización.",
              variant: "destructive",
            })
            router.push('/quotations')
            return
          }
          
          throw new Error(errorData.error || "Error al cargar la cotización")
        }

        const data = await response.json()
        setQuotation(data)
      } catch (error) {
        console.error("Error al cargar la cotización:", error)
        setError('Error al cargar los detalles de la cotización. Por favor, intente nuevamente.')
        toast({
          title: "Error",
          description: "Error al cargar los detalles de la cotización. Por favor, intente nuevamente.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    const fetchAvailableQuotations = async () => {
      try {
        const response = await fetch("/api/quotations", {
          credentials: 'include'
        })
        if (!response.ok) {
          throw new Error("Error al cargar las cotizaciones disponibles")
        }
        const data = await response.json()
        setAvailableQuotations(data.filter((q: QuotationData) => q.id !== id))
      } catch (error) {
        console.error("Error al cargar las cotizaciones disponibles:", error)
      }
    }

    fetchQuotation()
    fetchAvailableQuotations()
  }, [id, toast, router])

  const handleComparisonChange = async (comparisonId: string) => {
    try {
      const response = await fetch(`/api/quotations/${comparisonId}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error("Error al cargar la cotización para comparar")
      }
      const data = await response.json()
      setComparisonQuotation(data)
    } catch (error) {
      console.error("Error al cargar la cotización para comparar:", error)
      toast({
        title: "Error",
        description: "Error al cargar la cotización para comparar. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  const handleExportPDF = async () => {
    if (!quotation) return

    setIsExporting(true)
    try {
      const doc = generateQuotationPDF(quotation)
      doc.save(`cotizacion-${quotation.name.toLowerCase().replace(/\s+/g, '-')}.pdf`)
      toast({
        title: "Éxito",
        description: "PDF exportado correctamente",
      })
    } catch (error) {
      console.error("Error al exportar PDF:", error)
      toast({
        title: "Error",
        description: "Error al exportar el PDF. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: 'review' | 'approved' | 'rejected') => {
    const apiStatus = newStatus.toUpperCase() as 'REVIEW' | 'APPROVED' | 'REJECTED';
    
    if (!quotation) return;
    
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/quotations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: apiStatus }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el estado');
      }
      
      const updatedData = await response.json();
      
      setQuotation(prev => prev ? { ...prev, status: apiStatus } : null);
      
      toast({
        title: 'Estado actualizado',
        description: `La cotización ha sido ${ 
          newStatus === 'approved' ? 'aprobada' : 
          newStatus === 'rejected' ? 'rechazada' : 
          'enviada a revisión'
        } correctamente.`,
      });
      
      if (newStatus === 'approved' || newStatus === 'rejected') {
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de la cotización. Por favor, intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[150px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <p className="text-red-500 text-center">{error}</p>
        <Button onClick={() => router.push('/quotations')} variant="outline" className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a Cotizaciones</span>
        </Button>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <p className="text-muted-foreground text-center">No se encontró la cotización</p>
        <Button onClick={() => router.push('/quotations')} variant="outline" className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a Cotizaciones</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al Dashboard</span>
          </Button>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">{quotation.name}</h2>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(quotation.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>${(quotation.totalAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{(quotation.ticketQuantity || 0).toLocaleString()} tickets</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => router.push('/quotations')} variant="outline" className="flex-1 sm:flex-none">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button 
            onClick={handleExportPDF} 
            className="flex-1 sm:flex-none"
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {quotation && (
        <QuotationResultsComponent 
          id={quotation.id}
          results={quotation}
          comparisonResults={comparisonQuotation}
          status={quotation.status?.toLowerCase() as 'draft' | 'review' | 'approved' | 'rejected' | undefined || 'draft'}
          onStatusChange={handleStatusChange}
        />
      )}

      {comparisonQuotation ? (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Comparando con: {comparisonQuotation.name}</h3>
            <Button 
              variant="ghost" 
              onClick={() => setComparisonQuotation(null)}
            >
              Eliminar comparación
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Comparar con otra cotización</h3>
          <div className="flex gap-2">
            <Select onValueChange={handleComparisonChange}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Seleccionar cotización" />
              </SelectTrigger>
              <SelectContent>
                {availableQuotations.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}

