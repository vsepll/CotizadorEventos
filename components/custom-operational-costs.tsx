import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

  const addCustomCost = () => {
    if (!newCostName.trim()) return

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

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Costos Operativos Personalizados</CardTitle>
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
                onChange={(e) => setNewCostName(e.target.value)}
                placeholder="Nombre del nuevo costo"
              />
            </div>
            <Button
              onClick={addCustomCost}
              variant="outline"
              size="icon"
              className="h-10 w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Lista de costos personalizados */}
          <div className="space-y-2">
            {value.map((cost) => (
              <div key={cost.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <Label>{cost.name}</Label>
                  <Input
                    type="number"
                    value={cost.amount.toString()}
                    onChange={(e) => updateCostAmount(cost.id, Number(e.target.value))}
                    placeholder="Monto"
                  />
                </div>
                <Button
                  onClick={() => removeCost(cost.id)}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Total de costos personalizados */}
          {value.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Costos Personalizados:</span>
                <span className="text-lg font-bold">
                  ${value.reduce((sum, cost) => sum + cost.amount, 0).toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 