"use client"

import * as React from "react";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketVariation {
  name: string;
  price: number;
  quantity: number;
  serviceCharge: number;
  serviceChargeType: "fixed" | "percentage";
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
      serviceCharge: number;
      serviceChargeType: "fixed" | "percentage";
    }>;
  }>;
  onChange?: (sectors: Array<{
    name: string;
    variations: Array<{
      name: string;
      price: number;
      quantity: number;
      serviceCharge: number;
      serviceChargeType: "fixed" | "percentage";
    }>;
  }>) => void;
}

export function TicketSectorForm({ initialSectors, onChange }: TicketSectorFormProps) {
  const [sectors, setSectors] = React.useState<TicketSector[]>(() => {
    // Inicialización inteligente basada en si hay datos iniciales
    if (initialSectors && initialSectors.length > 0) {
      return initialSectors;
    }
    return [{
      name: '',
      variations: [{ 
        name: '', 
        price: 0, 
        quantity: 0,
        serviceCharge: 0,
        serviceChargeType: "fixed"
      }]
    }];
  });

  // Actualizar sectores cuando cambien los initialSectors (solo para edición)
  React.useEffect(() => {
    if (initialSectors && initialSectors.length > 0) {
      // Solo actualizar si hay datos reales (caso de edición)
      setSectors(initialSectors);
    }
  }, [initialSectors]);
  
  const [isAddVariationDialogOpen, setIsAddVariationDialogOpen] = React.useState(false);
  const [currentSectorIndex, setCurrentSectorIndex] = React.useState<number | null>(null);
  const [newVariation, setNewVariation] = React.useState<TicketVariation>({
    name: '',
    price: 0,
    quantity: 0,
    serviceCharge: 0,
    serviceChargeType: "fixed"
  });



  // Funciones de validación simplificadas (sin actualización de estado automática)
  const hasSectorNameError = (sectorIndex: number) => {
    const sector = sectors[sectorIndex];
    return !sector || !sector.name.trim();
  };

  const hasSectorVariationsError = (sectorIndex: number) => {
    const sector = sectors[sectorIndex];
    if (!sector || !sector.variations || sector.variations.length === 0) return true;
    
    return !sector.variations.some(variation => 
      variation.name.trim() && variation.price > 0 && variation.quantity > 0
    );
  };

  const hasVariationError = (sectorIndex: number, variationIndex: number, field: 'name' | 'price' | 'quantity') => {
    const sector = sectors[sectorIndex];
    if (!sector || !sector.variations || !sector.variations[variationIndex]) return false;
    
    const variation = sector.variations[variationIndex];
    switch (field) {
      case 'name':
        return !variation.name.trim();
      case 'price':
        return variation.price <= 0;
      case 'quantity':
        return variation.quantity <= 0;
      default:
        return false;
    }
  };

  // Enviar cambios al componente padre cuando cambian los sectores
  React.useEffect(() => {
    if (onChange) {
      onChange(sectors);
    }
  }, [sectors]); // Solo depender de sectors, no de onChange

  const addSector = () => {
    setSectors([...sectors, {
      name: '',
      variations: [{ 
        name: '', 
        price: 0, 
        quantity: 0,
        serviceCharge: 0,
        serviceChargeType: "fixed"
      }]
    }]);
  };

  const removeSector = (sectorIndex: number) => {
    const newSectors = sectors.filter((_, index) => index !== sectorIndex);
    setSectors(newSectors);
  };

  const addVariation = (sectorIndex: number) => {
    setCurrentSectorIndex(sectorIndex);
    setNewVariation({
      name: '',
      price: 0,
      quantity: 0,
      serviceCharge: 0,
      serviceChargeType: "fixed"
    });
    setIsAddVariationDialogOpen(true);
  };

  const handleAddVariation = () => {
    if (currentSectorIndex === null) return;
    
    const newSectors = [...sectors];
    newSectors[currentSectorIndex].variations.push(newVariation);
    setSectors(newSectors);
    setIsAddVariationDialogOpen(false);
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
        <Card key={sectorIndex} className="w-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor={`sector-name-${sectorIndex}`} className={hasSectorNameError(sectorIndex) ? "text-destructive" : ""}>
                  Nombre del Sector
                  {hasSectorNameError(sectorIndex) && <span className="text-sm text-destructive ml-2">(Requerido)</span>}
                </Label>
                <Input
                  id={`sector-name-${sectorIndex}`}
                  value={sector.name}
                  onChange={(e) => updateSector(sectorIndex, 'name', e.target.value)}
                  placeholder="Ej: VIP, Platea, Campo"
                  className={hasSectorNameError(sectorIndex) ? "border-destructive" : ""}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSector(sectorIndex)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Eliminar sector</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-2 text-sm font-medium text-muted-foreground mb-1">
                <div>Variación</div>
                <div>Precio</div>
                <div>Cantidad</div>
                <div>Cargo de Servicio</div>
                <div></div>
              </div>
              
              {hasSectorVariationsError(sectorIndex) && (
                <div className="text-sm text-destructive mb-2">
                  Debe tener al menos una variación válida
                </div>
              )}
              
              {sector.variations.map((variation, variationIndex) => (
                <div key={variationIndex} className="grid grid-cols-5 gap-2 items-end">
                  <div>
                    <Input
                      value={variation.name}
                      onChange={(e) => updateVariation(sectorIndex, variationIndex, 'name', e.target.value)}
                      placeholder="Ej: Adulto, Niño"
                      className={hasVariationError(sectorIndex, variationIndex, 'name') ? "border-destructive" : ""}
                    />
                    {hasVariationError(sectorIndex, variationIndex, 'name') && (
                      <span className="text-xs text-destructive">Requerido</span>
                    )}
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={variation.price}
                      onChange={(e) => updateVariation(sectorIndex, variationIndex, 'price', Number(e.target.value))}
                      placeholder="Precio"
                      className={hasVariationError(sectorIndex, variationIndex, 'price') ? "border-destructive" : ""}
                    />
                    {hasVariationError(sectorIndex, variationIndex, 'price') && (
                      <span className="text-xs text-destructive">Debe ser mayor a 0</span>
                    )}
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={variation.quantity}
                      onChange={(e) => updateVariation(sectorIndex, variationIndex, 'quantity', Number(e.target.value))}
                      placeholder="Cantidad"
                      className={hasVariationError(sectorIndex, variationIndex, 'quantity') ? "border-destructive" : ""}
                    />
                    {hasVariationError(sectorIndex, variationIndex, 'quantity') && (
                      <span className="text-xs text-destructive">Debe ser mayor a 0</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={variation.serviceCharge}
                      onChange={(e) => updateVariation(sectorIndex, variationIndex, 'serviceCharge', Number(e.target.value))}
                      placeholder="Cargo"
                    />
                    <Select
                      value={variation.serviceChargeType}
                      onValueChange={(value: "fixed" | "percentage") => updateVariation(sectorIndex, variationIndex, 'serviceChargeType', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">$</SelectItem>
                        <SelectItem value="percentage">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariation(sectorIndex, variationIndex)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={sector.variations.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar variación</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => addVariation(sectorIndex)}
              className="mt-4 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Agregar Variación
            </Button>
          </CardContent>
        </Card>
      ))}
      
      <Button
        variant="outline"
        onClick={addSector}
        className="flex items-center gap-1"
      >
        <Plus className="h-4 w-4" />
        Agregar Sector
      </Button>
      
      <Dialog open={isAddVariationDialogOpen} onOpenChange={setIsAddVariationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agregar Variación de Ticket</DialogTitle>
            <DialogDescription>
              Crea una nueva variación de ticket para este sector.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="variation-name">Nombre de la Variación</Label>
              <Input
                id="variation-name"
                placeholder="Ej: Adulto, Niño, Jubilado"
                value={newVariation.name}
                onChange={(e) => setNewVariation({ ...newVariation, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="variation-price">Precio ($)</Label>
              <Input
                id="variation-price"
                type="number"
                placeholder="Ej: 1000"
                value={newVariation.price.toString()}
                onChange={(e) => setNewVariation({ ...newVariation, price: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="variation-quantity">Cantidad</Label>
              <Input
                id="variation-quantity"
                type="number"
                placeholder="Ej: 100"
                value={newVariation.quantity.toString()}
                onChange={(e) => setNewVariation({ ...newVariation, quantity: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="variation-service-charge">Cargo de Servicio</Label>
              <div className="flex gap-2">
                <Input
                  id="variation-service-charge"
                  type="number"
                  placeholder="Ej: 10"
                  value={newVariation.serviceCharge.toString()}
                  onChange={(e) => setNewVariation({ ...newVariation, serviceCharge: Number(e.target.value) })}
                />
                <Select
                  value={newVariation.serviceChargeType}
                  onValueChange={(value: "fixed" | "percentage") => setNewVariation({ ...newVariation, serviceChargeType: value })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">$</SelectItem>
                    <SelectItem value="percentage">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" onClick={handleAddVariation}>
              Agregar Variación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 