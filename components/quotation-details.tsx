"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { QuotationResults as QuotationResultsComponent } from "@/components/quotation-results"
import type { QuotationResults } from "@/lib/calculations"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateQuotationPDF } from "@/lib/pdf-generator"
import { FileDown } from "lucide-react"
import { useRouter } from "next/navigation"

interface QuotationData extends QuotationResults {
  id: string
  name: string
  eventType: string
  totalAmount: number
  ticketPrice: number
  createdAt: string
  userId: string
}

interface QuotationDetailsProps {
  id: string
}

export function QuotationDetails({ id }: QuotationDetailsProps) {
  const [quotation, setQuotation] = useState<QuotationData | null>(null)
  const [comparisonQuotation, setComparisonQuotation] = useState<QuotationData | null>(null)
  const [availableQuotations, setAvailableQuotations] = useState<QuotationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        console.log('Fetching quotation with ID:', id)
        const response = await fetch(`/api/quotations/${id}`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error response:', errorData)
          
          if (response.status === 404) {
            setError('Quotation not found. It may have been deleted.')
            toast({
              title: "Error",
              description: "Quotation not found. It may have been deleted.",
              variant: "destructive",
            })
            return
          }
          
          if (response.status === 401) {
            setError('You are not authorized to view this quotation.')
            toast({
              title: "Error",
              description: "You are not authorized to view this quotation.",
              variant: "destructive",
            })
            router.push('/quotations')
            return
          }
          
          throw new Error(errorData.error || "Failed to fetch quotation")
        }

        const data = await response.json()
        console.log('Received quotation data:', data)
        setQuotation(data)
      } catch (error) {
        console.error("Error fetching quotation:", error)
        setError('Failed to load quotation details. Please try again.')
        toast({
          title: "Error",
          description: "Failed to load quotation details. Please try again.",
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
          throw new Error("Failed to fetch quotations")
        }
        const data = await response.json()
        setAvailableQuotations(data.filter((q: QuotationData) => q.id !== id))
      } catch (error) {
        console.error("Error fetching available quotations:", error)
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
        throw new Error("Failed to fetch comparison quotation")
      }
      const data = await response.json()
      setComparisonQuotation(data)
    } catch (error) {
      console.error("Error fetching comparison quotation:", error)
      toast({
        title: "Error",
        description: "Failed to load comparison quotation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExportPDF = () => {
    if (!quotation) return

    try {
      const doc = generateQuotationPDF(quotation)
      doc.save(`cotizacion-${quotation.name.toLowerCase().replace(/\s+/g, '-')}.pdf`)
      toast({
        title: "Success",
        description: "PDF exported successfully",
      })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "Error",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => router.push('/quotations')}>
          Return to Quotations
        </Button>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Quotation not found</p>
        <Button onClick={() => router.push('/quotations')}>
          Return to Quotations
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">{quotation.name}</h2>
          <p>Event Type: {quotation.eventType}</p>
          <p>Total Amount: ${quotation.totalAmount.toFixed(2)}</p>
          <p>Created: {new Date(quotation.createdAt).toLocaleDateString()}</p>
        </div>
        <Button onClick={handleExportPDF} className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Export PDF
        </Button>
      </div>
      <QuotationResultsComponent results={quotation} />
      <div>
        <h3 className="text-lg font-semibold mb-2">Compare with another quotation</h3>
        <div className="flex items-center space-x-4">
          <Select onValueChange={handleComparisonChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a quotation" />
            </SelectTrigger>
            <SelectContent>
              {availableQuotations.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {comparisonQuotation && (
            <Button variant="outline" onClick={() => setComparisonQuotation(null)}>
              Clear Comparison
            </Button>
          )}
        </div>
      </div>
      {comparisonQuotation && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Comparison: {comparisonQuotation.name}</h3>
          <QuotationResultsComponent results={comparisonQuotation} />
        </div>
      )}
    </div>
  )
}

