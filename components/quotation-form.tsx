"use client"

import type React from "react"
import type { QuotationResults } from "@/lib/calculations"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QuotationResults as QuotationResultsComponent } from "@/components/quotation-results"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InfoIcon, Calculator, Save, Building2, CreditCard, Users, Percent } from "lucide-react"
import { Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface TooltipLabelProps {
  htmlFor: string;
  label: string;
  tooltip: string;
  required?: boolean;
}

export function QuotationForm() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [formData, setFormData] = useState({
    eventType: "",
    totalAmount: "",
    ticketPrice: "",
    platformPercentage: "",
    ticketingPercentage: "",
    additionalServicesPercentage: "",
    creditCardPercentage: "",
    debitCardPercentage: "",
    cashPercentage: "",
    credentialsCost: "",
    supervisorsCost: "",
    operatorsCost: "",
    mobilityCost: "",
  })
  const [results, setResults] = useState<QuotationResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [quotationName, setQuotationName] = useState("")
  const [activeTab, setActiveTab] = useState("event")

  useEffect(() => {
    const fetchGlobalParameters = async () => {
      try {
        const response = await fetch("/api/admin/parameters")
        if (!response.ok) {
          throw new Error("Failed to fetch global parameters")
        }
        const data = await response.json()
        setFormData((prevData) => ({
          ...prevData,
          platformPercentage: data.defaultPlatformFee.toString(),
          ticketingPercentage: data.defaultTicketingFee.toString(),
          additionalServicesPercentage: data.defaultAdditionalServicesFee.toString(),
          creditCardPercentage: data.defaultCreditCardFee.toString(),
          debitCardPercentage: data.defaultDebitCardFee.toString(),
          cashPercentage: data.defaultCashFee.toString(),
          credentialsCost: data.defaultCredentialsCost.toString(),
          supervisorsCost: data.defaultSupervisorsCost.toString(),
          operatorsCost: data.defaultOperatorsCost.toString(),
          mobilityCost: data.defaultMobilityCost.toString(),
        }))
      } catch (error) {
        console.error("Error fetching global parameters:", error)
        toast({
          title: "Error",
          description: "Failed to load default parameters. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchGlobalParameters()
  }, [toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, eventType: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const data = {
        eventType: formData.eventType,
        totalAmount: Number(formData.totalAmount),
        ticketPrice: Number(formData.ticketPrice),
        platformPercentage: Number(formData.platformPercentage),
        ticketingPercentage: Number(formData.ticketingPercentage),
        additionalServicesPercentage: Number(formData.additionalServicesPercentage),
        creditCardPercentage: Number(formData.creditCardPercentage),
        debitCardPercentage: Number(formData.debitCardPercentage),
        cashPercentage: Number(formData.cashPercentage),
        credentialsCost: Number(formData.credentialsCost),
        supervisorsCost: Number(formData.supervisorsCost),
        operatorsCost: Number(formData.operatorsCost),
        mobilityCost: Number(formData.mobilityCost),
      }

      console.log('Sending data:', data)

      const response = await fetch("/api/calculate-quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to calculate quotation")
      }

      setResults(responseData)
    } catch (error) {
      console.error("Error calculating quotation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while calculating the quotation",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveQuotation = async () => {
    if (!results) return
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to save quotations",
        variant: "destructive",
      })
      return
    }

    console.log('Current session:', session)

    setIsSaving(true)
    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: quotationName,
          eventType: formData.eventType,
          totalAmount: Number.parseFloat(formData.totalAmount),
          ticketPrice: Number.parseFloat(formData.ticketPrice),
          ...results,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.log('Error response:', errorData)
        throw new Error(errorData.error || "Failed to save quotation")
      }

      toast({
        title: "Success",
        description: "Quotation saved successfully",
      })
      
      // Redirect to quotations list
      router.push('/quotations')
    } catch (error) {
      console.error("Error saving quotation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save quotation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const TooltipLabel = ({ htmlFor, label, tooltip, required = false }: TooltipLabelProps) => (
    <div className="flex items-center space-x-2">
      <Label htmlFor={htmlFor} className="flex items-center space-x-1">
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )

  const isFormValid = () => {
    return (
      formData.eventType &&
      formData.totalAmount &&
      formData.ticketPrice &&
      formData.platformPercentage &&
      formData.ticketingPercentage &&
      formData.additionalServicesPercentage &&
      formData.creditCardPercentage &&
      formData.debitCardPercentage &&
      formData.cashPercentage &&
      formData.credentialsCost &&
      formData.supervisorsCost &&
      formData.operatorsCost &&
      formData.mobilityCost
    )
  }

  // If no session, return null or a login prompt
  if (!session) {
    return (
      <div className="text-center py-8">
        <p>Debes iniciar sesión para crear una cotización</p>
        <Button asChild className="mt-4">
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Nueva Cotización</CardTitle>
          <CardDescription>Complete los detalles del evento para generar una cotización</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 gap-4 p-1">
              <TabsTrigger value="event" className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>Evento</span>
              </TabsTrigger>
              <TabsTrigger value="fees" className="flex items-center space-x-2">
                <Percent className="h-4 w-4" />
                <span>Comisiones</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Pagos</span>
              </TabsTrigger>
              <TabsTrigger value="operational" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Operativo</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="event" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="eventType"
                    label="Tipo de Evento"
                    tooltip="Seleccione la categoría del evento que está cotizando."
                    required
                  />
                  <Select value={formData.eventType} onValueChange={(value) => handleSelectChange(value)}>
                    <SelectTrigger id="eventType" className="w-full">
                      <SelectValue placeholder="Seleccionar tipo de evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Tipo A - Eventos Grandes</SelectItem>
                      <SelectItem value="B">Tipo B - Eventos Medianos</SelectItem>
                      <SelectItem value="C">Tipo C - Eventos Pequeños</SelectItem>
                      <SelectItem value="D">Tipo D - Eventos Especiales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="totalAmount"
                    label="Monto Total del Evento"
                    tooltip="El ingreso total esperado para el evento."
                    required
                  />
                  <Input
                    id="totalAmount"
                    name="totalAmount"
                    type="number"
                    value={formData.totalAmount}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ingrese el monto total"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="ticketPrice"
                    label="Precio Promedio de Entrada"
                    tooltip="El precio promedio de una entrada para el evento."
                    required
                  />
                  <Input
                    id="ticketPrice"
                    name="ticketPrice"
                    type="number"
                    value={formData.ticketPrice}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ingrese el precio del ticket"
                    required
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fees" className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="platformPercentage"
                    label="Comisión de Plataforma (%)"
                    tooltip="El porcentaje de comisión cobrado por la plataforma de ticketing."
                    required
                  />
                  <Input
                    id="platformPercentage"
                    name="platformPercentage"
                    type="number"
                    value={formData.platformPercentage}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ej: 5"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="ticketingPercentage"
                    label="Comisión de Ticketing (%)"
                    tooltip="El porcentaje de comisión por servicios de ticketing."
                    required
                  />
                  <Input
                    id="ticketingPercentage"
                    name="ticketingPercentage"
                    type="number"
                    value={formData.ticketingPercentage}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ej: 3"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="additionalServicesPercentage"
                    label="Servicios Adicionales (%)"
                    tooltip="El porcentaje por servicios adicionales proporcionados."
                    required
                  />
                  <Input
                    id="additionalServicesPercentage"
                    name="additionalServicesPercentage"
                    type="number"
                    value={formData.additionalServicesPercentage}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ej: 2"
                    required
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="creditCardPercentage"
                    label="Comisión Tarjeta de Crédito (%)"
                    tooltip="El porcentaje de comisión para transacciones con tarjeta de crédito."
                    required
                  />
                  <Input
                    id="creditCardPercentage"
                    name="creditCardPercentage"
                    type="number"
                    value={formData.creditCardPercentage}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ej: 3.67"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="debitCardPercentage"
                    label="Comisión Tarjeta de Débito (%)"
                    tooltip="El porcentaje de comisión para transacciones con tarjeta de débito."
                    required
                  />
                  <Input
                    id="debitCardPercentage"
                    name="debitCardPercentage"
                    type="number"
                    value={formData.debitCardPercentage}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ej: 0.8"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="cashPercentage"
                    label="Comisión Efectivo (%)"
                    tooltip="El porcentaje de comisión para transacciones en efectivo."
                    required
                  />
                  <Input
                    id="cashPercentage"
                    name="cashPercentage"
                    type="number"
                    value={formData.cashPercentage}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ej: 0.5"
                    required
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="operational" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="credentialsCost"
                    label="Costo de Credenciales"
                    tooltip="El costo total para credenciales y control de acceso."
                    required
                  />
                  <Input
                    id="credentialsCost"
                    name="credentialsCost"
                    type="number"
                    value={formData.credentialsCost}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ingrese el costo"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="supervisorsCost"
                    label="Costo de Supervisores"
                    tooltip="El costo total para supervisores y personal de gestión."
                    required
                  />
                  <Input
                    id="supervisorsCost"
                    name="supervisorsCost"
                    type="number"
                    value={formData.supervisorsCost}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ingrese el costo"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="operatorsCost"
                    label="Costo de Operadores"
                    tooltip="El costo total para operadores y personal en sitio."
                    required
                  />
                  <Input
                    id="operatorsCost"
                    name="operatorsCost"
                    type="number"
                    value={formData.operatorsCost}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ingrese el costo"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="mobilityCost"
                    label="Costo de Movilidad"
                    tooltip="El costo total para transporte y logística."
                    required
                  />
                  <Input
                    id="mobilityCost"
                    name="mobilityCost"
                    type="number"
                    value={formData.mobilityCost}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ingrese el costo"
                    required
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex justify-between items-center">
            <div className="flex space-x-4">
              {activeTab !== "event" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const tabs = ["event", "fees", "payments", "operational"]
                    const currentIndex = tabs.indexOf(activeTab)
                    setActiveTab(tabs[currentIndex - 1])
                  }}
                >
                  Anterior
                </Button>
              )}
              {activeTab !== "operational" && (
                <Button
                  onClick={() => {
                    const tabs = ["event", "fees", "payments", "operational"]
                    const currentIndex = tabs.indexOf(activeTab)
                    setActiveTab(tabs[currentIndex + 1])
                  }}
                >
                  Siguiente
                </Button>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !isFormValid()}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Calculando...</span>
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4" />
                  <span>Calcular Cotización</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <>
          <QuotationResultsComponent results={results} />
          <div className="mt-6 flex justify-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Guardar Cotización</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Guardar Cotización</DialogTitle>
                  <DialogDescription>
                    Ingrese un nombre para identificar esta cotización
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="quotationName">Nombre de la Cotización</Label>
                    <Input
                      id="quotationName"
                      value={quotationName}
                      onChange={(e) => setQuotationName(e.target.value)}
                      placeholder="Ej: Evento Corporativo 2024"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveQuotation} disabled={isSaving || !quotationName}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </>
      )}
    </div>
  )
}

