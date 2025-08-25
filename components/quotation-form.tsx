"use client"

import type React from "react"
import type { QuotationResults } from "@/lib/calculations"

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react"
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

// OPTIMIZACIÓN: Lazy loading de componentes pesados
const QuotationResults = dynamic(() => import("@/components/quotation-results").then(mod => ({ default: mod.QuotationResults })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false
})

const CustomOperationalCosts = dynamic(() => import("@/components/custom-operational-costs").then(mod => ({ default: mod.CustomOperationalCosts })), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false
})

const TicketSectorForm = dynamic(() => import("@/components/ticket-sector-form").then(mod => ({ default: mod.TicketSectorForm })), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false
})

const CustomAdditionalServices = dynamic(() => import("@/components/custom-additional-services").then(mod => ({ default: mod.CustomAdditionalServices })), {
  loading: () => <Skeleton className="h-32 w-full" />,
  ssr: false
})

// OPTIMIZACIÓN: Importar tipos necesarios
interface AdditionalService {
  id: string;
  name: string;
  amount: number;
  isPercentage: boolean;
}

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
  paymentMethod: {
    id: string;
    name: string;
    percentage: number;
  };
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
    calculationType: "fixed" | "percentage" | "per_day" | "per_day_per_person" | "per_ticket_system" | "per_ticket_sector";
    days?: number;
    persons?: number;
    sectors?: string[];
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
  additionalServicesPercentage?: string;
}

interface EmployeeType {
  id: string;
  name: string;
  isOperator: boolean;
  costPerDay: number;
}

// Definir interfaz para métodos de pago
interface PaymentMethodType {
  id: string;
  name: string;
  percentage: number;
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
  
  // OPTIMIZACIÓN: Siempre empezar con pestaña inicial
  const [activeTab, setActiveTab] = useState("event")

  // OPTIMIZACIÓN: Siempre empezar con valores por defecto limpios
  const [formData, setFormData] = useState<FormData>({
    eventType: "",
    totalAmount: "",
    ticketPrice: "",
    platform: {
      name: "TICKET_PLUS",
      percentage: "0"
    },
    additionalServiceItems: [],
    paymentMethod: {
      id: "",
      name: "",
      percentage: 0
    },
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

  const [results, setResults] = useState<QuotationResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [quotationName, setQuotationName] = useState("")
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([])
  const [ticketSectors, setTicketSectors] = useState([])
  // Add a state to control the save modal visibility
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  // Añadir estado para métodos de pago
  const [paymentMethodTypes, setPaymentMethodTypes] = useState<PaymentMethodType[]>([])

  // OPTIMIZACIÓN: Eliminar persistencia automática para evitar confusión
  // Ya no guardamos automáticamente en localStorage
  const prevFormDataRef = useRef<string | null>(null);

    // OPTIMIZACIÓN: Cargar parámetros globales por defecto al inicializar
    useEffect(() => {
      const fetchGlobalParameters = async () => {
        try {
          const response = await fetch('/api/admin/parameters');
          if (!response.ok) {
            throw new Error('Failed to fetch global parameters');
          }
          const data = await response.json();
          
          // OPTIMIZACIÓN: Solo log en desarrollo
          if (process.env.NODE_ENV === 'development') {
            console.log('Fetched global parameters:', data);
          }
          
          // Siempre aplicar parámetros por defecto
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
            // Aplicar costos operativos personalizados si existen
            customOperationalCosts: Array.isArray(data.customOperationalCosts) 
              ? data.customOperationalCosts.map((cost: any, idx: number) => ({
                  id: `op-auto-${idx}-${cost.name}`,
                  name: cost.name,
                  amount: Number(cost.amount ?? cost.baseAmount) || 0,
                  calculationType: ((): any => {
                    const ct = (cost.calculationType || "").toString().toLowerCase();
                    if (["fixed", "$ fijo", "fijo"].includes(ct)) return "fixed";
                    if (["percentage", "%", "% sobre venta", "porcentaje"].includes(ct)) return "percentage";
                    if (["per_day", "$/día", "$/dia", "por día", "dia"].includes(ct)) return "per_day";
                    if ([
                      "per_day_per_person",
                      "$/día x persona",
                      "$/dia x persona",
                      "dia x persona",
                      "día x persona"
                    ].includes(ct)) return "per_day_per_person";
                    if (["per_ticket_system", "$/ticket (sistema)", "$/ticket sistema"].includes(ct)) return "per_ticket_system";
                    if (["per_ticket_sector", "$/ticket x sector"].includes(ct)) return "per_ticket_sector";
                    return "fixed";
                  })(),
                  days: cost.defaultDays ?? undefined,
                  persons: cost.defaultPersons ?? undefined,
                  sectors: cost.defaultSectors ?? undefined
                }))
              : [],
            // Aplicar servicios adicionales si existen
            additionalServiceItems: Array.isArray(data.customAdditionalServices)
              ? data.customAdditionalServices.map((service: any, idx: number) => ({
                  id: `srv-${idx}-${service.name}`,
                  name: service.name,
                  amount: 0,
                  isPercentage: Boolean(service.isPercentage)
                }))
              : []
          }));
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
        // OPTIMIZACIÓN: Solo log en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.log("Tipos de empleados cargados:", data);
        }
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

  // Agregar el efecto para cargar los tipos de métodos de pago
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch("/api/admin/parameters");
        if (!response.ok) {
          throw new Error("Failed to fetch global parameters");
        }
        const data = await response.json();
        
        // Verificar si existen métodos de pago en los parámetros globales
        if (data.paymentMethods && Array.isArray(data.paymentMethods)) {
          // OPTIMIZACIÓN: Solo log en desarrollo
          if (process.env.NODE_ENV === 'development') {
            console.log("Métodos de pago cargados:", data.paymentMethods);
          }
          setPaymentMethodTypes(data.paymentMethods);
        } else {
          // Si no existen en los parámetros, usar opciones predefinidas
          const predefinedMethods = [
            {
              id: "web-payway-22d",
              name: "Costo medio de pago web con Payway a 22 días hábiles",
              percentage: 5
            },
            {
              id: "web-mp-22d",
              name: "Costo medio de pago web con Mercado Pago a 22 días hábiles",
              percentage: 6
            },
            {
              id: "web-macro-22d",
              name: "Costo medio de pago web con Macro a 22 días hábiles",
              percentage: 5
            },
            {
              id: "web-payway-galicia-72h",
              name: "Costo medio de pago web con Payway-Galicia a 72 hs",
              percentage: 9
            },
            {
              id: "point-payway-22d",
              name: "Costo medio de pago point con Payway a 22 días hábiles",
              percentage: 0
            },
            {
              id: "point-mp-22d",
              name: "Costo medio de pago point con Mercado Pago a 22 días hábiles",
              percentage: 6
            },
            {
              id: "point-macro-22d",
              name: "Costo medio de pago point con Macro a 22 días hábiles",
              percentage: 0
            },
            {
              id: "point-payway-galicia-72h",
              name: "Costo medio de pago point con Payway-Galicia a 72 hs",
              percentage: 0
            }
          ];
          setPaymentMethodTypes(predefinedMethods);
        }
      } catch (error) {
        console.error("Error fetching payment methods:", error);
        // En caso de error, usar métodos predefinidos
        const predefinedMethods = [
          {
            id: "web-payway-22d",
            name: "Costo medio de pago web con Payway a 22 días hábiles",
            percentage: 5
          },
          {
            id: "web-mp-22d",
            name: "Costo medio de pago web con Mercado Pago a 22 días hábiles",
            percentage: 6
          }
        ];
        setPaymentMethodTypes(predefinedMethods);
      }
    };

