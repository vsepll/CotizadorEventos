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
import { TicketSectorForm } from "@/components/ticket-sector-form"
import { DatePicker } from "@/components/ui/date-picker"

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
  employees: Array<{
    employeeTypeId: string;
    quantity: string;
    days: string;
  }>;
  mobilityKilometers: string;
  numberOfTolls: string;
  tollsCost: string;
  customOperationalCosts: Array<{
    id: string;
    name: string;
    amount: number;
  }>;
  ticketSectors: Array<{
    name: string;
    variations: Array<{
      name: string;
      price: number;
      quantity: number;
      serviceCharge: number;
      serviceChargeType: "fixed" | "percentage";
    }>;
  }>;
  estimatedPaymentDate: string | null;
  paymentStatus: "PENDING" | "PAID";
}

interface EmployeeType {
  id: string;
  name: string;
  isOperator: boolean;
  costPerDay: number;
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
      const savedData = localStorage.getItem('quotationFormData')
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        return {
          ...parsedData,
          platform: {
            name: parsedData.platform?.name || "TICKET_PLUS",
            percentage: parsedData.platform?.percentage || ""
          },
          paymentMethods: {
            credit: {
              percentage: parsedData.paymentMethods?.credit?.percentage || "",
              chargedTo: parsedData.paymentMethods?.credit?.chargedTo || "CONSUMER"
            },
            debit: {
              percentage: parsedData.paymentMethods?.debit?.percentage || "",
              chargedTo: parsedData.paymentMethods?.debit?.chargedTo || "CONSUMER"
            },
            cash: {
              percentage: parsedData.paymentMethods?.cash?.percentage || "",
              chargedTo: parsedData.paymentMethods?.cash?.chargedTo || "CONSUMER"
            }
          },
          employees: parsedData.employees || [],
          mobilityKilometers: parsedData.mobilityKilometers || "",
          numberOfTolls: parsedData.numberOfTolls || "",
          tollsCost: parsedData.tollsCost || "",
          ticketSectors: parsedData.ticketSectors || [],
          estimatedPaymentDate: parsedData.estimatedPaymentDate || null,
          paymentStatus: parsedData.paymentStatus || "PENDING"
        }
      }
    } catch (error) {
      console.error('Error loading saved form data:', error)
    }
    
    return {
      eventType: "",
      totalAmount: "",
      ticketPrice: "",
      platform: {
        name: "TICKET_PLUS",
        percentage: ""
      },
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
      employees: [],
      mobilityKilometers: "",
      numberOfTolls: "",
      tollsCost: "",
      customOperationalCosts: [],
      ticketSectors: [],
      estimatedPaymentDate: null,
      paymentStatus: "PENDING"
    }
  })

  const [results, setResults] = useState<QuotationResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [quotationName, setQuotationName] = useState("")
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([])
  const [ticketSectors, setTicketSectors] = useState([])

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
        const response = await fetch('/api/global-parameters');
        if (!response.ok) {
          throw new Error('Failed to fetch global parameters');
        }
        const data = await response.json();
        
        // Aplicamos valores por defecto solo si formData está en estado "vacío"
        if (!formData.eventType && !formData.platform.percentage) {
          console.log('Applying default global parameters:', data);
          
          // Solo establecemos los parámetros si el formulario está "vacío"
          setFormData(prevState => ({
            ...prevState,
            platform: {
              ...prevState.platform,
              percentage: data.defaultPlatformFee.toString()
            },
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
            // Si hay un sector de tickets, actualizamos sus valores por defecto de serviceCharge
            ticketSectors: prevState.ticketSectors.length > 0 ? 
              prevState.ticketSectors.map(sector => ({
                ...sector,
                variations: sector.variations.map(variation => ({
                  ...variation,
                  serviceCharge: variation.serviceCharge || data.defaultTicketingFee,
                  serviceChargeType: variation.serviceChargeType || "percentage"
                }))
              })) : 
              prevState.ticketSectors
          }));
        }
      } catch (error) {
        console.error('Error fetching global parameters:', error);
      }
    };
    
    fetchGlobalParameters()
  }, [toast])

  // Agregar el efecto para cargar los tipos de empleados
  useEffect(() => {
    const fetchEmployeeTypes = async () => {
      try {
        const response = await fetch("/api/employee-types");
        if (!response.ok) {
          throw new Error("Failed to fetch employee types");
        }
        const data = await response.json();
        console.log("Tipos de empleados cargados:", data);
        setEmployeeTypes(data);
      } catch (error) {
        console.error("Error fetching employee types:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los tipos de personal. Por favor, intente de nuevo.",
          variant: "destructive",
        });
      }
    };

    fetchEmployeeTypes();
  }, [toast]);

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
      employees: [],
      mobilityKilometers: "",
      numberOfTolls: "",
      tollsCost: "",
      customOperationalCosts: [],
      ticketSectors: [],
      estimatedPaymentDate: null,
      paymentStatus: "PENDING"
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

  const handleTicketSectorsChange = (newTicketSectors: Array<{
    name: string;
    variations: Array<{
      name: string;
      price: number;
      quantity: number;
      serviceCharge: number;
      serviceChargeType: "fixed" | "percentage";
    }>;
  }>) => {
    setFormData(prev => ({
      ...prev,
      ticketSectors: newTicketSectors
    }))
  }

  // Añadir una función para adaptar los resultados al formato esperado por QuotationResults
  const adaptResults = (apiResults: any) => {
    // Primero, hacemos una copia profunda para evitar modificar el original
    const result = JSON.parse(JSON.stringify(apiResults));
    
    // Nos aseguramos de que la estructura de operationalCosts sea correcta
    if (result.operationalCosts) {
      // Si no existe employees pero existen supervisors/operators, calculamos employees
      if (result.operationalCosts.supervisors !== undefined && 
          result.operationalCosts.operators !== undefined && 
          result.operationalCosts.employees === undefined) {
        result.operationalCosts.employees = 
          result.operationalCosts.supervisors + result.operationalCosts.operators;
      } 
      // Si existe employees pero no existen supervisors/operators, los calculamos
      else if (result.operationalCosts.employees !== undefined && 
               (result.operationalCosts.supervisors === undefined || 
                result.operationalCosts.operators === undefined)) {
        result.operationalCosts.supervisors = result.operationalCosts.employees / 2;
        result.operationalCosts.operators = result.operationalCosts.employees / 2;
      }
      // Si no existe ninguno, los inicializamos a 0
      else if (result.operationalCosts.employees === undefined) {
        result.operationalCosts.employees = 0;
        result.operationalCosts.supervisors = 0;
        result.operationalCosts.operators = 0;
      }
    }
    
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Calcular el totalAmount basado en los sectores de tickets
      const totalAmount = formData.ticketSectors.reduce((total, sector) => {
        return total + sector.variations.reduce((sectorTotal, variation) => {
          return sectorTotal + (variation.price * variation.quantity)
        }, 0)
      }, 0)

      // Calcular el ticketPrice promedio
      const totalTickets = formData.ticketSectors.reduce((total, sector) => {
        return total + sector.variations.reduce((sectorTotal, variation) => {
          return sectorTotal + variation.quantity
        }, 0)
      }, 0)

      const averageTicketPrice = totalTickets > 0 ? totalAmount / totalTickets : 0

      const quotationData = {
        ...formData,
        totalAmount: Number(totalAmount),
        ticketPrice: Number(averageTicketPrice),
        // Asegurarse de que todos los valores numéricos sean números
        platform: {
          ...formData.platform,
          percentage: Number(formData.platform.percentage)
        },
        additionalServicesPercentage: Number(formData.additionalServicesPercentage),
        paymentMethods: {
          credit: {
            ...formData.paymentMethods.credit,
            percentage: Number(formData.paymentMethods.credit.percentage)
          },
          debit: {
            ...formData.paymentMethods.debit,
            percentage: Number(formData.paymentMethods.debit.percentage)
          },
          cash: {
            ...formData.paymentMethods.cash,
            percentage: Number(formData.paymentMethods.cash.percentage)
          }
        },
        credentialsCost: Number(formData.credentialsCost),
        employees: formData.employees.map(emp => ({
          ...emp,
          quantity: Number(emp.quantity),
          days: Number(emp.days)
        })),
        mobilityKilometers: Number(formData.mobilityKilometers),
        numberOfTolls: Number(formData.numberOfTolls),
        tollsCost: Number(formData.tollsCost),
        customOperationalCosts: formData.customOperationalCosts.map(cost => ({
          ...cost,
          amount: Number(cost.amount)
        }))
      }

      console.log('Sending quotation data for calculation:', quotationData)

      // Primero calculamos la cotización en lugar de guardarla directamente
      const response = await fetch("/api/calculate-quotation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quotationData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error calculando cotización")
      }

      // Obtener los resultados calculados
      const responseData = await response.json()
      console.log('Resultados recibidos de la API para visualizar:', responseData)
      setResults(responseData)
      
      toast({
        title: "Éxito",
        description: "Cotización calculada correctamente",
      })
      
      // Actualizar formData con los valores calculados
      setFormData(prev => ({
        ...prev,
        totalAmount: String(totalAmount),
        ticketPrice: String(averageTicketPrice),
      }))
    } catch (error) {
      console.error("Error calculating quotation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al calcular la cotización",
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
      // Calculate total ticket quantity from sectors
      const totalTicketsQuantity = formData.ticketSectors.reduce((total, sector) => {
        return total + sector.variations.reduce((sectorTotal, variation) => {
          return sectorTotal + variation.quantity;
        }, 0);
      }, 0);

      // Prepare form data for submission - convert string values to numbers as needed
      const formDataForSubmission = {
        // Include form input data
        eventType: formData.eventType,
        totalAmount: Number(formData.totalAmount), // This is the total monetary value
        ticketPrice: Number(formData.ticketPrice),
        platform: {
          name: formData.platform.name,
          percentage: Number(formData.platform.percentage)
        },
        additionalServicesPercentage: Number(formData.additionalServicesPercentage) || 0,
        paymentMethods: {
          credit: {
            percentage: Number(formData.paymentMethods.credit.percentage) || 0,
            chargedTo: formData.paymentMethods.credit.chargedTo || "CONSUMER"
          },
          debit: {
            percentage: Number(formData.paymentMethods.debit.percentage) || 0,
            chargedTo: formData.paymentMethods.debit.chargedTo || "CONSUMER"
          },
          cash: {
            percentage: Number(formData.paymentMethods.cash.percentage) || 0,
            chargedTo: formData.paymentMethods.cash.chargedTo || "CONSUMER"
          }
        },
        credentialsCost: Number(formData.credentialsCost) || 0,
        employees: formData.employees.map(emp => ({
          employeeTypeId: emp.employeeTypeId,
          quantity: Number(emp.quantity),
          days: Number(emp.days)
        })),
        mobilityKilometers: Number(formData.mobilityKilometers) || 0,
        numberOfTolls: Number(formData.numberOfTolls) || 0,
        tollsCost: Number(formData.tollsCost) || 0,
        customOperationalCosts: formData.customOperationalCosts.map(cost => ({
          id: cost.id,
          name: cost.name,
          amount: Number(cost.amount)
        })),
        ticketSectors: formData.ticketSectors.map(sector => ({
          name: sector.name,
          variations: sector.variations.map(variation => ({
            name: variation.name,
            price: Number(variation.price),
            quantity: Number(variation.quantity),
            serviceCharge: Number(variation.serviceCharge),
            serviceChargeType: variation.serviceChargeType
          }))
        })),
        // Nuevos campos
        estimatedPaymentDate: formData.estimatedPaymentDate, 
        paymentStatus: formData.paymentStatus,
        // Include the calculation results
        ...results,
        // Calculate ticket quantity from sectors
        ticketQuantity: totalTicketsQuantity,
        // Override with the user-provided name
        name: quotationName,
      };

      console.log('Sending complete quotation data:', formDataForSubmission);

      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formDataForSubmission),
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

    // Validar que haya al menos un sector de tickets con variaciones válidas
    const hasValidTicketSectors = () => {
      if (!formData.ticketSectors || formData.ticketSectors.length === 0) {
        return false;
      }

      return formData.ticketSectors.some(sector => {
        // Verificar que el sector tenga un nombre
        if (!sector.name.trim()) return false;
        
        // Verificar que tenga variaciones
        if (!sector.variations || sector.variations.length === 0) return false;
        
        // Verificar que al menos una variación tenga nombre, precio y cantidad
        return sector.variations.some(variation => 
          variation.name.trim() && variation.price > 0 && variation.quantity > 0
        );
      });
    };

    // Campos obligatorios básicos
    const requiredFieldsValid = 
      formData.eventType &&
      hasValidTicketSectors() &&
      formData.platform.name &&
      isValidNumber(formData.platform.percentage) &&
      isValidNumber(formData.additionalServicesPercentage)

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
      validateOptionalNumber(formData.tollsCost)

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
            <TabsList className="grid grid-cols-5 gap-4 p-1">
              <TabsTrigger value="event" className="flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span>Evento</span>
              </TabsTrigger>
              <TabsTrigger value="tickets" className="flex items-center space-x-2">
                <Percent className="h-4 w-4" />
                <span>Tickets</span>
              </TabsTrigger>
              <TabsTrigger value="platform" className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
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
              <div className="grid grid-cols-1 gap-6">
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
              </div>
            </TabsContent>

            <TabsContent value="tickets">
              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Tickets</CardTitle>
                  <CardDescription>
                    Configura los diferentes tipos y precios de tickets para tu evento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TicketSectorForm 
                    initialSectors={formData.ticketSectors}
                    onChange={handleTicketSectorsChange}
                  />
                </CardContent>
              </Card>
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
                
                {/* Empleados */}
                <div className="space-y-4">
                  <h4 className="font-medium">Personal</h4>
                  
                  {/* Mostrar mensaje si no hay tipos de personal disponibles */}
                  {employeeTypes.length === 0 && (
                    <div className="text-yellow-600 p-2 bg-yellow-50 rounded mb-4">
                      No hay tipos de personal configurados. Por favor, agregue tipos de personal en la configuración.
                    </div>
                  )}
                  
                  {formData.employees.map((employee, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                      <div>
                        <Label>Tipo de Personal</Label>
                        <Select
                          value={employee.employeeTypeId}
                          onValueChange={(value) => {
                            const newEmployees = [...formData.employees];
                            newEmployees[index].employeeTypeId = value;
                            setFormData(prev => ({
                              ...prev,
                              employees: newEmployees
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {employeeTypes.length > 0 ? (
                              employeeTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name} (${type.costPerDay}/día)
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-types" disabled>
                                No hay tipos disponibles
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          value={employee.quantity}
                          onChange={(e) => {
                            const newEmployees = [...formData.employees];
                            newEmployees[index].quantity = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              employees: newEmployees
                            }));
                          }}
                          min="1"
                        />
                      </div>
                      <div>
                        <Label>Días</Label>
                        <Input
                          type="number"
                          value={employee.days}
                          onChange={(e) => {
                            const newEmployees = [...formData.employees];
                            newEmployees[index].days = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              employees: newEmployees
                            }));
                          }}
                          min="1"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        className="col-span-3"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            employees: prev.employees.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      // Se añade type="button" para evitar que se envíe el formulario al hacer clic
                      try {
                        console.log("Clicked Agregar Personal button");
                        
                        // Valor por defecto si no hay tipos de empleado
                        const defaultEmployeeTypeId = "temp-id-123";
                        console.log("Empleados actuales:", formData.employees);
                        
                        // Creamos el nuevo arreglo directamente en lugar de usar setState con callback
                        const newEmployees = [
                          ...formData.employees,
                          {
                            employeeTypeId: defaultEmployeeTypeId,
                            quantity: "1",
                            days: "1"
                          }
                        ];
                        console.log("Nuevos empleados:", newEmployees);
                        
                        // Actualizar el estado con los nuevos empleados
                        setFormData({
                          ...formData,
                          employees: newEmployees
                        });
                      } catch (error) {
                        console.error("Error al agregar personal:", error);
                      }
                    }}
                  >
                    Agregar Personal
                  </Button>
                </div>

                {/* Movilidad */}
                <div className="space-y-4">
                  <h4 className="font-medium">Movilidad</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <TooltipLabel
                        htmlFor="mobilityKilometers"
                        label="Kilómetros (ida y vuelta)"
                        tooltip="Distancia total del recorrido en kilómetros"
                      />
                      <Input
                        id="mobilityKilometers"
                        name="mobilityKilometers"
                        type="number"
                        value={formData.mobilityKilometers}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <TooltipLabel
                        htmlFor="numberOfTolls"
                        label="Cantidad de Peajes"
                        tooltip="Número total de peajes en el recorrido"
                      />
                      <Input
                        id="numberOfTolls"
                        name="numberOfTolls"
                        type="number"
                        value={formData.numberOfTolls}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <TooltipLabel
                        htmlFor="tollsCost"
                        label="Costo por Peaje"
                        tooltip="Costo promedio por peaje"
                      />
                      <Input
                        id="tollsCost"
                        name="tollsCost"
                        type="number"
                        value={formData.tollsCost}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0.00"
                      />
                    </div>
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
                    const tabs = ["event", "tickets", "platform", "payments", "operational"]
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
                    const tabs = ["event", "tickets", "platform", "payments", "operational"]
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
                      placeholder="Ingrese un nombre para la cotización"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="estimatedPaymentDate">Fecha Estimada de Cobro</Label>
                    <DatePicker
                      id="estimatedPaymentDate"
                      date={formData.estimatedPaymentDate ? new Date(formData.estimatedPaymentDate) : undefined}
                      onSelect={(date) => setFormData(prev => ({
                        ...prev,
                        estimatedPaymentDate: date ? date.toISOString() : null
                      }))}
                      placeholder="Seleccione una fecha"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="paymentStatus">Estado de Pago</Label>
                    <Select
                      value={formData.paymentStatus}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        paymentStatus: value as "PENDING" | "PAID"
                      }))}
                    >
                      <SelectTrigger id="paymentStatus">
                        <SelectValue placeholder="Seleccione el estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pendiente</SelectItem>
                        <SelectItem value="PAID">Pagado</SelectItem>
                      </SelectContent>
                    </Select>
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

