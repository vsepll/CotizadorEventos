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
import { InfoIcon } from "lucide-react"
import { Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface TooltipLabelProps {
  htmlFor: string;
  label: string;
  tooltip: string;
}

export function QuotationForm() {
  const { toast } = useToast()
  const { data: session } = useSession()
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

  const TooltipLabel = ({ htmlFor, label, tooltip }: TooltipLabelProps) => (
    <div className="flex items-center space-x-2">
      <Label htmlFor={htmlFor}>{label}</Label>
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <TooltipLabel
          htmlFor="eventType"
          label="Tipo de Evento"
          tooltip="Seleccione la categoría del evento que está cotizando."
        />
        <Select value={formData.eventType} onValueChange={handleSelectChange}>
          <SelectTrigger id="eventType">
            <SelectValue placeholder="Seleccionar tipo de evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">Tipo A</SelectItem>
            <SelectItem value="B">Tipo B</SelectItem>
            <SelectItem value="C">Tipo C</SelectItem>
            <SelectItem value="D">Tipo D</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <TooltipLabel
          htmlFor="totalAmount"
          label="Monto Total del Evento"
          tooltip="El ingreso total esperado para el evento."
        />
        <Input
          id="totalAmount"
          name="totalAmount"
          type="number"
          value={formData.totalAmount}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="space-y-2">
        <TooltipLabel
          htmlFor="ticketPrice"
          label="Precio Promedio de Entrada"
          tooltip="El precio promedio de una entrada para el evento."
        />
        <Input
          id="ticketPrice"
          name="ticketPrice"
          type="number"
          value={formData.ticketPrice}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <TooltipLabel
            htmlFor="platformPercentage"
            label="Comisión de Plataforma (%)"
            tooltip="El porcentaje de comisión cobrado por la plataforma de ticketing."
          />
          <Input
            id="platformPercentage"
            name="platformPercentage"
            type="number"
            value={formData.platformPercentage}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <TooltipLabel
            htmlFor="ticketingPercentage"
            label="Comisión de Ticketing (%)"
            tooltip="El porcentaje de comisión por servicios de ticketing."
          />
          <Input
            id="ticketingPercentage"
            name="ticketingPercentage"
            type="number"
            value={formData.ticketingPercentage}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <TooltipLabel
            htmlFor="additionalServicesPercentage"
            label="Servicios Adicionales (%)"
            tooltip="El porcentaje por servicios adicionales proporcionados."
          />
          <Input
            id="additionalServicesPercentage"
            name="additionalServicesPercentage"
            type="number"
            value={formData.additionalServicesPercentage}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <TooltipLabel
            htmlFor="creditCardPercentage"
            label="Comisión Tarjeta de Crédito (%)"
            tooltip="El porcentaje de comisión para transacciones con tarjeta de crédito."
          />
          <Input
            id="creditCardPercentage"
            name="creditCardPercentage"
            type="number"
            value={formData.creditCardPercentage}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <TooltipLabel
            htmlFor="debitCardPercentage"
            label="Comisión Tarjeta de Débito (%)"
            tooltip="El porcentaje de comisión para transacciones con tarjeta de débito."
          />
          <Input
            id="debitCardPercentage"
            name="debitCardPercentage"
            type="number"
            value={formData.debitCardPercentage}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <TooltipLabel
            htmlFor="cashPercentage"
            label="Comisión Efectivo (%)"
            tooltip="El porcentaje de comisión para transacciones en efectivo."
          />
          <Input
            id="cashPercentage"
            name="cashPercentage"
            type="number"
            value={formData.cashPercentage}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <TooltipLabel
            htmlFor="credentialsCost"
            label="Costo de Credenciales"
            tooltip="El costo total para credenciales y control de acceso."
          />
          <Input
            id="credentialsCost"
            name="credentialsCost"
            type="number"
            value={formData.credentialsCost}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <TooltipLabel
            htmlFor="supervisorsCost"
            label="Costo de Supervisores"
            tooltip="El costo total para supervisores y personal de gestión."
          />
          <Input
            id="supervisorsCost"
            name="supervisorsCost"
            type="number"
            value={formData.supervisorsCost}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <TooltipLabel
            htmlFor="operatorsCost"
            label="Costo de Operadores"
            tooltip="El costo total para operadores y personal en sitio."
          />
          <Input
            id="operatorsCost"
            name="operatorsCost"
            type="number"
            value={formData.operatorsCost}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <TooltipLabel
            htmlFor="mobilityCost"
            label="Costo de Movilidad"
            tooltip="El costo total para transporte y logística."
          />
          <Input
            id="mobilityCost"
            name="mobilityCost"
            type="number"
            value={formData.mobilityCost}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Calculando...
          </>
        ) : (
          "Calcular Cotización"
        )}
      </Button>
      {results && (
        <>
          <QuotationResultsComponent results={results} />
          <Dialog>
            <DialogTrigger asChild>
              <Button>Save Quotation</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Quotation</DialogTitle>
                <DialogDescription>Enter a name for this quotation to save it for future reference.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="quotationName">Quotation Name</Label>
                  <Input
                    id="quotationName"
                    value={quotationName}
                    onChange={(e) => setQuotationName(e.target.value)}
                    placeholder="Enter a name for this quotation"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveQuotation} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Quotation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </form>
  )
}

