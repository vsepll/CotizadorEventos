"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface Quotation {
  id: string
  name: string
  eventType: string
  totalAmount: number
  createdAt: string
}

export function QuotationList() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const response = await fetch("/api/quotations")
        if (!response.ok) {
          throw new Error("Failed to fetch quotations")
        }
        const data = await response.json()
        setQuotations(data)
      } catch (error) {
        console.error("Error fetching quotations:", error)
        toast({
          title: "Error",
          description: "Failed to load quotations. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuotations()
  }, [toast])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete quotation")
      }
      setQuotations((prevQuotations) => prevQuotations.filter((q) => q.id !== id))
      toast({
        title: "Success",
        description: "Quotation deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting quotation:", error)
      toast({
        title: "Error",
        description: "Failed to delete quotation. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (quotations.length === 0) {
    return <div>No saved quotations found.</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {quotations.map((quotation) => (
        <Card key={quotation.id}>
          <CardHeader>
            <CardTitle>{quotation.name}</CardTitle>
            <CardDescription>Tipo de Evento: {quotation.eventType}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Monto Total: ${quotation.totalAmount.toFixed(2)}</p>
            <p>Creado: {new Date(quotation.createdAt).toLocaleDateString()}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button asChild>
              <Link href={`/quotations/${quotation.id}`}>Ver Detalles</Link>
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(quotation.id)}>
              Eliminar
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

