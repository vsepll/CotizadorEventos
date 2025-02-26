"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';

interface GlobalCommission {
  name: string;
  percentage: number;
  isDefault: boolean;
}

interface GlobalFixedExpense {
  name: string;
  amount: number;
  isDefault: boolean;
}

export function GlobalSettingsForm() {
  const [commissions, setCommissions] = useState<GlobalCommission[]>([{
    name: '',
    percentage: 0,
    isDefault: false
  }]);

  const [fixedExpenses, setFixedExpenses] = useState<GlobalFixedExpense[]>([{
    name: '',
    amount: 0,
    isDefault: false
  }]);

  const addCommission = () => {
    setCommissions([...commissions, {
      name: '',
      percentage: 0,
      isDefault: false
    }]);
  };

  const removeCommission = (index: number) => {
    const newCommissions = commissions.filter((_, i) => i !== index);
    setCommissions(newCommissions);
  };

  const updateCommission = (
    index: number, 
    field: keyof GlobalCommission, 
    value: string | number | boolean
  ) => {
    const newCommissions = [...commissions];
    newCommissions[index][field] = value as never;
    setCommissions(newCommissions);
  };

  const addFixedExpense = () => {
    setFixedExpenses([...fixedExpenses, {
      name: '',
      amount: 0,
      isDefault: false
    }]);
  };

  const removeFixedExpense = (index: number) => {
    const newFixedExpenses = fixedExpenses.filter((_, i) => i !== index);
    setFixedExpenses(newFixedExpenses);
  };

  const updateFixedExpense = (
    index: number, 
    field: keyof GlobalFixedExpense, 
    value: string | number | boolean
  ) => {
    const newFixedExpenses = [...fixedExpenses];
    newFixedExpenses[index][field] = value as never;
    setFixedExpenses(newFixedExpenses);
  };

  const handleSave = async () => {
    try {
      // Guardar comisiones
      const commissionsResponse = await fetch('/api/global-settings/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commissions)
      });

      // Guardar gastos fijos
      const fixedExpensesResponse = await fetch('/api/global-settings/fixed-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fixedExpenses)
      });

      if (!commissionsResponse.ok || !fixedExpensesResponse.ok) {
        throw new Error('Error guardando configuraciones globales');
      }

      // Mostrar mensaje de éxito
      alert('Configuraciones guardadas exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al guardar las configuraciones');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comisiones Globales</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.map((commission, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 mb-2 items-center">
              <Input 
                placeholder="Nombre de Comisión" 
                value={commission.name}
                onChange={(e) => updateCommission(index, 'name', e.target.value)}
              />
              <Input 
                type="number" 
                placeholder="Porcentaje" 
                value={commission.percentage}
                onChange={(e) => updateCommission(index, 'percentage', Number(e.target.value))}
              />
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={commission.isDefault}
                  onCheckedChange={(checked) => updateCommission(index, 'isDefault', !!checked)}
                />
                <Label>Establecer como Default</Label>
                {commissions.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeCommission(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button 
            onClick={addCommission} 
            variant="outline" 
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" /> Añadir Comisión
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos Fijos Globales</CardTitle>
        </CardHeader>
        <CardContent>
          {fixedExpenses.map((expense, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 mb-2 items-center">
              <Input 
                placeholder="Nombre del Gasto" 
                value={expense.name}
                onChange={(e) => updateFixedExpense(index, 'name', e.target.value)}
              />
              <Input 
                type="number" 
                placeholder="Monto" 
                value={expense.amount}
                onChange={(e) => updateFixedExpense(index, 'amount', Number(e.target.value))}
              />
              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={expense.isDefault}
                  onCheckedChange={(checked) => updateFixedExpense(index, 'isDefault', !!checked)}
                />
                <Label>Establecer como Default</Label>
                {fixedExpenses.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeFixedExpense(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button 
            onClick={addFixedExpense} 
            variant="outline" 
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" /> Añadir Gasto Fijo
          </Button>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSave} 
        className="w-full"
      >
        Guardar Configuraciones Globales
      </Button>
    </div>
  );
} 