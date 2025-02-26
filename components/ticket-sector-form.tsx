"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

interface TicketVariation {
  name: string;
  price: number;
  quantity: number;
}

interface TicketSector {
  name: string;
  estimatedSales: number;
  variations: TicketVariation[];
}

export function TicketSectorForm() {
  const [sectors, setSectors] = useState<TicketSector[]>([{
    name: '',
    estimatedSales: 0,
    variations: [{ name: '', price: 0, quantity: 0 }]
  }]);

  const addSector = () => {
    setSectors([...sectors, {
      name: '',
      estimatedSales: 0,
      variations: [{ name: '', price: 0, quantity: 0 }]
    }]);
  };

  const removeSector = (sectorIndex: number) => {
    const newSectors = sectors.filter((_, index) => index !== sectorIndex);
    setSectors(newSectors);
  };

  const addVariation = (sectorIndex: number) => {
    const newSectors = [...sectors];
    newSectors[sectorIndex].variations.push({ 
      name: '', 
      price: 0, 
      quantity: 0 
    });
    setSectors(newSectors);
  };

  const removeVariation = (sectorIndex: number, variationIndex: number) => {
    const newSectors = [...sectors];
    newSectors[sectorIndex].variations = newSectors[sectorIndex].variations
      .filter((_, index) => index !== variationIndex);
    setSectors(newSectors);
  };

  const updateSector = (sectorIndex: number, field: keyof TicketSector, value: string | number) => {
    const newSectors = [...sectors];
    newSectors[sectorIndex][field] = value as never;
    setSectors(newSectors);
  };

  const updateVariation = (
    sectorIndex: number, 
    variationIndex: number, 
    field: keyof TicketVariation, 
    value: string | number
  ) => {
    const newSectors = [...sectors];
    newSectors[sectorIndex].variations[variationIndex][field] = value as never;
    setSectors(newSectors);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Sectores y Variaciones de Tickets</h2>
      
      {sectors.map((sector, sectorIndex) => (
        <Card key={sectorIndex} className="mb-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sector {sectorIndex + 1}</CardTitle>
            {sectors.length > 1 && (
              <Button 
                variant="destructive" 
                size="icon" 
                onClick={() => removeSector(sectorIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Nombre del Sector</Label>
                <Input 
                  placeholder="Ej: Platea, Palco" 
                  value={sector.name}
                  onChange={(e) => updateSector(sectorIndex, 'name', e.target.value)}
                />
              </div>
              <div>
                <Label>Ventas Estimadas</Label>
                <Input 
                  type="number" 
                  placeholder="Monto estimado de ventas" 
                  value={sector.estimatedSales}
                  onChange={(e) => updateSector(sectorIndex, 'estimatedSales', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Variaciones de Tickets</h3>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => addVariation(sectorIndex)}
                >
                  <Plus className="h-4 w-4 mr-2" /> Añadir Variación
                </Button>
              </div>

              {sector.variations.map((variation, variationIndex) => (
                <div 
                  key={variationIndex} 
                  className="grid grid-cols-3 gap-2 items-center"
                >
                  <Input 
                    placeholder="Tipo (Ej: Socio)" 
                    value={variation.name}
                    onChange={(e) => updateVariation(
                      sectorIndex, 
                      variationIndex, 
                      'name', 
                      e.target.value
                    )}
                  />
                  <Input 
                    type="number" 
                    placeholder="Precio" 
                    value={variation.price}
                    onChange={(e) => updateVariation(
                      sectorIndex, 
                      variationIndex, 
                      'price', 
                      Number(e.target.value)
                    )}
                  />
                  <div className="flex items-center">
                    <Input 
                      type="number" 
                      placeholder="Cantidad" 
                      value={variation.quantity}
                      onChange={(e) => updateVariation(
                        sectorIndex, 
                        variationIndex, 
                        'quantity', 
                        Number(e.target.value)
                      )}
                    />
                    {sector.variations.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="ml-2"
                        onClick={() => removeVariation(sectorIndex, variationIndex)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button onClick={addSector} variant="secondary">
        <Plus className="h-4 w-4 mr-2" /> Añadir Sector
      </Button>
    </div>
  );
} 