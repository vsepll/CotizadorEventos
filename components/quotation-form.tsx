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
import { CustomOperationalCosts } from "@/components/custom-operational-costs"

interface TooltipLabelProps {
  htmlFor: string;
  label: string;
  tooltip: string;
  required?: boolean;
}

interface FormData {
  eventType: string;
  totalAmount: string;
  ticketPrice: string;
  platform: {
    name: "TICKET_PLUS" | "PALCO4";
    percentage: string;
  };
  serviceCharge: string;
  additionalServicesPercentage: string;
  paymentMethods: {
    credit: {
      percentage: string;
      chargedTo: "US" | "CLIENT" | "CONSUMER";
    };
    debit: {
      percentage: string;
      chargedTo: "US" | "CLIENT" | "CONSUMER";
    };
    cash: {
      percentage: string;
      chargedTo: "US" | "CLIENT" | "CONSUMER";
    };
  };
  credentialsCost: string;
  supervisorsCost: string;
  operatorsCost: string;
  mobilityCost: string;
  customOperationalCosts: Array<{
    id: string
    name: string
    amount: number
  }>
}

export function QuotationForm() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  
  // Manejar el estado de la pestaña activa
  const [activeTab, setActiveTab] = useState(() => {
    // Recuperar la pestaña activa de localStorage si existe
    const savedTab = localStorage.getItem('quotationActiveTab')
    return savedTab || "event"
  })

  // Manejar el estado del formulario con valores guardados o iniciales
  const [formData, setFormData] = useState<FormData>(() => {
    try {
      // Intentar recuperar datos guardados de localStorage
      const savedData = localStorage.getItem('quotationFormData')
      if (savedData) {
        return JSON.parse(savedData)
      }
    } catch (error) {
      console.error('Error loading saved form data:', error)
    }
    
    // Si no hay datos guardados, usar valores iniciales vacíos
    return {
      eventType: "",
      totalAmount: "",
      ticketPrice: "",
      platform: {
        name: "TICKET_PLUS",
        percentage: ""
      },
      serviceCharge: "",
      additionalServicesPercentage: "",
      paymentMethods: {
        credit: {
          percentage: "",
          chargedTo: "CONSUMER"
        },
        debit: {
          percentage: "",
          chargedTo: "CONSUMER"
        },
        cash: {
          percentage: "",
          chargedTo: "CONSUMER"
        }
      },
      credentialsCost: "",
      supervisorsCost: "",
      operatorsCost: "",
      mobilityCost: "",
      customOperationalCosts: []
    }
  })

  const [results, setResults] = useState<QuotationResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [quotationName, setQuotationName] = useState("")

  // Guardar la pestaña activa en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('quotationActiveTab', activeTab)
  }, [activeTab])

  // Guardar datos del formulario en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('quotationFormData', JSON.stringify(formData))
  }, [formData])

  // Cargar parámetros globales solo si no hay datos guardados
  useEffect(() => {
    const fetchGlobalParameters = async () => {
      try {
        // Solo cargar parámetros si no hay datos guardados en localStorage
        if (!localStorage.getItem('quotationFormData')) {
          const response = await fetch("/api/admin/parameters")
          if (!response.ok) {
            throw new Error("Failed to fetch global parameters")
          }
          const data = await response.json()
          
          setFormData((prevData) => ({
            ...prevData,
            platform: {
              name: "TICKET_PLUS",
              percentage: data.defaultPlatformFee.toString()
            },
            serviceCharge: data.defaultTicketingFee.toString(),
            additionalServicesPercentage: data.defaultAdditionalServicesFee.toString(),
            paymentMethods: {
              credit: {
                percentage: data.defaultCreditCardFee.toString(),
                chargedTo: "CONSUMER"
              },
              debit: {
                percentage: data.defaultDebitCardFee.toString(),
                chargedTo: "CONSUMER"
              },
              cash: {
                percentage: data.defaultCashFee.toString(),
                chargedTo: "CONSUMER"
              }
            },
            credentialsCost: data.defaultCredentialsCost.toString(),
            supervisorsCost: data.defaultSupervisorsCost.toString(),
            operatorsCost: data.defaultOperatorsCost.toString(),
            mobilityCost: data.defaultMobilityCost.toString(),
          }))
        }
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

  // Función mejorada para limpiar datos
  const clearFormData = () => {
    localStorage.removeItem('quotationFormData')
    localStorage.removeItem('quotationActiveTab')
    setActiveTab("event")
    setFormData({
      eventType: "",
      totalAmount: "",
      ticketPrice: "",
      platform: {
        name: "TICKET_PLUS",
        percentage: ""
      },
      serviceCharge: "",
      additionalServicesPercentage: "",
      paymentMethods: {
        credit: {
          percentage: "",
          chargedTo: "CONSUMER"
        },
        debit: {
          percentage: "",
          chargedTo: "CONSUMER"
        },
        cash: {
          percentage: "",
          chargedTo: "CONSUMER"
        }
      },
      credentialsCost: "",
      supervisorsCost: "",
      operatorsCost: "",
      mobilityCost: "",
      customOperationalCosts: []
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const [parent, child] = name.split('.')
    
    setFormData((prev) => {
      if (!child) {
        return { ...prev, [name]: value }
      }

      if (parent === 'platform') {
        return {
          ...prev,
          platform: {
            ...prev.platform,
            [child]: value
          }
        }
      }

      if (parent === 'paymentMethods') {
        const [method, field] = child.split('.')
        
        // Para campos de porcentaje, aseguramos que se manejen correctamente los valores numéricos
        if (field === 'percentage') {
          // Permitir valores vacíos o numéricos
          const validValue = value === '' ? '' : value;
          
          return {
            ...prev,
            paymentMethods: {
              ...prev.paymentMethods,
              [method]: {
                ...prev.paymentMethods[method as keyof typeof prev.paymentMethods],
                [field]: validValue
              }
            }
          }
        }
        
        return {
          ...prev,
          paymentMethods: {
            ...prev.paymentMethods,
            [method]: {
              ...prev.paymentMethods[method as keyof typeof prev.paymentMethods],
              [field]: value
            }
          }
        }
      }

      return prev
    })
  }

  const handlePlatformChange = (value: "TICKET_PLUS" | "PALCO4") => {
    setFormData((prev) => ({
      ...prev,
      platform: {
        ...prev.platform,
        name: value
      }
    }))
  }

  const handlePaymentMethodChargeToChange = (
    method: "credit" | "debit" | "cash",
    value: "US" | "CLIENT" | "CONSUMER"
  ) => {
    // Cuando cambia quién absorbe el costo, nos aseguramos que los campos de entrada funcionen correctamente
    setFormData((prev) => {
      // Si el porcentaje está vacío y se selecciona algún valor, colocamos un valor predeterminado
      // para los métodos comunes
      let percentage = prev.paymentMethods[method].percentage;
      
      // Si el porcentaje estaba vacío y ahora seleccionamos un valor, sugerimos
      // valores predeterminados según el método de pago
      if (percentage === '' && value) {
        if (method === 'credit') percentage = '3.67';
        else if (method === 'debit') percentage = '0.8';
        else if (method === 'cash') percentage = '0.5';
      }
      
      return {
        ...prev,
        paymentMethods: {
          ...prev.paymentMethods,
          [method]: {
            ...prev.paymentMethods[method],
            chargedTo: value,
            percentage
          }
        }
      }
    });
  }

  const handleCustomOperationalCostsChange = (costs: Array<{ id: string, name: string, amount: number }>) => {
    setFormData(prev => ({
      ...prev,
      customOperationalCosts: costs
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Función auxiliar para convertir strings vacíos o inválidos a 0
      const safeNumber = (value: string): number => {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      };

      const data = {
        eventType: formData.eventType,
        totalAmount: safeNumber(formData.totalAmount),
        ticketPrice: safeNumber(formData.ticketPrice),
        platform: {
          name: formData.platform.name,
          percentage: safeNumber(formData.platform.percentage)
        },
        serviceCharge: safeNumber(formData.serviceCharge),
        additionalServicesPercentage: safeNumber(formData.additionalServicesPercentage),
        paymentMethods: {
          credit: {
            percentage: safeNumber(formData.paymentMethods.credit.percentage),
            chargedTo: formData.paymentMethods.credit.chargedTo
          },
          debit: {
            percentage: safeNumber(formData.paymentMethods.debit.percentage),
            chargedTo: formData.paymentMethods.debit.chargedTo
          },
          cash: {
            percentage: safeNumber(formData.paymentMethods.cash.percentage),
            chargedTo: formData.paymentMethods.cash.chargedTo
          }
        },
        credentialsCost: safeNumber(formData.credentialsCost),
        supervisorsCost: safeNumber(formData.supervisorsCost),
        operatorsCost: safeNumber(formData.operatorsCost),
        mobilityCost: safeNumber(formData.mobilityCost),
        customOperationalCosts: formData.customOperationalCosts.map(cost => ({
          id: cost.id,
          name: cost.name,
          amount: safeNumber(cost.amount)
        })),
      }

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
        throw new Error(errorData.error || "Failed to save quotation")
      }

      toast({
        title: "Success",
        description: "Quotation saved successfully",
      })
      
      // Limpiar datos después de guardar exitosamente
      clearFormData()
      
      // Redirect to dashboard
      router.push('/dashboard')
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
    // Validar que los números sean válidos
    const isValidNumber = (value: string) => {
      const num = Number(value)
      return !isNaN(num) && num >= 0
    }

    // Campos obligatorios básicos
    const requiredFieldsValid = 
      formData.eventType &&
      isValidNumber(formData.totalAmount) &&
      isValidNumber(formData.ticketPrice) &&
      formData.platform.name &&
      isValidNumber(formData.platform.percentage) &&
      isValidNumber(formData.serviceCharge)

    // Validar medios de pago
    const validatePaymentMethod = (method: { percentage: string, chargedTo: string }) => {
      // Si hay porcentaje, debe ser válido y tener quién lo absorbe
      if (method.percentage && method.percentage !== "") {
        return isValidNumber(method.percentage) && method.chargedTo !== ""
      }
      // Si no hay porcentaje, es válido (no se está usando este método)
      return true
    }

    // Verificar si al menos un medio de pago está configurado completamente
    const isPaymentMethodConfigured = (method: { percentage: string, chargedTo: string }) => {
      return method.percentage !== "" && method.chargedTo !== "" && isValidNumber(method.percentage)
    }

    const hasAtLeastOnePaymentMethod = 
      isPaymentMethodConfigured(formData.paymentMethods.credit) ||
      isPaymentMethodConfigured(formData.paymentMethods.debit) ||
      isPaymentMethodConfigured(formData.paymentMethods.cash)

    // Validar que todos los medios de pago configurados sean válidos
    const paymentMethodsValid = 
      validatePaymentMethod(formData.paymentMethods.credit) &&
      validatePaymentMethod(formData.paymentMethods.debit) &&
      validatePaymentMethod(formData.paymentMethods.cash)

    // Validar costos operativos
    const validateOptionalNumber = (value: string) => {
      return !value || value === "" || isValidNumber(value)
    }

    const operationalCostsValid = 
      validateOptionalNumber(formData.credentialsCost) &&
      validateOptionalNumber(formData.supervisorsCost) &&
      validateOptionalNumber(formData.operatorsCost) &&
      validateOptionalNumber(formData.mobilityCost)

    // Validar servicios adicionales
    const additionalServicesValid = validateOptionalNumber(formData.additionalServicesPercentage)

    console.log('Form Data:', formData)
    console.log('Validation Results:', {
      requiredFieldsValid,
      paymentMethodsValid,
      hasAtLeastOnePaymentMethod,
      operationalCostsValid,
      additionalServicesValid,
      paymentMethods: {
        credit: isPaymentMethodConfigured(formData.paymentMethods.credit),
        debit: isPaymentMethodConfigured(formData.paymentMethods.debit),
        cash: isPaymentMethodConfigured(formData.paymentMethods.cash)
      }
    })

    return (
      requiredFieldsValid &&
      paymentMethodsValid &&
      hasAtLeastOnePaymentMethod &&
      operationalCostsValid &&
      additionalServicesValid
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
              <TabsTrigger value="platform" className="flex items-center space-x-2">
                <Percent className="h-4 w-4" />
                <span>Plataforma y Servicios</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Medios de Pago</span>
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
                  <Select value={formData.eventType} onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value }))}>
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
                    label="Cantidad de Tickets"
                    tooltip="Cantidad total de tickets a vender"
                    required
                  />
                  <Input
                    id="totalAmount"
                    name="totalAmount"
                    type="number"
                    value={formData.totalAmount}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ej: 1000"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="ticketPrice"
                    label="Precio por Ticket"
                    tooltip="Precio de venta por ticket"
                    required
                  />
                  <Input
                    id="ticketPrice"
                    name="ticketPrice"
                    type="number"
                    value={formData.ticketPrice}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ej: 50000"
                    required
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="platform" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="platform.name"
                    label="Plataforma de Ticketing"
                    tooltip="Selecciona la plataforma que se utilizará"
                    required
                  />
                  <Select 
                    value={formData.platform.name} 
                    onValueChange={handlePlatformChange}
                  >
                    <SelectTrigger id="platform.name" className="w-full">
                      <SelectValue placeholder="Seleccionar plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TICKET_PLUS">Ticket Plus</SelectItem>
                      <SelectItem value="PALCO4">Palco 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="platform.percentage"
                    label="Comisión de Plataforma (%)"
                    tooltip="Porcentaje que cobra la plataforma por ticket (costo)"
                    required
                  />
                  <Input
                    id="platform.percentage"
                    name="platform.percentage"
                    type="number"
                    value={formData.platform.percentage}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ej: 0.16"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="serviceCharge"
                    label="Cargo por Servicio (%)"
                    tooltip="Porcentaje que cobramos como cargo por servicio (ingreso)"
                    required
                  />
                  <Input
                    id="serviceCharge"
                    name="serviceCharge"
                    type="number"
                    value={formData.serviceCharge}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ej: 5"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <TooltipLabel
                    htmlFor="additionalServicesPercentage"
                    label="Servicios Adicionales (%)"
                    tooltip="Porcentaje por servicios adicionales (ingreso)"
                    required={false}
                  />
                  <Input
                    id="additionalServicesPercentage"
                    name="additionalServicesPercentage"
                    type="number"
                    value={formData.additionalServicesPercentage}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Ej: 2"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <div className="space-y-6">
                {/* Tarjeta de Crédito */}
                <div className="border p-4 rounded-lg">
                  <TooltipLabel
                    htmlFor="paymentMethods.credit.percentage"
                    label="Tarjeta de Crédito"
                    tooltip="Configuración para pagos con tarjeta de crédito"
                    required={false}
                  />
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="paymentMethods.credit.chargedTo">¿Quién absorbe?</Label>
                      <Select
                        value={formData.paymentMethods.credit.chargedTo}
                        onValueChange={(value: "US" | "CLIENT" | "CONSUMER") => {
                          handlePaymentMethodChargeToChange("credit", value)
                        }}
                      >
                        <SelectTrigger id="paymentMethods.credit.chargedTo">
                          <SelectValue placeholder="Seleccionar">
                            {formData.paymentMethods.credit.chargedTo === "US" ? "Nosotros" : 
                             formData.paymentMethods.credit.chargedTo === "CLIENT" ? "Cliente" : 
                             formData.paymentMethods.credit.chargedTo === "CONSUMER" ? "Consumidor" : "Seleccionar"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">Nosotros</SelectItem>
                          <SelectItem value="CLIENT">Cliente</SelectItem>
                          <SelectItem value="CONSUMER">Consumidor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paymentMethods.credit.percentage">Comisión (%)</Label>
                      <Input
                        id="paymentMethods.credit.percentage"
                        name="paymentMethods.credit.percentage"
                        type="number"
                        value={formData.paymentMethods.credit.percentage}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            paymentMethods: {
                              ...prev.paymentMethods,
                              credit: {
                                ...prev.paymentMethods.credit,
                                percentage: value
                              }
                            }
                          }));
                        }}
                        className="w-full"
                        placeholder="Ej: 3.67"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Tarjeta de Débito */}
                <div className="border p-4 rounded-lg">
                  <TooltipLabel
                    htmlFor="paymentMethods.debit.percentage"
                    label="Tarjeta de Débito"
                    tooltip="Configuración para pagos con tarjeta de débito"
                    required={false}
                  />
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="paymentMethods.debit.chargedTo">¿Quién absorbe?</Label>
                      <Select
                        value={formData.paymentMethods.debit.chargedTo}
                        onValueChange={(value: "US" | "CLIENT" | "CONSUMER") => {
                          handlePaymentMethodChargeToChange("debit", value)
                        }}
                      >
                        <SelectTrigger id="paymentMethods.debit.chargedTo">
                          <SelectValue placeholder="Seleccionar">
                            {formData.paymentMethods.debit.chargedTo === "US" ? "Nosotros" : 
                             formData.paymentMethods.debit.chargedTo === "CLIENT" ? "Cliente" : 
                             formData.paymentMethods.debit.chargedTo === "CONSUMER" ? "Consumidor" : "Seleccionar"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">Nosotros</SelectItem>
                          <SelectItem value="CLIENT">Cliente</SelectItem>
                          <SelectItem value="CONSUMER">Consumidor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paymentMethods.debit.percentage">Comisión (%)</Label>
                      <Input
                        id="paymentMethods.debit.percentage"
                        name="paymentMethods.debit.percentage"
                        type="number"
                        value={formData.paymentMethods.debit.percentage}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            paymentMethods: {
                              ...prev.paymentMethods,
                              debit: {
                                ...prev.paymentMethods.debit,
                                percentage: value
                              }
                            }
                          }));
                        }}
                        className="w-full"
                        placeholder="Ej: 0.8"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Efectivo */}
                <div className="border p-4 rounded-lg">
                  <TooltipLabel
                    htmlFor="paymentMethods.cash.percentage"
                    label="Efectivo"
                    tooltip="Configuración para pagos en efectivo"
                    required={false}
                  />
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="paymentMethods.cash.chargedTo">¿Quién absorbe?</Label>
                      <Select
                        value={formData.paymentMethods.cash.chargedTo}
                        onValueChange={(value: "US" | "CLIENT" | "CONSUMER") => {
                          handlePaymentMethodChargeToChange("cash", value)
                        }}
                      >
                        <SelectTrigger id="paymentMethods.cash.chargedTo">
                          <SelectValue placeholder="Seleccionar">
                            {formData.paymentMethods.cash.chargedTo === "US" ? "Nosotros" : 
                             formData.paymentMethods.cash.chargedTo === "CLIENT" ? "Cliente" : 
                             formData.paymentMethods.cash.chargedTo === "CONSUMER" ? "Consumidor" : "Seleccionar"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">Nosotros</SelectItem>
                          <SelectItem value="CLIENT">Cliente</SelectItem>
                          <SelectItem value="CONSUMER">Consumidor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paymentMethods.cash.percentage">Comisión (%)</Label>
                      <Input
                        id="paymentMethods.cash.percentage"
                        name="paymentMethods.cash.percentage"
                        type="number"
                        value={formData.paymentMethods.cash.percentage}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            paymentMethods: {
                              ...prev.paymentMethods,
                              cash: {
                                ...prev.paymentMethods.cash,
                                percentage: value
                              }
                            }
                          }));
                        }}
                        className="w-full"
                        placeholder="Ej: 0.5"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="operational" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Costos Operativos</h3>
                
                {/* Costos operativos fijos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <TooltipLabel
                      htmlFor="credentialsCost"
                      label="Costo de Credenciales"
                      tooltip="Costo total de las credenciales para el evento"
                    />
                    <Input
                      id="credentialsCost"
                      type="number"
                      value={formData.credentialsCost}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <TooltipLabel
                      htmlFor="supervisorsCost"
                      label="Costo de Supervisores"
                      tooltip="El costo total para supervisores y personal de gestión."
                      required={false}
                    />
                    <Input
                      id="supervisorsCost"
                      name="supervisorsCost"
                      type="number"
                      value={formData.supervisorsCost}
                      onChange={handleInputChange}
                      className="w-full"
                      placeholder="Ingrese el costo"
                    />
                  </div>
                  <div>
                    <TooltipLabel
                      htmlFor="operatorsCost"
                      label="Costo de Operadores"
                      tooltip="El costo total para operadores y personal en sitio."
                      required={false}
                    />
                    <Input
                      id="operatorsCost"
                      name="operatorsCost"
                      type="number"
                      value={formData.operatorsCost}
                      onChange={handleInputChange}
                      className="w-full"
                      placeholder="Ingrese el costo"
                    />
                  </div>
                  <div>
                    <TooltipLabel
                      htmlFor="mobilityCost"
                      label="Costo de Movilidad"
                      tooltip="El costo total para transporte y logística."
                      required={false}
                    />
                    <Input
                      id="mobilityCost"
                      name="mobilityCost"
                      type="number"
                      value={formData.mobilityCost}
                      onChange={handleInputChange}
                      className="w-full"
                      placeholder="Ingrese el costo"
                    />
                  </div>
                </div>

                {/* Costos operativos personalizados */}
                <CustomOperationalCosts
                  value={formData.customOperationalCosts}
                  onChange={handleCustomOperationalCostsChange}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex justify-between items-center">
            <div className="flex space-x-4">
              {activeTab !== "event" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const tabs = ["event", "platform", "payments", "operational"]
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
                    const tabs = ["event", "platform", "payments", "operational"]
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

