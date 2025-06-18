"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X, DollarSign, Info, Calculator, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSession } from "next-auth/react"

interface CustomCost {
  id: string
  name: string
  amount: number
  calculationType: "fixed" | "percentage" | "per_day" | "per_day_per_person" | "per_ticket_system" | "per_ticket_sector"
  // Optional number of days for calculationType = "per_day" or "per_day_per_person"
  days?: number
  // Optional number of persons for calculationType = "per_day_per_person"
  persons?: number
  // Selected sector names for calculationType = "per_ticket_sector"
  sectors?: string[]
}

interface TicketSectorOption {
  name: string
  variations?: Array<{
    name: string
    price?: number
    quantity?: number
  }>
}

interface CustomOperationalCostsProps {
  value: CustomCost[]
  onChange: (costs: CustomCost[]) => void
  totalAmount?: number
  // Cantidad total de tickets para cálculos
  ticketQuantity?: number
  // Ticket sectors available in the quotation form – needed for sector selector
  ticketSectors?: TicketSectorOption[]
}

export function CustomOperationalCosts({ value = [], onChange, totalAmount = 0, ticketQuantity = 0, ticketSectors }: CustomOperationalCostsProps) {
  const [newCostName, setNewCostName] = useState("")
  const [formError, setFormError] = useState("")
  const { data: session } = useSession()

  // Verificar si el usuario es administrador
  const isAdmin = session?.user?.role === "ADMIN"

  const rowInputClass = "h-8 px-2 text-sm";

  const typeDescriptions = useMemo(() => ({
    fixed: "Monto fijo independiente de otros factores",
    percentage: "Porcentaje sobre el total de la venta",
    per_day: "Monto multiplicado por cantidad de días del evento",
    per_day_per_person: "Monto multiplicado por días y por cantidad de personas",
    per_ticket_system: "Monto multiplicado por la cantidad total de tickets del evento",
    per_ticket_sector: "Monto multiplicado por la cantidad de tickets en sectores seleccionados"
  }), []);

  const addCustomCost = () => {
    if (!newCostName.trim()) {
      setFormError("El nombre del costo no puede estar vacío")
      return
    }

    setFormError("")
    const newCost: CustomCost = {
      id: crypto.randomUUID(),
      name: newCostName.trim(),
      amount: 0,
      calculationType: "fixed"
    }

    onChange([...value, newCost])
    setNewCostName("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addCustomCost();
    }
  }

  const updateCostAmount = (id: string, amount: number) => {
    const updatedCosts = value.map(cost => 
      cost.id === id ? { ...cost, amount } : cost
    )
    onChange(updatedCosts)
  }

  const updateCostName = (id: string, name: string) => {
    const updatedCosts = value.map(cost =>
      cost.id === id ? { ...cost, name } : cost
    )
    onChange(updatedCosts)
  }

  const updateCostType = (id: string, calculationType: CustomCost["calculationType"]) => {
    const updatedCosts = value.map(cost =>
      cost.id === id 
        ? {
            ...cost, 
            calculationType,
            // Inicializar con valores por defecto cuando se cambia el tipo
            days: calculationType === "per_day" || calculationType === "per_day_per_person" ? 1 : undefined,
            persons: calculationType === "per_day_per_person" ? 1 : undefined,
            sectors: calculationType === "per_ticket_sector" ? cost.sectors ?? [] : undefined
          } 
        : cost
    )
    onChange(updatedCosts)
  }

  const updateCostDays = (id: string, days: number) => {
    const updatedCosts = value.map(cost =>
      cost.id === id ? { ...cost, days } : cost
    )
    onChange(updatedCosts)
  }

  const updateCostPersons = (id: string, persons: number) => {
    const updatedCosts = value.map(cost =>
      cost.id === id ? { ...cost, persons } : cost
    )
    onChange(updatedCosts)
  }

  const updateCostSectors = (id: string, sectorName: string, checked: boolean) => {
    const updatedCosts = value.map(cost => {
      if (cost.id !== id) return cost;
      const current = cost.sectors ?? [];
      const newSectors = checked
        ? [...current, sectorName]
        : current.filter(s => s !== sectorName);
      return { ...cost, sectors: newSectors };
    });
    onChange(updatedCosts);
  }

  const removeCost = (id: string) => {
    const updatedCosts = value.filter(cost => cost.id !== id)
    onChange(updatedCosts)
  }

  const calculateCostAmount = (cost: CustomCost): number => {
    // Solo calcular para admins o cuando sea necesario internamente
    if (!isAdmin) return 0;
    
    // Validamos que amount sea un número válido mayor a 0
    if (isNaN(cost.amount) || cost.amount <= 0) return 0;
    
    switch (cost.calculationType) {
      case "percentage":
        // Verificar que hay un total de ventas
        if (!totalAmount || totalAmount <= 0) return 0;
        return totalAmount * cost.amount / 100;
      case "per_day":
        if (typeof cost.days !== "number" || cost.days <= 0) return 0;
        return cost.amount * cost.days;
      case "per_day_per_person":
        if (typeof cost.days !== "number" || cost.days <= 0 || 
            typeof cost.persons !== "number" || cost.persons <= 0) return 0;
        return cost.amount * cost.days * cost.persons;
      case "per_ticket_system":
        // Ahora usamos la cantidad de tickets real
        if (ticketQuantity <= 0) return 0;
        return cost.amount * ticketQuantity;
      case "per_ticket_sector":
        // Ahora calculamos basado en los sectores seleccionados
        if (!cost.sectors || cost.sectors.length === 0 || !ticketSectors || ticketSectors.length === 0) return 0;
        
        // Estimar tickets en los sectores seleccionados
        let ticketsInSelectedSectors = 0;
        
        // Si tenemos acceso a los datos completos de los sectores con variaciones
        if (ticketSectors[0] && 'variations' in ticketSectors[0]) {
          // Si los sectores incluyen información de variaciones con cantidades
          ticketSectors.forEach((sector: any) => {
            if (cost.sectors!.includes(sector.name) && sector.variations) {
              sector.variations.forEach((variation: any) => {
                ticketsInSelectedSectors += variation.quantity || 0;
              });
            }
          });
        } else {
          // Si solo tenemos nombres de sectores, usamos una estimación proporcional
          if (ticketSectors.length > 0 && cost.sectors.length > 0) {
            const proportionOfSectors = cost.sectors.length / ticketSectors.length;
            ticketsInSelectedSectors = Math.round(ticketQuantity * proportionOfSectors);
          }
        }
        
        if (ticketsInSelectedSectors <= 0) return 0;
        return cost.amount * ticketsInSelectedSectors;
      case "fixed":
      default:
        return cost.amount;
    }
  }

  const totalCosts = isAdmin ? value.reduce((sum, cost) => sum + calculateCostAmount(cost), 0) : 0;

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Costos Operativos Personalizados
          {!isAdmin && (
            <Badge variant="secondary" className="ml-2">Solo Configuración</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isAdmin 
            ? "Agregue costos operativos adicionales específicos para este evento"
            : "Configure los conceptos y cantidades de costos operativos (los montos son gestionados por administradores)"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Agregar nuevo costo */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex-1 w-full">
              <Label htmlFor="newCostName" className="mb-1.5 block">Nuevo Concepto</Label>
              <Input
                id="newCostName"
                value={newCostName}
                onChange={(e) => {
                  setNewCostName(e.target.value)
                  if (formError) setFormError("")
                }}
                onKeyDown={handleKeyDown}
                placeholder="Nombre del nuevo costo"
                className={formError ? "border-destructive" : ""}
              />
              {formError && <p className="text-sm text-destructive mt-1.5">{formError}</p>}
            </div>
            <Button
              onClick={addCustomCost}
              variant="outline"
              className="h-10 px-4 min-w-[40px] flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span className="sm:hidden md:inline">Agregar costo</span>
            </Button>
          </div>

          {/* Lista de costos personalizados */}
          {value.length > 0 ? (
            <div className="space-y-3 mt-4">
              {/* Encabezados - solo visibles en desktop */}
              <div className={`hidden md:grid ${isAdmin ? 'grid-cols-[minmax(240px,1.8fr)_110px_100px_60px_60px_minmax(140px,1fr)_32px]' : 'grid-cols-[minmax(240px,2fr)_130px_80px_80px_minmax(140px,1.5fr)_32px]'} gap-1 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase border rounded-md bg-muted/30`}>
                <span>CONCEPTO</span>
                <span>TIPO</span>
                {isAdmin && <span>MONTO</span>}
                <span>DÍAS</span>
                <span>PERS.</span>
                <span>SECTORES</span>
                <span></span>
              </div>
              
              {/* Lista de costos en scroll area para mejor manejo en mobile */}
              <ScrollArea className="h-full">
                <div className="space-y-3 pb-2 pr-4">
                  {value.map((cost) => (
                    <div
                      key={cost.id}
                      className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-[minmax(240px,1.8fr)_110px_100px_60px_60px_minmax(140px,1fr)_32px]' : 'md:grid-cols-[minmax(240px,2fr)_130px_80px_80px_minmax(140px,1.5fr)_32px]'} gap-1 md:gap-1 items-center p-2 border rounded-lg hover:bg-muted/10 transition-colors text-sm`}
                    >
                      {/* Mobile labels */}
                      <div className="md:hidden flex flex-col space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`cost-name-${cost.id}`} className="text-xs font-medium text-muted-foreground">Concepto</Label>
                          <Input
                            id={`cost-name-${cost.id}`}
                            value={cost.name}
                            onChange={(e) => updateCostName(cost.id, e.target.value)}
                            placeholder="Concepto"
                            className={`w-full ${rowInputClass}`}
                          />
                        </div>
                        
                        <div className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                          <div className="space-y-2">
                            <Label htmlFor={`cost-type-${cost.id}`} className="text-xs font-medium text-muted-foreground">Tipo</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Select
                                      value={cost.calculationType}
                                      onValueChange={(val) => updateCostType(cost.id, val as CustomCost["calculationType"])}
                                    >
                                      <SelectTrigger id={`cost-type-${cost.id}`} className={`w-full ${rowInputClass}`}>
                                        <SelectValue placeholder="Tipo" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="fixed">$ Fijo</SelectItem>
                                        <SelectItem value="percentage">% Sobre Venta</SelectItem>
                                        <SelectItem value="per_day">$/Día</SelectItem>
                                        <SelectItem value="per_day_per_person">$/Día x Persona</SelectItem>
                                        <SelectItem value="per_ticket_system">$/Ticket (Sistema)</SelectItem>
                                        <SelectItem value="per_ticket_sector">$/Ticket x Sector</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p className="max-w-xs">{typeDescriptions[cost.calculationType]}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
                          {isAdmin && (
                            <div className="space-y-2">
                              <Label htmlFor={`cost-amount-${cost.id}`} className="text-xs font-medium text-muted-foreground">Monto</Label>
                              <Input
                                id={`cost-amount-${cost.id}`}
                                type="number"
                                value={cost.amount.toString()}
                                onChange={(e) => updateCostAmount(cost.id, Number(e.target.value))}
                                placeholder="Monto"
                                className={`text-right ${rowInputClass}`}
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {/* Días */}
                          <div className="space-y-2">
                            <Label htmlFor={`cost-days-mobile-${cost.id}`} className="text-xs font-medium text-muted-foreground">Días</Label>
                            {(cost.calculationType === "per_day" || cost.calculationType === "per_day_per_person") ? (
                              <Input
                                id={`cost-days-mobile-${cost.id}`}
                                type="number"
                                min="1"
                                value={cost.days?.toString() ?? ""}
                                onChange={(e) => updateCostDays(cost.id, Number(e.target.value))}
                                className={rowInputClass}
                              />
                            ) : (
                              <div className="h-10 flex items-center justify-center text-sm text-muted-foreground border rounded-md bg-muted/20">—</div>
                            )}
                          </div>
                          
                          {/* Personas */}
                          <div className="space-y-2">
                            <Label htmlFor={`cost-persons-mobile-${cost.id}`} className="text-xs font-medium text-muted-foreground">Personas</Label>
                            {cost.calculationType === "per_day_per_person" ? (
                              <Input
                                id={`cost-persons-mobile-${cost.id}`}
                                type="number"
                                min="1"
                                value={cost.persons?.toString() ?? ""}
                                onChange={(e) => updateCostPersons(cost.id, Number(e.target.value))}
                                className={rowInputClass}
                              />
                            ) : (
                              <div className="h-10 flex items-center justify-center text-sm text-muted-foreground border rounded-md bg-muted/20">—</div>
                            )}
                          </div>
                        </div>
                        
                        {/* Sectores en mobile */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Sectores</Label>
                          {cost.calculationType === "per_ticket_sector" ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={`w-full justify-between ${rowInputClass}`}
                                  disabled={!ticketSectors || ticketSectors.length === 0}
                                >
                                  {ticketSectors && ticketSectors.length > 0
                                    ? cost.sectors && cost.sectors.length > 0
                                      ? `${cost.sectors.length} seleccionado(s)`
                                      : "Seleccionar"
                                    : "Definir Sectores"}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="max-h-60 overflow-auto">
                                {ticketSectors && ticketSectors.length > 0 ? (
                                  ticketSectors.map((sector) => (
                                    <DropdownMenuCheckboxItem
                                      key={sector.name}
                                      checked={cost.sectors?.includes(sector.name) ?? false}
                                      onCheckedChange={(checked) =>
                                        updateCostSectors(cost.id, sector.name, checked as boolean)
                                      }
                                    >
                                      {sector.name}
                                    </DropdownMenuCheckboxItem>
                                  ))
                                ) : (
                                  <div className="px-4 py-2 text-sm text-muted-foreground">
                                    Primero defina sectores en la pestaña "Entradas".
                                  </div>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <div className="h-10 flex items-center justify-center text-sm text-muted-foreground border rounded-md bg-muted/20">—</div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <Calculator className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {(() => {
                                  const calculated = calculateCostAmount(cost);
                                  if (calculated <= 0) return "Calculado: $0,00";
                                  
                                  // Mostrar detalles del cálculo según el tipo
                                  switch (cost.calculationType) {
                                    case "percentage":
                                      return `${cost.amount}% de ${totalAmount.toLocaleString('es-AR')} = ${calculated.toLocaleString('es-AR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}`;
                                    case "per_day":
                                      return `${cost.days} días x ${cost.amount.toLocaleString('es-AR')} = ${calculated.toLocaleString('es-AR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}`;
                                    case "per_day_per_person":
                                      return `${cost.days} días x ${cost.persons} pers. x ${cost.amount.toLocaleString('es-AR')} = ${calculated.toLocaleString('es-AR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}`;
                                    case "per_ticket_system":
                                      return `${ticketQuantity} tickets x ${cost.amount.toLocaleString('es-AR')} = ${calculated.toLocaleString('es-AR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}`;
                                    case "per_ticket_sector":
                                      // Simplificado porque no tenemos fácil acceso al número exacto de tickets por sector en esta vista
                                      return `Calculado: ${calculated.toLocaleString('es-AR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}`;
                                    default:
                                      return `Calculado: ${calculated.toLocaleString('es-AR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}`;
                                  }
                                })()}
                              </span>
                            </div>
                          )}
                          <Button
                            onClick={() => removeCost(cost.id)}
                            variant="destructive"
                            size="sm"
                            className="h-8 px-3"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>

                      {/* Desktop layout - hidden in mobile */}
                      <div className="hidden md:block overflow-hidden">
                        <Input
                          value={cost.name}
                          onChange={(e) => updateCostName(cost.id, e.target.value)}
                          placeholder="Concepto"
                          className={`w-full ${rowInputClass}`}
                          title={cost.name}
                        />
                      </div>
                      <div className="hidden md:block">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Select
                                  value={cost.calculationType}
                                  onValueChange={(val) => updateCostType(cost.id, val as CustomCost["calculationType"])}
                                >
                                  <SelectTrigger className={`w-full ${rowInputClass}`}>
                                    <SelectValue placeholder="Tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fixed">$ Fijo</SelectItem>
                                    <SelectItem value="percentage">% Sobre Venta</SelectItem>
                                    <SelectItem value="per_day">$/Día</SelectItem>
                                    <SelectItem value="per_day_per_person">$/Día x Persona</SelectItem>
                                    <SelectItem value="per_ticket_system">$/Ticket (Sistema)</SelectItem>
                                    <SelectItem value="per_ticket_sector">$/Ticket x Sector</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>{typeDescriptions[cost.calculationType]}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      {isAdmin && (
                        <div className="hidden md:block">
                          <Input
                            type="number"
                            value={cost.amount.toString()}
                            onChange={(e) => updateCostAmount(cost.id, Number(e.target.value))}
                            placeholder="Monto"
                            className={`text-right ${rowInputClass}`}
                          />
                        </div>
                      )}
                      <div className="hidden md:block">
                        {(cost.calculationType === "per_day" || cost.calculationType === "per_day_per_person") ? (
                          <Input
                            type="number"
                            min="1"
                            value={cost.days?.toString() ?? ""}
                            onChange={(e) => updateCostDays(cost.id, Number(e.target.value))}
                            className={rowInputClass}
                          />
                        ) : (
                          <div className="text-center text-muted-foreground">—</div>
                        )}
                      </div>
                      <div className="hidden md:block">
                        {cost.calculationType === "per_day_per_person" ? (
                          <Input
                            type="number"
                            min="1"
                            value={cost.persons?.toString() ?? ""}
                            onChange={(e) => updateCostPersons(cost.id, Number(e.target.value))}
                            className={rowInputClass}
                          />
                        ) : (
                          <div className="text-center text-muted-foreground">—</div>
                        )}
                      </div>
                      <div className="hidden md:block">
                        {cost.calculationType === "per_ticket_sector" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full justify-between ${rowInputClass}`}
                                disabled={!ticketSectors || ticketSectors.length === 0}
                              >
                                {ticketSectors && ticketSectors.length > 0
                                  ? cost.sectors && cost.sectors.length > 0
                                    ? `${cost.sectors.length} sel.`
                                    : "Sel."
                                  : "N/A"}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {ticketSectors && ticketSectors.length > 0 ? (
                                ticketSectors.map((sector) => (
                                  <DropdownMenuCheckboxItem
                                    key={sector.name}
                                    checked={cost.sectors?.includes(sector.name) ?? false}
                                    onCheckedChange={(checked) =>
                                      updateCostSectors(cost.id, sector.name, checked as boolean)
                                    }
                                  >
                                    {sector.name}
                                  </DropdownMenuCheckboxItem>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-sm text-muted-foreground">
                                  Primero defina sectores en la pestaña "Entradas".
                                </div>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <div className="text-center text-muted-foreground">—</div>
                        )}
                      </div>
                      <div className="hidden md:block">
                        <Button
                          onClick={() => removeCost(cost.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed rounded-lg mt-4">
              <DollarSign className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No hay costos operativos personalizados</p>
              <p className="text-xs text-muted-foreground mt-1">Agregue costos utilizando el campo de arriba</p>
            </div>
          )}
        </div>
      </CardContent>
      {value.length > 0 && isAdmin && (
        <CardFooter className="border-t pt-4 flex justify-between">
          <span className="font-semibold">Total Costos Operativos Personalizados:</span>
          <Badge variant="secondary" className="text-lg px-3 py-1 h-auto">
            ${totalCosts.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </Badge>
        </CardFooter>
      )}
    </Card>
  )
} 