    fetchPaymentMethods();
  }, []);

  // OPTIMIZACIÓN: Función simplificada para limpiar datos
  const clearFormData = () => {
    setActiveTab("event");
    setFormData({
      eventType: "",
      totalAmount: "",
      ticketPrice: "",
      platform: {
        name: "TICKET_PLUS",
        percentage: "0"
      },
      additionalServiceItems: [],
      paymentMethod: {
        id: "",
        name: "",
        percentage: 0
      },
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
    setIsClearModalOpen(false);
    
    // Recargar parámetros globales después de limpiar
    window.location.reload();
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
    // Establecer un porcentaje predeterminado según la plataforma seleccionada
    const defaultPercentage = value === "TICKET_PLUS" ? "5" : "0";
    
    setFormData((prev) => ({
      ...prev,
      platform: {
        name: value,
        percentage: defaultPercentage
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

  const handleCustomOperationalCostsDataChange = (costs: Array<{ id: string, name: string, amount: number, calculationType: "fixed" | "percentage" | "per_day" | "per_day_per_person" | "per_ticket_system" | "per_ticket_sector", days?: number, persons?: number, sectors?: string[] }>) => {
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
      // Create a backup of current form data before any modifications
      const formDataBackup = { ...formData };
      
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

      // Asegurarse de que los métodos de pago estén configurados correctamente
      const paymentMethodsData = {
        credit: {
          percentage: formData.paymentMethod.percentage || 0,
          chargedTo: "US" as const // Los costos siempre los absorbemos nosotros
        },
        debit: {
          percentage: 0,
          chargedTo: "CONSUMER" as const
        },
        cash: {
          percentage: 0,
          chargedTo: "CONSUMER" as const
        }
      };

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
        paymentMethods: paymentMethodsData,
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

      // OPTIMIZACIÓN: Solo log en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('Sending quotation data for calculation:', quotationData)
      }

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
        // Restore original form data if there's an error
        setFormData(formDataBackup);
        throw new Error(errorData.error || "Error calculando cotización")
      }

      // Obtener los resultados calculados
      const responseData = await response.json()
      // OPTIMIZACIÓN: Solo log en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('Resultados recibidos de la API para visualizar:', responseData)
      }
      setResults(responseData)
      
      toast({
        title: "Éxito",
        description: "Cotización calculada correctamente",
      })
      
      // Actualizar formData con los valores calculados, pero preservar empleados
      setFormData(prev => ({
        ...prev,
        totalAmount: String(totalAmount),
        ticketPrice: String(averageTicketPrice),
        // Preservar datos de empleados
        employees: prev.employees
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
    console.log('Starting save quotation process...')
    
    if (!results) {
      console.log('No results available for saving')
      toast({
        title: "Error",
        description: "Debes calcular la cotización antes de guardar",
        variant: "destructive",
      })
      return
    }
    
    if (!session) {
      console.log('No session available')
      toast({
        title: "Error",
        description: "Debes iniciar sesión para guardar cotizaciones",
        variant: "destructive",
      })
      return
    }

    console.log('Setting isSaving to true...')
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
        // Usar el nuevo método de pago
        paymentMethod: {
          id: formData.paymentMethod.id,
          name: formData.paymentMethod.name,
          percentage: formData.paymentMethod.percentage
        },
        // Mantener compatibilidad con API
        paymentMethods: {
          credit: {
            percentage: formData.paymentMethod.percentage || 0,
            chargedTo: "US"
          },
          debit: {
            percentage: 0,
            chargedTo: "CONSUMER"
          },
          cash: {
            percentage: 0,
            chargedTo: "CONSUMER"
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
          amount: Number(cost.amount),
          calculationType: cost.calculationType,
          sectors: cost.sectors
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

      console.log('Sending quotation data to server...')
      console.log('Form data for submission:', formDataForSubmission);

      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formDataForSubmission),
      })

      console.log('Response received:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error response:', errorData)
        throw new Error(errorData.error || "Failed to save quotation")
      }

      const savedQuotation = await response.json()
      console.log('Quotation saved successfully:', savedQuotation)
      
      toast({
        title: "Éxito",
        description: "Cotización guardada exitosamente",
      })
      
      console.log('Clearing form data...')
      clearFormData()
      
      console.log('Closing save modal...')
      setIsSaveModalOpen(false)
      
      console.log('Redirecting to dashboard...')
      // Redirect immediately to dashboard
      router.push('/dashboard')
      
      // Also try window.location as backup
      setTimeout(() => {
        if (window.location.pathname === '/quotation') {
          console.log('Router push failed, using window.location...')
          window.location.href = '/dashboard'
        }
      }, 500)
    } catch (error) {
      console.error("Error saving quotation:", error)
      console.error("Error details:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar la cotización. Por favor inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      console.log('Resetting isSaving to false...')
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
                    {/* Payment Method */}
                    <div className="grid grid-cols-1 gap-4 items-end">
                      <Label className="font-medium">Método de Pago</Label>
                      <div>
                        <TooltipLabel htmlFor="paymentMethod" label="Seleccionar" tooltip="Selecciona el método de pago y su comisión asociada" required />
                        <Select 
                          value={formData.paymentMethod.id} 
                          onValueChange={(value: string) => {
                            const selectedMethod = paymentMethodTypes.find(method => method.id === value);
                            if (selectedMethod) {
                              setFormData(prev => ({
                                ...prev,
                                paymentMethod: {
                                  id: value,
                                  name: selectedMethod.name,
                                  percentage: selectedMethod.percentage
                                },
                                // Mantener compatibilidad con la API actual
                                paymentMethods: {
                                  ...prev.paymentMethods,
                                  credit: {
                                    percentage: selectedMethod.percentage.toString(),
                                    chargedTo: "US"
                                  }
                                }
                              }));
                            }
                          }}
                        >
                          <SelectTrigger id="paymentMethod">
                            <SelectValue placeholder="Seleccionar Método" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethodTypes.map((method) => (
                              <SelectItem key={method.id} value={method.id}>
                                {method.name} ({method.percentage}%)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.paymentMethod.id && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Comisión: {formData.paymentMethod.percentage}%
                          </p>
                        )}
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
                  {/* Calculamos los valores totales a partir de los sectores de tickets */}
                  {(() => {
                    // Calcular el valor total y la cantidad total de tickets
                    let calculatedTotalValue = 0;
                    let calculatedTotalQuantity = 0;
                    
                    if (formData.ticketSectors && formData.ticketSectors.length > 0) {
                      formData.ticketSectors.forEach(sector => {
                        sector.variations.forEach(variation => {
                          calculatedTotalValue += variation.price * variation.quantity;
                          calculatedTotalQuantity += variation.quantity;
                        });
                      });
                    }
                    
                    return (
                      <CustomOperationalCosts 
                        value={formData.customOperationalCosts} 
                        onChange={handleCustomOperationalCostsDataChange} 
                        ticketSectors={formData.ticketSectors}
                        totalAmount={calculatedTotalValue}
                        ticketQuantity={calculatedTotalQuantity}
                      />
                    );
                  })()}
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
          <Dialog open={isClearModalOpen} onOpenChange={setIsClearModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Limpiar Formulario</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar limpieza del formulario</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que deseas limpiar todos los datos del formulario? Esta acción no se puede deshacer y perderás todos los datos ingresados, incluidos los empleados y costos personalizados.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button 
                  variant="destructive" 
                  onClick={clearFormData}
                >
                  Sí, limpiar todo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  <QuotationResults 
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

