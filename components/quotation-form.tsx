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
import { Skeleton } from "@/components/ui/skeleton"
import { CustomAdditionalServices, AdditionalService } from "@/components/custom-additional-services"

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
    name: "TICKET_PLUS" | "SVT";
    percentage: string;
  };
  additionalServiceItems: AdditionalService[];
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
  paymentStatus: "PENDING" | "CONFIRMED" | "PAID";
}

interface EmployeeType {
  id: string;
  name: string;
  isOperator: boolean;
  costPerDay: number;
}

// Re-add formatCurrency helper function
const formatCurrency = (value: number | null | undefined) => {
  if (value == null) return "N/A"; 
  return value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
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
          paymentStatus: parsedData.paymentStatus || "PENDING",
          additionalServiceItems: parsedData.additionalServiceItems || []
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
      additionalServiceItems: [],
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
    localStorage.removeItem('quotationFormData');
    localStorage.removeItem('quotationActiveTab');
    setActiveTab("event");
    setFormData({
      eventType: "",
      totalAmount: "",
      ticketPrice: "",
      platform: {
        name: "TICKET_PLUS",
        percentage: ""
      },
      additionalServiceItems: [],
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
    });
    setResults(null);
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

  const handlePlatformChange = (value: "TICKET_PLUS" | "SVT") => {
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

  const handleCustomOperationalCostsDataChange = (costs: Array<{ id: string, name: string, amount: number }>) => {
    setFormData(prev => ({
      ...prev,
      customOperationalCosts: costs
    }))
  }

  const handleTicketSectorsDataChange = (newTicketSectors: Array<{
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

  const handleAdditionalServicesDataChange = (services: AdditionalService[]) => {
    setFormData(prev => ({
      ...prev,
      additionalServiceItems: services
    }));
  };

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

      // Desestructurar formData para excluir el campo obsoleto
      const { additionalServicesPercentage, ...restOfFormData } = formData;

      const quotationData = {
        ...restOfFormData, // Usar el resto de los datos
        totalAmount: Number(totalAmount),
        ticketPrice: Number(averageTicketPrice),
        // Asegurarse de que todos los valores numéricos sean números
        platform: {
          // Acceder a platform directamente desde formData original sigue bien
          ...formData.platform,
          percentage: Number(formData.platform.percentage)
        },
        paymentMethods: {
          // Acceder a paymentMethods directamente desde formData original
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
        // Los demás campos también se acceden desde formData
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
        })),
        // Asegurarse que additionalServiceItems viene del formData original
        additionalServiceItems: formData.additionalServiceItems 
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
        additionalServiceItems: formData.additionalServiceItems
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
      isValidNumber(formData.platform.percentage)

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
    const additionalServicesValid = validateOptionalNumber(formData.additionalServiceItems.length.toString())

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
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Form Section */}
      <div className="flex-grow lg:w-1/2 xl:w-2/3 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="event"><Building2 className="w-4 h-4 mr-2"/>Evento</TabsTrigger>
            <TabsTrigger value="tickets"><Ticket className="w-4 h-4 mr-2"/>Entradas</TabsTrigger>
            <TabsTrigger value="costs"><CircleDollarSign className="w-4 h-4 mr-2"/>Costos Operativos</TabsTrigger>
            <TabsTrigger value="payment"><CalendarIcon className="w-4 h-4 mr-2"/>Cobro y Estado</TabsTrigger>
          </TabsList>

          {/* Evento Tab */}
          <TabsContent value="event">
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Evento y Plataforma</CardTitle>
                <CardDescription>Información básica del evento y configuración de la plataforma de ticketing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <TooltipLabel htmlFor="eventType" label="Tipo de Evento" tooltip="Selecciona el tipo de evento (A, B, C, o D)." required />
                    <Select 
                      value={formData.eventType} 
                      onValueChange={(value) => setFormData(prev => ({...prev, eventType: value}))} 
                      required
                    >
                      <SelectTrigger id="eventType">
                        <SelectValue placeholder="Seleccionar Tipo" />
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
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <TooltipLabel htmlFor="platformName" label="Plataforma" tooltip="Selecciona la plataforma de ticketing." />
                      <Select 
                        value={formData.platform.name} 
                        onValueChange={(value: "TICKET_PLUS" | "SVT") => handlePlatformChange(value)}
                      >
                        <SelectTrigger id="platformName">
                          <SelectValue placeholder="Seleccionar Plataforma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TICKET_PLUS">Ticket Plus</SelectItem>
                          <SelectItem value="SVT">SVT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.platform.name === "TICKET_PLUS" && (
                      <div>
                        <TooltipLabel htmlFor="platformPercentage" label="% Comisión Plataforma" tooltip="Porcentaje de comisión que cobra Ticket Plus." required />
                        <Input 
                          id="platformPercentage" 
                          type="number" 
                          value={formData.platform.percentage} 
                          onChange={(e) => setFormData(prev => ({ ...prev, platform: { ...prev.platform, percentage: e.target.value } }))} 
                          placeholder="Ej: 10" 
                          min="0"
                          step="0.1"
                          required 
                        />
                      </div>
                    )}
                </div>
                
                 <Separator />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Entradas Tab */}
          <TabsContent value="tickets">
             <Card>
              <CardHeader>
                <CardTitle>Configuración de Entradas</CardTitle>
                <CardDescription>Define los sectores, tipos de entrada, precios y cargos por servicio.</CardDescription>
              </CardHeader>
              <CardContent>
                 <TicketSectorForm 
                    initialSectors={formData.ticketSectors} 
                    onChange={handleTicketSectorsDataChange} 
                 />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Costos Operativos Tab */}
          <TabsContent value="costs">
            <div className="space-y-6">
              {/* Payment Methods Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Métodos de Pago y Comisiones</CardTitle>
                  <CardDescription>Configura las comisiones para cada método de pago y quién las absorbe.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Credit Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end border-b pb-4">
                      <Label className="sm:col-span-2 font-medium">Tarjeta de Crédito</Label>
                      <div>
                        <TooltipLabel htmlFor="creditPercentage" label="% Comisión" tooltip="Porcentaje de comisión para pagos con tarjeta de crédito." required />
                        <Input 
                          id="creditPercentage" 
                          type="number" 
                          value={formData.paymentMethods.credit.percentage} 
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentMethods: { ...prev.paymentMethods, credit: { ...prev.paymentMethods.credit, percentage: e.target.value } } }))}
                          placeholder="Ej: 4.5" 
                          min="0" 
                          step="0.1"
                          required
                        />
                      </div>
                       <div>
                        <TooltipLabel htmlFor="creditChargedTo" label="Cobrado a" tooltip="Quién absorbe el costo de la comisión." />
                        <Select 
                          value={formData.paymentMethods.credit.chargedTo} 
                          onValueChange={(value: "US" | "CLIENT" | "CONSUMER") => handlePaymentMethodChargeToChange("credit", value)}
                        >
                          <SelectTrigger id="creditChargedTo">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">Nosotros</SelectItem>
                            <SelectItem value="CLIENT">Cliente (Productor)</SelectItem>
                            <SelectItem value="CONSUMER">Consumidor Final</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Debit Card */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end border-b pb-4">
                      <Label className="sm:col-span-2 font-medium">Tarjeta de Débito</Label>
                      <div>
                        <TooltipLabel htmlFor="debitPercentage" label="% Comisión" tooltip="Porcentaje de comisión para pagos con tarjeta de débito." required />
                        <Input 
                          id="debitPercentage" 
                          type="number" 
                          value={formData.paymentMethods.debit.percentage} 
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentMethods: { ...prev.paymentMethods, debit: { ...prev.paymentMethods.debit, percentage: e.target.value } } }))}
                          placeholder="Ej: 2.5" 
                          min="0" 
                          step="0.1"
                          required
                        />
                      </div>
                       <div>
                        <TooltipLabel htmlFor="debitChargedTo" label="Cobrado a" tooltip="Quién absorbe el costo de la comisión." />
                        <Select 
                          value={formData.paymentMethods.debit.chargedTo} 
                          onValueChange={(value: "US" | "CLIENT" | "CONSUMER") => handlePaymentMethodChargeToChange("debit", value)}
                        >
                          <SelectTrigger id="debitChargedTo">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">Nosotros</SelectItem>
                            <SelectItem value="CLIENT">Cliente (Productor)</SelectItem>
                            <SelectItem value="CONSUMER">Consumidor Final</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Cash */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                      <Label className="sm:col-span-2 font-medium">Efectivo</Label>
                      <div>
                        <TooltipLabel htmlFor="cashPercentage" label="% Comisión" tooltip="Porcentaje de comisión para pagos en efectivo (si aplica)." required />
                        <Input 
                          id="cashPercentage" 
                          type="number" 
                          value={formData.paymentMethods.cash.percentage} 
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentMethods: { ...prev.paymentMethods, cash: { ...prev.paymentMethods.cash, percentage: e.target.value } } }))}
                          placeholder="Ej: 1" 
                          min="0" 
                          step="0.1"
                          required
                        />
                      </div>
                       <div>
                        <TooltipLabel htmlFor="cashChargedTo" label="Cobrado a" tooltip="Quién absorbe el costo de la comisión." />
                        <Select 
                          value={formData.paymentMethods.cash.chargedTo} 
                          onValueChange={(value: "US" | "CLIENT" | "CONSUMER") => handlePaymentMethodChargeToChange("cash", value)}
                        >
                          <SelectTrigger id="cashChargedTo">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">Nosotros</SelectItem>
                            <SelectItem value="CLIENT">Cliente (Productor)</SelectItem>
                            <SelectItem value="CONSUMER">Consumidor Final</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                </CardContent>
              </Card>
              
              {/* General Costs Card */}
              <Card>
                 <CardHeader>
                  <CardTitle>Costos Operativos Generales</CardTitle>
                  <CardDescription>Costos asociados a credenciales y movilidad.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <TooltipLabel htmlFor="credentialsCost" label="Costo Credenciales" tooltip="Costo total estimado para credenciales (opcional)." />
                      <Input 
                        id="credentialsCost" 
                        name="credentialsCost"
                        type="number" 
                        value={formData.credentialsCost} 
                        onChange={handleInputChange} 
                        placeholder="Ej: 5000" 
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>
                  <Separator />
                  <p className="font-medium text-sm">Movilidad</p>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div>
                        <TooltipLabel htmlFor="mobilityKilometers" label="Kilómetros Totales" tooltip="Distancia total estimada a recorrer (ida y vuelta)." required />
                        <Input 
                          id="mobilityKilometers" 
                          name="mobilityKilometers"
                          type="number" 
                          value={formData.mobilityKilometers} 
                          onChange={handleInputChange} 
                          placeholder="Ej: 150" 
                          min="0"
                          step="10"
                          required
                        />
                      </div>
                      <div>
                        <TooltipLabel htmlFor="numberOfTolls" label="N° Peajes (Ida y Vuelta)" tooltip="Cantidad total de peajes en el trayecto completo." required />
                        <Input 
                          id="numberOfTolls" 
                          name="numberOfTolls"
                          type="number" 
                          value={formData.numberOfTolls} 
                          onChange={handleInputChange} 
                          placeholder="Ej: 4" 
                          min="0"
                          step="1"
                          required
                        />
                      </div>
                       <div>
                        <TooltipLabel htmlFor="tollsCost" label="Costo Promedio Peaje" tooltip="Costo promedio de cada peaje." required />
                        <Input 
                          id="tollsCost" 
                          name="tollsCost"
                          type="number" 
                          value={formData.tollsCost} 
                          onChange={handleInputChange} 
                          placeholder="Ej: 300" 
                          min="0"
                          step="50"
                          required
                        />
                      </div>
                   </div>
                </CardContent>
              </Card>
              
              {/* Employees Card */}
              <Card>
                 <CardHeader>
                  <CardTitle>Personal Afectado</CardTitle>
                  <CardDescription>Selecciona el tipo, cantidad y días de trabajo del personal necesario.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                      {formData.employees.map((employee, index) => (
                        <div key={index} className="flex flex-wrap sm:flex-nowrap gap-4 items-end border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="flex-grow min-w-[150px]">
                            <Label htmlFor={`employeeType-${index}`}>Tipo</Label>
                            <Select
                              value={employee.employeeTypeId}
                              onValueChange={(value) => {
                                const newEmployees = [...formData.employees];
                                newEmployees[index].employeeTypeId = value;
                                setFormData({ ...formData, employees: newEmployees });
                              }}
                            >
                              <SelectTrigger id={`employeeType-${index}`}>
                                <SelectValue placeholder="Seleccionar Tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {employeeTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.name} ({formatCurrency(type.costPerDay)}/día)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-20 flex-shrink-0">
                            <Label htmlFor={`employeeQuantity-${index}`}>Cant.</Label>
                            <Input
                              id={`employeeQuantity-${index}`}
                              type="number"
                              value={employee.quantity}
                              onChange={(e) => {
                                const newEmployees = [...formData.employees];
                                newEmployees[index].quantity = e.target.value;
                                setFormData({ ...formData, employees: newEmployees });
                              }}
                              min="1"
                              placeholder="Cant."
                              required
                            />
                          </div>
                          <div className="w-20 flex-shrink-0">
                            <Label htmlFor={`employeeDays-${index}`}>Días</Label>
                            <Input
                              id={`employeeDays-${index}`}
                              type="number"
                              value={employee.days}
                              onChange={(e) => {
                                const newEmployees = [...formData.employees];
                                newEmployees[index].days = e.target.value;
                                setFormData({ ...formData, employees: newEmployees });
                              }}
                              min="1"
                              placeholder="Días"
                              required
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={() => {
                              const newEmployees = formData.employees.filter((_, i) => i !== index);
                              setFormData({ ...formData, employees: newEmployees });
                            }}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button 
                        variant="outline"
                        onClick={() => setFormData({ ...formData, employees: [...formData.employees, { employeeTypeId: '', quantity: '1', days: '1' }] })} 
                        className="mt-4"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Añadir Personal
                    </Button>
                </CardContent>
              </Card>
              
              {/* Custom Operational Costs Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Costos Operativos Personalizados</CardTitle>
                  <CardDescription>Añade cualquier otro costo operativo específico del evento.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CustomOperationalCosts 
                      value={formData.customOperationalCosts} 
                      onChange={handleCustomOperationalCostsDataChange} 
                    />
                </CardContent>
              </Card>

              {/* Agregar componente de Servicios Adicionales Personalizados */}
              <Separator className="my-6" />
              <CustomAdditionalServices
                value={formData.additionalServiceItems}
                onChange={handleAdditionalServicesDataChange}
                // Podríamos pasar el totalAmount calculado si es necesario para porcentajes
                // totalAmount={calculatedTotalAmount} 
              />
            </div>
          </TabsContent>
          
          {/* Cobro y Estado Tab */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Fecha de Cobro Estimada y Estado</CardTitle>
                <CardDescription>Define cuándo se espera recibir el pago y el estado actual de la cotización.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <div>
                    <Label>Fecha de Cobro Estimada</Label>
                    <DatePicker 
                      date={formData.estimatedPaymentDate ? new Date(formData.estimatedPaymentDate) : undefined} 
                      onSelect={(date: Date | undefined) => setFormData(prev => ({ ...prev, estimatedPaymentDate: date ? date.toISOString() : null }))} 
                    />
                    <p className="text-sm text-muted-foreground mt-1">Opcional. Ayuda a filtrar en el dashboard de rentabilidad.</p>
                  </div>
                   <div>
                      <Label>Estado de Pago</Label>
                      <Select 
                        value={formData.paymentStatus} 
                        onValueChange={(value: "PENDING" | "CONFIRMED" | "PAID") => setFormData(prev => ({ ...prev, paymentStatus: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pendiente</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                          <SelectItem value="PAID">Pagado</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Action Buttons - Moved outside Tabs but within the form section div */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button variant="outline" onClick={clearFormData}>Limpiar Formulario</Button>
          <div className="flex gap-4">
            <Button onClick={handleSubmit} disabled={isLoading || isSaving} className="min-w-[120px]">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />} 
              Calcular
            </Button>
            <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
              <DialogTrigger asChild>
                <Button variant="default" disabled={!results || isLoading || isSaving} className="min-w-[120px]">
                  <Save className="mr-2 h-4 w-4" />
                  Guardar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Guardar Cotización</DialogTitle>
                  <DialogDescription>
                    Ingresa un nombre para identificar esta cotización.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quotationName" className="text-right">
                      Nombre
                    </Label>
                    <Input
                      id="quotationName"
                      value={quotationName}
                      onChange={(e) => setQuotationName(e.target.value)}
                      className="col-span-3"
                      placeholder="Ej: Festival Primavera 2024"
                    />
                  </div>
                </div>
                <DialogFooter>
                   <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                   </DialogClose>
                  <Button onClick={handleSaveQuotation} disabled={isSaving || !quotationName.trim()}>
                     {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                     Guardar Cotización
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div> { /* End Form Section Div */ }

      {/* Results Section */}
      <div className="flex-grow lg:w-1/2 xl:w-1/3">
        <div className="sticky top-24 space-y-6">
          <h2 className="text-xl font-semibold">Resultados</h2>
           {isLoading ? (
              <Card className="animate-pulse">
                <CardHeader><Skeleton className="h-6 w-3/4"/></CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-20 w-full"/>
                  <Skeleton className="h-40 w-full"/>
                </CardContent>
              </Card>
            ) : results ? (
                <div className="mt-8">
                  <QuotationResultsComponent 
                    id={null as any}
                    results={results} 
                    onStatusChange={async (id: string, newStatus: "review" | "approved" | "rejected"): Promise<void> => { 
                      console.log(`Status change requested from results component for ID: ${id} to ${newStatus}`);
                    }} 
                  />
                </div>
            ) : (
              <Card className="flex items-center justify-center h-60 border-dashed">
                  <p className="text-muted-foreground text-center px-4">Completa el formulario y presiona "Calcular" para ver los resultados.</p>
              </Card>
            )}
        </div>
      </div>

    </div> // End main flex container div
  )
}

