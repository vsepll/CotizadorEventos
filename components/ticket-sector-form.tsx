"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TicketVariation {
  name: string;
  price: number;
  quantity: number;
}

interface TicketSector {
  name: string;
  variations: TicketVariation[];
}

interface TicketSectorFormProps {
  initialSectors?: Array<{
    name: string;
    variations: Array<{
      name: string;
      price: number;
      quantity: number;
    }>;
  }>;
  onChange?: (sectors: Array<{
    name: string;
    variations: Array<{
      name: string;
      price: number;
      quantity: number;
    }>;
  }>) => void;
}

export function TicketSectorForm({ initialSectors, onChange }: TicketSectorFormProps) {
  const [sectors, setSectors] = useState<TicketSector[]>(initialSectors || [{
    name: '',
    variations: [{ name: '', price: 0, quantity: 0 }]
  }]);

  const [validationErrors, setValidationErrors] = useState<{
    sectors: {
      nameError: boolean;
      variationsError: boolean;
      index: number;
    }[];
    variations: {
      nameError: boolean;
      priceError: boolean;
      quantityError: boolean;
      sectorIndex: number;
      variationIndex: number;
    }[];
  }>({
    sectors: [],
    variations: [],
  });

  // Validar los sectores y variaciones
  const validateSectors = () => {
    const sectorErrors: { nameError: boolean; variationsError: boolean; index: number }[] = [];
    const variationErrors: { 
      nameError: boolean; 
      priceError: boolean; 
      quantityError: boolean; 
      sectorIndex: number; 
      variationIndex: number 
    }[] = [];

    sectors.forEach((sector, sectorIndex) => {
      // Validar el nombre del sector
      if (!sector.name.trim()) {
        sectorErrors.push({
          nameError: true,
          variationsError: false,
          index: sectorIndex
        });
      }

      // Validar que haya al menos una variación válida
      let hasValidVariation = false;
      
      sector.variations.forEach((variation, variationIndex) => {
        const nameError = !variation.name.trim();
        const priceError = variation.price <= 0;
        const quantityError = variation.quantity <= 0;
        
        if (!nameError && !priceError && !quantityError) {
          hasValidVariation = true;
        }
        
        if (nameError || priceError || quantityError) {
          variationErrors.push({
            nameError,
            priceError,
            quantityError,
            sectorIndex,
            variationIndex
          });
        }
      });
      
      if (!hasValidVariation && sector.variations.length > 0) {
        sectorErrors.push({
          nameError: false,
          variationsError: true,
          index: sectorIndex
        });
      }
    });

    setValidationErrors({
      sectors: sectorErrors,
      variations: variationErrors
    });

    // Retornar true si no hay errores
    return sectorErrors.length === 0 && variationErrors.length === 0;
  };

  // Enviar cambios al componente padre cuando cambian los sectores
  useEffect(() => {
    if (onChange) {
      onChange(sectors);
    }
    
    // Validar los sectores cuando cambien
    validateSectors();
  }, [sectors, onChange]);

  // Verificar si un sector tiene error de nombre
  const hasSectorNameError = (sectorIndex: number) => {
    return validationErrors.sectors.some(
      error => error.index === sectorIndex && error.nameError
    );
  };

  // Verificar si un sector tiene error de variaciones
  const hasSectorVariationsError = (sectorIndex: number) => {
    return validationErrors.sectors.some(
      error => error.index === sectorIndex && error.variationsError
    );
  };

  // Verificar si una variación tiene errores
  const hasVariationError = (sectorIndex: number, variationIndex: number, field: 'name' | 'price' | 'quantity') => {
    return validationErrors.variations.some(
      error => 
        error.sectorIndex === sectorIndex && 
        error.variationIndex === variationIndex &&
        error[`${field}Error`]
    );
  };

  const addSector = () => {
    setSectors([...sectors, {
      name: '',
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
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Para poder calcular su cotización, debe definir al menos un sector con una variación de ticket válida (con nombre, precio y cantidad).
        </AlertDescription>
      </Alert>
      
      {sectors.map((sector, sectorIndex) => (
        <Card key={sectorIndex} className={`mb-4 ${hasSectorNameError(sectorIndex) || hasSectorVariationsError(sectorIndex) ? 'border-red-500' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sector {sectorIndex + 1}</CardTitle>
              {hasSectorNameError(sectorIndex) && (
                <CardDescription className="text-red-500">
                  Debe ingresar un nombre para este sector
                </CardDescription>
              )}
              {hasSectorVariationsError(sectorIndex) && (
                <CardDescription className="text-red-500">
                  Debe tener al menos una variación con nombre, precio y cantidad
                </CardDescription>
              )}
            </div>
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
            <div className="mb-4">
              <Label className={hasSectorNameError(sectorIndex) ? 'text-red-500' : ''}>
                Nombre del Sector *
              </Label>
              <Input 
                placeholder="Ej: Platea, Campo, VIP" 
                value={sector.name}
                onChange={(e) => updateSector(sectorIndex, 'name', e.target.value)}
                className={hasSectorNameError(sectorIndex) ? 'border-red-500' : ''}
              />
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
                  <div>
                    <Label className={hasVariationError(sectorIndex, variationIndex, 'name') ? 'text-red-500' : ''}>
                      Tipo *
                    </Label>
                    <Input 
                      placeholder="Tipo (Ej: General, Socio)" 
                      value={variation.name}
                      onChange={(e) => updateVariation(
                        sectorIndex, 
                        variationIndex, 
                        'name', 
                        e.target.value
                      )}
                      className={hasVariationError(sectorIndex, variationIndex, 'name') ? 'border-red-500' : ''}
                    />
                  </div>
                  <div>
                    <Label className={hasVariationError(sectorIndex, variationIndex, 'price') ? 'text-red-500' : ''}>
                      Precio *
                    </Label>
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
                      className={hasVariationError(sectorIndex, variationIndex, 'price') ? 'border-red-500' : ''}
                    />
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1">
                      <Label className={hasVariationError(sectorIndex, variationIndex, 'quantity') ? 'text-red-500' : ''}>
                        Cantidad *
                      </Label>
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
                        className={hasVariationError(sectorIndex, variationIndex, 'quantity') ? 'border-red-500' : ''}
                      />
                    </div>
                    {sector.variations.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="ml-2 mt-6"
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