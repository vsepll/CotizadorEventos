"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CustomCost {
  id: string
  name: string
  amount: number
}

interface CustomOperationalCostsProps {
  value: CustomCost[]
  onChange: (costs: CustomCost[]) => void
}

export function CustomOperationalCosts({ value = [], onChange }: CustomOperationalCostsProps) {
  const [newCostName, setNewCostName] = useState("")
  const [formError, setFormError] = useState("")

  const addCustomCost = () => {
    if (!newCostName.trim()) {
      setFormError("Por favor ingrese un nombre para el costo")
      return
    }

    setFormError("")
    const newCost: CustomCost = {
      id: crypto.randomUUID(),
      name: newCostName.trim(),
      amount: 0
    }

    onChange([...value, newCost])
    setNewCostName("")
  }

  const updateCostAmount = (id: string, amount: number) => {
    const updatedCosts = value.map(cost => 
      cost.id === id ? { ...cost, amount } : cost
    )
    onChange(updatedCosts)
  }

  const removeCost = (id: string) => {
    const updatedCosts = value.filter(cost => cost.id !== id)
    onChange(updatedCosts)
  }

  const totalCosts = value.reduce((sum, cost) => sum + cost.amount, 0)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Costos Operativos Personalizados
        </CardTitle>
        <CardDescription>
          Agregue costos operativos adicionales específicos para este evento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Agregar nuevo costo */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="newCostName">Nuevo Concepto</Label>
              <Input
                id="newCostName"
                value={newCostName}
                onChange={(e) => {
                  setNewCostName(e.target.value)
                  if (formError) setFormError("")
                }}
                placeholder="Nombre del nuevo costo"
                className={formError ? "border-destructive" : ""}
              />
              {formError && <p className="text-sm text-destructive mt-1">{formError}</p>}
            </div>
            <Button
              onClick={addCustomCost}
              variant="outline"
              size="icon"
              className="h-10 w-10"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Agregar costo</span>
            </Button>
          </div>

          {/* Lista de costos personalizados */}
          {value.length > 0 ? (
            <div className="space-y-3 mt-4">
              {value.map((cost) => (
                <div 
                  key={cost.id} 
                  className="flex items-center gap-3 p-3 border rounded-lg transition-colors hover:bg-muted/30"
                >
                  <div className="flex-1">
                    <p className="font-medium">{cost.name}</p>
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      value={cost.amount.toString()}
                      onChange={(e) => updateCostAmount(cost.id, Number(e.target.value))}
                      placeholder="Monto"
                      className="text-right"
                    />
                  </div>
                  <Button
                    onClick={() => removeCost(cost.id)}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Eliminar costo</span>
                  </Button>
                </div>
              ))}
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
      {value.length > 0 && (
        <CardFooter className="border-t pt-4 flex justify-between">
          <span className="font-semibold">Total Costos Personalizados:</span>
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