"use client"

import type React from "react"
import type { QuotationResults } from "@/lib/calculations"

import { useState, useEffect, useRef } from "react"
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
  DialogClose,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  InfoIcon, 
  Calculator, 
  Save, 
  Building2, 
  CreditCard, 
  Users, 
  Percent, 
  Calendar as CalendarIcon, 
  X, 
  Ticket, 
  CircleDollarSign,
  ArrowRight,
  CheckCircle2,
  FileText,
  Plus
} from "lucide-react"
import { Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CustomOperationalCosts } from "@/components/custom-operational-costs"
import { TicketSectorForm } from "@/components/ticket-sector-form"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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
  // Add a state to control the save modal visibility
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)

  // Guardar la pestaña activa en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('quotationActiveTab', activeTab)
  }, [activeTab])

  // Guardar datos del formulario en localStorage cuando cambian
  // Use a ref to store the previous form data to avoid unnecessary updates
  const prevFormDataRef = useRef<string | null>(null);
  
  useEffect(() => {
    try {
      // Using setTimeout to defer the localStorage update after render
      // This helps avoid blocking the main thread during updates
      const timeoutId = setTimeout(() => {
        const formDataString = JSON.stringify(formData);
        
        // Only update localStorage if the data has actually changed
        if (formDataString !== prevFormDataRef.current) {
          localStorage.setItem('quotationFormData', formDataString);
          prevFormDataRef.current = formDataString;
        }
      }, 300); // Small debounce delay to batch multiple rapid updates

      // Cleanup timeout on unmount or before next effect run
      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error('Error saving form data to localStorage:', error)
    }
  }, [formData]);

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
    // Only update if the sectors have actually changed
    if (JSON.stringify(newTicketSectors) !== JSON.stringify(formData.ticketSectors)) {
      setFormData(prev => ({
        ...prev,
        ticketSectors: newTicketSectors
      }))
    }
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

  // Create a component for the TooltipLabel to simplify usage
  const TooltipLabel = ({ htmlFor, label, tooltip, required = false }: TooltipLabelProps) => (
    <TooltipProvider>
      <div className="flex items-center space-x-1">
        <Label htmlFor={htmlFor} className="flex items-center">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <Tooltip>
          <TooltipTrigger type="button" className="cursor-help">
            <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
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
    <div className="container max-w-screen-xl mx-auto">
      <Card className="mb-4 border-primary/20 bg-background">
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-1.5">
            <CardTitle className="text-2xl font-bold">Nueva Cotización de Evento</CardTitle>
            <CardDescription>
              Complete el formulario para calcular una cotización para su evento
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* Formulario principal */}
      <div className="w-full mb-6">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="w-full mb-6 grid grid-cols-5 h-auto p-1">
            <TabsTrigger 
              value="event" 
              className="flex flex-col items-center py-3 px-2 gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">Evento</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tickets" 
              className="flex flex-col items-center py-3 px-2 gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Ticket className="h-5 w-5" />
              <span className="text-xs">Tickets</span>
            </TabsTrigger>
            <TabsTrigger 
              value="platform" 
              className="flex flex-col items-center py-3 px-2 gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Building2 className="h-5 w-5" />
              <span className="text-xs">Plataforma</span>
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="flex flex-col items-center py-3 px-2 gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <CreditCard className="h-5 w-5" />
              <span className="text-xs">Pagos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="operational" 
              className="flex flex-col items-center py-3 px-2 gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs">Operaciones</span>
            </TabsTrigger>
          </TabsList>

          {/* Event Tab Content */}
          <TabsContent value="event" className="space-y-6 mt-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Información del Evento
                </CardTitle>
                <CardDescription>
                  Ingrese los detalles básicos del evento para su cotización
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <TooltipLabel
                      htmlFor="eventType"
                      label="Tipo de Evento"
                      tooltip="Seleccione el tipo de evento para el que está creando la cotización"
                      required
                    />
                    <Select
                      value={formData.eventType}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        eventType: value
                      }))}
                    >
                      <SelectTrigger id="eventType">
                        <SelectValue placeholder="Seleccione un tipo de evento" />
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab Content */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  Sectores y Precios de Tickets
                </CardTitle>
                <CardDescription>
                  Configure los sectores, precios y cargos por servicio para los tickets de su evento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TicketSectorForm
                  initialSectors={formData.ticketSectors}
                  onChange={(sectors) => {
                    // Use a deep comparison to avoid updating state unnecessarily
                    const currentSectors = JSON.stringify(formData.ticketSectors);
                    const newSectors = JSON.stringify(sectors);
                    
                    if (currentSectors !== newSectors) {
                      setFormData(prev => ({
                        ...prev,
                        ticketSectors: sectors
                      }));
                    }
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Tab Content */}
          <TabsContent value="platform" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Configuración de Plataforma
                </CardTitle>
                <CardDescription>
                  Configure los detalles de la plataforma y los servicios adicionales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <TooltipLabel
                      htmlFor="platform.name"
                      label="Plataforma"
                      tooltip="Seleccione la plataforma que se utilizará para la venta de tickets"
                    />
                    <Select
                      value={formData.platform.name}
                      onValueChange={(value: "TICKET_PLUS" | "PALCO4") => setFormData(prev => ({
                        ...prev,
                        platform: {
                          ...prev.platform,
                          name: value
                        }
                      }))}
                    >
                      <SelectTrigger id="platform.name">
                        <SelectValue placeholder="Seleccione una plataforma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TICKET_PLUS">Ticket Plus</SelectItem>
                        <SelectItem value="PALCO4">Palco 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <TooltipLabel
                      htmlFor="platform.percentage"
                      label="Porcentaje de Comisión"
                      tooltip="El porcentaje que la plataforma cobra por cada ticket vendido"
                    />
                    <div className="relative">
                      <Input
                        id="platform.percentage"
                        name="platform.percentage"
                        type="number"
                        value={formData.platform.percentage}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            platform: {
                              ...prev.platform,
                              percentage: value
                            }
                          }));
                        }}
                        className="pr-8"
                        placeholder="Ej: 5"
                        step="0.01"
                        min="0"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Percent className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="space-y-2">
                    <TooltipLabel
                      htmlFor="additionalServicesPercentage"
                      label="Porcentaje de Servicios Adicionales"
                      tooltip="El porcentaje adicional que se cobra por servicios complementarios"
                    />
                    <div className="relative">
                      <Input
                        id="additionalServicesPercentage"
                        name="additionalServicesPercentage"
                        type="number"
                        value={formData.additionalServicesPercentage}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            additionalServicesPercentage: value
                          }));
                        }}
                        className="pr-8"
                        placeholder="Ej: 0.5"
                        step="0.01"
                        min="0"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Percent className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab Content */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Métodos de Pago
                </CardTitle>
                <CardDescription>
                  Configure las comisiones por cada método de pago y quién asume el costo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tarjeta de Crédito */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Tarjeta de Crédito
                    </h3>
                    <Badge variant="outline" className="bg-primary/10">Más común</Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <TooltipLabel
                        htmlFor="paymentMethods.credit.percentage"
                        label="Comisión (%)"
                        tooltip="Porcentaje de comisión cobrado por el procesador de pagos"
                      />
                      <div className="relative">
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
                          className="pr-8"
                          placeholder="Ej: 3.67"
                          step="0.01"
                          min="0"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <Percent className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <TooltipLabel
                        htmlFor="paymentMethods.credit.chargedTo"
                        label="Cobrado a"
                        tooltip="A quién se le cobra la comisión de la tarjeta de crédito"
                      />
                      <Select
                        value={formData.paymentMethods.credit.chargedTo}
                        onValueChange={(value: "US" | "CLIENT" | "CONSUMER") => setFormData(prev => ({
                          ...prev,
                          paymentMethods: {
                            ...prev.paymentMethods,
                            credit: {
                              ...prev.paymentMethods.credit,
                              chargedTo: value
                            }
                          }
                        }))}
                      >
                        <SelectTrigger id="paymentMethods.credit.chargedTo">
                          <SelectValue placeholder="Seleccione a quién se le cobra" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">Nosotros</SelectItem>
                          <SelectItem value="CLIENT">Cliente</SelectItem>
                          <SelectItem value="CONSUMER">Consumidor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Tarjeta de Débito */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Tarjeta de Débito
                  </h3>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <TooltipLabel
                        htmlFor="paymentMethods.debit.percentage"
                        label="Comisión (%)"
                        tooltip="Porcentaje de comisión cobrado por el procesador de pagos"
                      />
                      <div className="relative">
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
                          className="pr-8"
                          placeholder="Ej: 0.8"
                          step="0.01"
                          min="0"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <Percent className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <TooltipLabel
                        htmlFor="paymentMethods.debit.chargedTo"
                        label="Cobrado a"
                        tooltip="A quién se le cobra la comisión de la tarjeta de débito"
                      />
                      <Select
                        value={formData.paymentMethods.debit.chargedTo}
                        onValueChange={(value: "US" | "CLIENT" | "CONSUMER") => setFormData(prev => ({
                          ...prev,
                          paymentMethods: {
                            ...prev.paymentMethods,
                            debit: {
                              ...prev.paymentMethods.debit,
                              chargedTo: value
                            }
                          }
                        }))}
                      >
                        <SelectTrigger id="paymentMethods.debit.chargedTo">
                          <SelectValue placeholder="Seleccione a quién se le cobra" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">Nosotros</SelectItem>
                          <SelectItem value="CLIENT">Cliente</SelectItem>
                          <SelectItem value="CONSUMER">Consumidor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Efectivo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CircleDollarSign className="h-4 w-4" />
                    Efectivo
                  </h3>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <TooltipLabel
                        htmlFor="paymentMethods.cash.percentage"
                        label="Comisión (%)"
                        tooltip="Porcentaje de comisión por pagos en efectivo"
                      />
                      <div className="relative">
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
                          className="pr-8"
                          placeholder="Ej: 0"
                          step="0.01"
                          min="0"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <Percent className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <TooltipLabel
                        htmlFor="paymentMethods.cash.chargedTo"
                        label="Cobrado a"
                        tooltip="A quién se le cobra la comisión para pagos en efectivo"
                      />
                      <Select
                        value={formData.paymentMethods.cash.chargedTo}
                        onValueChange={(value: "US" | "CLIENT" | "CONSUMER") => setFormData(prev => ({
                          ...prev,
                          paymentMethods: {
                            ...prev.paymentMethods,
                            cash: {
                              ...prev.paymentMethods.cash,
                              chargedTo: value
                            }
                          }
                        }))}
                      >
                        <SelectTrigger id="paymentMethods.cash.chargedTo">
                          <SelectValue placeholder="Seleccione a quién se le cobra" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">Nosotros</SelectItem>
                          <SelectItem value="CLIENT">Cliente</SelectItem>
                          <SelectItem value="CONSUMER">Consumidor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operational Tab Content */}
          <TabsContent value="operational" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Personal y Credenciales
                </CardTitle>
                <CardDescription>
                  Configure el personal necesario para el evento y los costos de credenciales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <TooltipLabel
                        htmlFor="credentialsCost"
                        label="Costo de Credenciales"
                        tooltip="Costo total de las credenciales para el personal del evento"
                      />
                      <div className="relative">
                        <Input
                          id="credentialsCost"
                          name="credentialsCost"
                          type="number"
                          value={formData.credentialsCost}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              credentialsCost: value
                            }));
                          }}
                          className="pl-8"
                          placeholder="Ej: 10000"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500 text-sm">$</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Personal
                    </h3>
                    <Separator />
                    
                    {employeeTypes.length > 0 ? (
                      <div className="space-y-6">
                        {formData.employees.map((employee, index) => (
                          <div key={index} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{employeeTypes.find(et => et.id === employee.employeeTypeId)?.name || 'Empleado'}</h4>
                              {formData.employees.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const updatedEmployees = formData.employees.filter((_, i) => i !== index);
                                    setFormData(prev => ({
                                      ...prev,
                                      employees: updatedEmployees
                                    }));
                                  }}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <X className="h-4 w-4" />
                                  <span className="sr-only">Eliminar empleado</span>
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`employee-type-${index}`}>Tipo de Empleado</Label>
                                <Select
                                  value={employee.employeeTypeId}
                                  onValueChange={(value) => {
                                    const updatedEmployees = [...formData.employees];
                                    updatedEmployees[index].employeeTypeId = value;
                                    setFormData(prev => ({
                                      ...prev,
                                      employees: updatedEmployees
                                    }));
                                  }}
                                >
                                  <SelectTrigger id={`employee-type-${index}`}>
                                    <SelectValue placeholder="Seleccione un tipo de empleado" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {employeeTypes.map((type) => (
                                      <SelectItem key={type.id} value={type.id}>
                                        {type.name} (${type.costPerDay}/día)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor={`employee-quantity-${index}`}>Cantidad</Label>
                                <Input
                                  id={`employee-quantity-${index}`}
                                  type="number"
                                  value={employee.quantity}
                                  onChange={(e) => {
                                    const updatedEmployees = [...formData.employees];
                                    updatedEmployees[index].quantity = e.target.value;
                                    setFormData(prev => ({
                                      ...prev,
                                      employees: updatedEmployees
                                    }));
                                  }}
                                  placeholder="Ej: 5"
                                  min="1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`employee-days-${index}`}>Días</Label>
                                <Input
                                  id={`employee-days-${index}`}
                                  type="number"
                                  value={employee.days}
                                  onChange={(e) => {
                                    const updatedEmployees = [...formData.employees];
                                    updatedEmployees[index].days = e.target.value;
                                    setFormData(prev => ({
                                      ...prev,
                                      employees: updatedEmployees
                                    }));
                                  }}
                                  placeholder="Ej: 2"
                                  min="1"
                                />
                              </div>
                              <div className="flex items-end">
                                <div className="w-full px-4 py-2 bg-muted rounded flex justify-between items-center">
                                  <span className="text-sm">Costo Total:</span>
                                  <span className="font-medium">
                                    ${(
                                      Number(employee.quantity) * 
                                      Number(employee.days) * 
                                      (employeeTypes.find(et => et.id === employee.employeeTypeId)?.costPerDay || 0)
                                    ).toLocaleString('es-AR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              employees: [
                                ...prev.employees,
                                {
                                  employeeTypeId: employeeTypes[0]?.id || "",
                                  quantity: "1",
                                  days: "1"
                                }
                              ]
                            }));
                          }}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Agregar Personal
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed rounded-lg">
                        <Users className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No hay tipos de empleados disponibles</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <CircleDollarSign className="h-5 w-5 text-primary" />
                  Movilidad y Peajes
                </CardTitle>
                <CardDescription>
                  Configure los costos de transporte y peajes para el evento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <TooltipLabel
                      htmlFor="mobilityKilometers"
                      label="Kilómetros de Movilidad"
                      tooltip="Cantidad total de kilómetros a recorrer para el evento"
                    />
                    <Input
                      id="mobilityKilometers"
                      name="mobilityKilometers"
                      type="number"
                      value={formData.mobilityKilometers}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          mobilityKilometers: value
                        }));
                      }}
                      placeholder="Ej: 100"
                      min="0"
                    />
                  </div>
                  <div>
                    <TooltipLabel
                      htmlFor="numberOfTolls"
                      label="Número de Peajes"
                      tooltip="Cantidad de peajes en el recorrido"
                    />
                    <Input
                      id="numberOfTolls"
                      name="numberOfTolls"
                      type="number"
                      value={formData.numberOfTolls}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          numberOfTolls: value
                        }));
                      }}
                      placeholder="Ej: 2"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <TooltipLabel
                    htmlFor="tollsCost"
                    label="Costo por Peaje"
                    tooltip="Costo promedio de cada peaje"
                  />
                  <div className="relative">
                    <Input
                      id="tollsCost"
                      name="tollsCost"
                      type="number"
                      value={formData.tollsCost}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          tollsCost: value
                        }));
                      }}
                      className="pl-8"
                      placeholder="Ej: 800"
                      min="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <CustomOperationalCosts
              value={formData.customOperationalCosts}
              onChange={(costs) => {
                setFormData(prev => ({
                  ...prev,
                  customOperationalCosts: costs
                }));
              }}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-8 space-x-4">
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem('quotationFormData');
              localStorage.removeItem('quotationActiveTab');
              window.location.reload();
            }}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Limpiar Todo
          </Button>

          <div className="flex space-x-2">
            <Button
              disabled={isLoading}
              onClick={handleSubmit}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4" />
                  Calcular Cotización
                </>
              )}
            </Button>

            {results && (
              <Button
                onClick={() => setIsSaveModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar Cotización
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Panel de Resultados (ahora debajo del formulario) */}
      {results && (
        <Card className="mt-6 mb-8">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xl flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-primary" />
              Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <QuotationResultsComponent results={results} />
          </CardContent>
        </Card>
      )}

      {/* Save Quotation Dialog */}
      <Dialog open={isSaveModalOpen} onOpenChange={(open) => {
        // Only set state if there's an actual change to prevent unnecessary re-renders
        if (open !== isSaveModalOpen) {
          setIsSaveModalOpen(open);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Guardar Cotización
            </DialogTitle>
            <DialogDescription>
              Complete la información para guardar esta cotización
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quotationName">Nombre de la Cotización</Label>
              <Input
                id="quotationName"
                value={quotationName}
                onChange={(e) => setQuotationName(e.target.value)}
                placeholder="Ej: Evento Primavera 2023"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimatedPaymentDate">Fecha Estimada de Pago</Label>
              <DatePicker
                date={formData.estimatedPaymentDate ? new Date(formData.estimatedPaymentDate) : undefined}
                onSelect={(date) => {
                  setFormData(prev => ({
                    ...prev,
                    estimatedPaymentDate: date ? format(date, 'yyyy-MM-dd') : null
                  }));
                }}
                id="estimatedPaymentDate"
              />
            </div>
            
            <div className="space-y-2">
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
          <DialogFooter className="flex items-center justify-between">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={() => {
                // First save the quotation
                handleSaveQuotation();
                // Then close the modal in a separate update cycle to avoid race conditions
                setTimeout(() => setIsSaveModalOpen(false), 100);
              }} 
              disabled={isSaving || !quotationName}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Guardar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

