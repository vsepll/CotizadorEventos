"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X, DollarSign, PercentIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSession } from "next-auth/react"

export interface AdditionalService {
  id: string
  name: string
  amount: number
  isPercentage: boolean
}

interface CustomAdditionalServicesProps {
  value: AdditionalService[]
  onChange: (services: AdditionalService[]) => void
  totalAmount?: number // Para calcular el valor de los porcentajes
}

export function CustomAdditionalServices({ 
  value = [], 
  onChange,
  totalAmount = 0
}: CustomAdditionalServicesProps) {
  const [newServiceName, setNewServiceName] = useState("")
  const [formError, setFormError] = useState("")
  const { data: session } = useSession()

  // Verificar si el usuario es administrador
  const isAdmin = session?.user?.role === "ADMIN"

  const addAdditionalService = () => {
    if (!newServiceName.trim()) {
      setFormError("Por favor ingrese un nombre para el servicio")
      return
    }

    setFormError("")
    const newService: AdditionalService = {
      id: crypto.randomUUID(),
      name: newServiceName.trim(),
      amount: 0,
      isPercentage: false
    }

    onChange([...value, newService])
    setNewServiceName("")
  }

  const updateServiceAmount = (id: string, amount: number) => {
    const updatedServices = value.map(service => 
      service.id === id ? { ...service, amount } : service
    )
    onChange(updatedServices)
  }

  const updateServiceType = (id: string, isPercentage: boolean) => {
    const updatedServices = value.map(service => 
      service.id === id ? { ...service, isPercentage } : service
    )
    onChange(updatedServices)
  }

  const removeService = (id: string) => {
    const updatedServices = value.filter(service => service.id !== id)
    onChange(updatedServices)
  }

  // Calcular el total considerando si es porcentaje o monto fijo (solo para admins)
  const calculateTotalServices = () => {
    if (!isAdmin) return 0;
    
    return value.reduce((sum, service) => {
      if (service.isPercentage) {
        return sum + (totalAmount * service.amount / 100)
      } else {
        return sum + service.amount
      }
    }, 0)
  }

  const totalServices = calculateTotalServices()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Servicios Adicionales Personalizados
          {!isAdmin && (
            <Badge variant="secondary" className="ml-2">Solo Configuración</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isAdmin 
            ? "Agregue servicios adicionales específicos para este evento"
            : "Configure los conceptos y tipos de servicios adicionales (los montos son gestionados por administradores)"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Agregar nuevo servicio */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="newServiceName">Nuevo Concepto</Label>
              <Input
                id="newServiceName"
                value={newServiceName}
                onChange={(e) => {
                  setNewServiceName(e.target.value)
                  if (formError) setFormError("")
                }}
                placeholder="Nombre del nuevo servicio"
                className={formError ? "border-destructive" : ""}
              />
              {formError && <p className="text-sm text-destructive mt-1">{formError}</p>}
            </div>
            <Button
              onClick={addAdditionalService}
              variant="outline"
              size="icon"
              className="h-10 w-10"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Agregar servicio</span>
            </Button>
          </div>

          {/* Lista de servicios personalizados */}
          {value.length > 0 ? (
            <div className="space-y-3 mt-4">
              {value.map((service) => (
                <div 
                  key={service.id} 
                  className="flex items-center gap-3 p-3 border rounded-lg transition-colors hover:bg-muted/30"
                >
                  <div className="flex-1">
                    <p className="font-medium">{service.name}</p>
                    {!isAdmin && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tipo: {service.isPercentage ? "Porcentaje" : "Monto Fijo"}
                      </p>
                    )}
                  </div>
                  <div className="w-20">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Select
                            value={service.isPercentage ? "percentage" : "fixed"}
                            onValueChange={(value) => updateServiceType(service.id, value === "percentage")}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">$</SelectItem>
                              <SelectItem value="percentage">%</SelectItem>
                            </SelectContent>
                          </Select>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>El porcentaje se calcula sobre el valor total<br />de la venta de tickets (Precio x Cantidad),<br />antes de cargos por servicio.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {isAdmin && (
                    <div className="w-32">
                      <Input
                        type="number"
                        value={service.amount.toString()}
                        onChange={(e) => updateServiceAmount(service.id, Number(e.target.value))}
                        placeholder="Monto"
                        className="text-right"
                      />
                    </div>
                  )}
                  <Button
                    onClick={() => removeService(service.id)}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Eliminar servicio</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed rounded-lg mt-4">
              <DollarSign className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No hay servicios adicionales personalizados</p>
              <p className="text-xs text-muted-foreground mt-1">Agregue servicios utilizando el campo de arriba</p>
            </div>
          )}
        </div>
      </CardContent>
      {value.length > 0 && isAdmin && (
        <CardFooter className="border-t pt-4 flex justify-between">
          <span className="font-semibold">Total Servicios Adicionales:</span>
          <Badge variant="secondary" className="text-lg px-3 py-1 h-auto">
            ${totalServices.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </Badge>
        </CardFooter>
      )}
    </Card>
  )
} 