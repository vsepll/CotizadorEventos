"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Search,
  Trash2,
  Eye,
  FileDown,
  Plus,
  ArrowUpDown,
  Loader2,
  ArrowLeft
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { generateQuotationPDF } from "@/lib/pdf-generator"

interface Quotation {
  id: string
  name: string
  eventType: string
  totalAmount: number
  createdAt: string
  grossProfitability: number
  ticketQuantity: number
  user?: {
    name: string | null
    email: string
  }
}

interface QuotationResponse {
  quotations: Quotation[];
  isAdmin: boolean;
}

export function QuotationList() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isAdmin, setIsAdmin] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Quotation
    direction: "ascending" | "descending"
  }>({ key: "createdAt", direction: "descending" })
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchQuotations()
  }, [])

  useEffect(() => {
    filterQuotations()
  }, [searchTerm, selectedType, quotations])

  const fetchQuotations = async () => {
    try {
      const response = await fetch("/api/quotations", {
        credentials: "include"
      })
      if (!response.ok) {
        throw new Error("Failed to fetch quotations")
      }
      const data: QuotationResponse = await response.json()
      setQuotations(data.quotations)
      setFilteredQuotations(data.quotations)
      setIsAdmin(data.isAdmin)
    } catch (error) {
      console.error("Error fetching quotations:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las cotizaciones. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (!response.ok) {
        throw new Error("Failed to delete quotation")
      }
      setQuotations((prevQuotations) => prevQuotations.filter((q) => q.id !== id))
      toast({
        title: "Éxito",
        description: "Cotización eliminada correctamente",
      })
    } catch (error) {
      console.error("Error deleting quotation:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la cotización. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  const filterQuotations = () => {
    let filtered = [...quotations]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (isAdmin && q.user && (
            (q.user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            q.user.email.toLowerCase().includes(searchTerm.toLowerCase())
          ))
      )
    }

    // Filtrar por tipo de evento
    if (selectedType !== "all") {
      filtered = filtered.filter((q) => q.eventType === selectedType)
    }

    // Ordenar
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "ascending"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "ascending"
          ? aValue - bValue
          : bValue - aValue
      }

      return 0
    })

    setFilteredQuotations(filtered)
  }

  const handleSort = (key: keyof Quotation) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "ascending"
          ? "descending"
          : "ascending",
    }))
  }

  const handleExportPDF = async (quotation: Quotation) => {
    setIsExporting(quotation.id)
    try {
      // Obtener los detalles completos de la cotización
      const response = await fetch(`/api/quotations/${quotation.id}`, {
        credentials: "include"
      })
      if (!response.ok) {
        throw new Error("Failed to fetch quotation details")
      }
      const detailedQuotation = await response.json()
      
      const doc = generateQuotationPDF(detailedQuotation)
      doc.save(`cotizacion-${quotation.name.toLowerCase().replace(/\s+/g, '-')}.pdf`)
      
      toast({
        title: "Éxito",
        description: "PDF exportado correctamente",
      })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "Error",
        description: "No se pudo exportar el PDF. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al Dashboard</span>
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Cotizaciones</h2>
        </div>
        <Button asChild>
          <Link href="/quotation" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Cotización</span>
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cotizaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="A">Tipo A - Grandes</SelectItem>
            <SelectItem value="B">Tipo B - Medianos</SelectItem>
            <SelectItem value="C">Tipo C - Pequeños</SelectItem>
            <SelectItem value="D">Tipo D - Especiales</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredQuotations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron cotizaciones</p>
          {searchTerm || selectedType !== "all" ? (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchTerm("")
                setSelectedType("all")
              }}
            >
              Limpiar filtros
            </Button>
          ) : (
            <Button asChild className="mt-4">
              <Link href="/quotation">Crear primera cotización</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuotations.map((quotation) => (
            <Card key={quotation.id} className="mb-4">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{quotation.name}</CardTitle>
                    <CardDescription className="flex items-center space-x-4">
                      <span>Tipo {quotation.eventType}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(quotation.createdAt), "d 'de' MMMM, yyyy", {
                          locale: es,
                        })}
                      </span>
                      {quotation.user && (
                        <>
                          <span>•</span>
                          <span>
                            Creado por {quotation.user.name || quotation.user.email}
                          </span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      ${quotation.totalAmount.toLocaleString("es-MX")}
                    </p>
                    <p
                      className={`text-sm ${
                        quotation.grossProfitability >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {quotation.grossProfitability.toFixed(2)}% de rentabilidad
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{quotation.ticketQuantity} tickets</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF(quotation)}
                  disabled={isExporting === quotation.id}
                >
                  {isExporting === quotation.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  <span className="ml-2">Exportar PDF</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/quotations/${quotation.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="ml-2">Ver Detalles</span>
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                      <span className="ml-2">Eliminar</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente la
                        cotización.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(quotation.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

