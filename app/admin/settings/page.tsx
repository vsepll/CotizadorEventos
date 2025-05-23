"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Plus, Settings2, Users } from "lucide-react"

interface GlobalParameters {
  defaultPlatformFee: number
  defaultTicketingFee: number
  defaultAdditionalServicesFee: number
  defaultCreditCardFee: number
  defaultDebitCardFee: number
  defaultCashFee: number
  defaultCredentialsCost: number
  defaultSupervisorsCost: number
  defaultOperatorsCost: number
  defaultMobilityCost: number
  palco4FeePerTicket: number
  lineCostPercentage: number
  ticketingCostPerTicket: number
  fuelCostPerLiter: number
  kmPerLiter: number
  monthlyFixedCosts?: number
}

interface EmployeeType {
  id: string
  name: string
  isOperator: boolean
  costPerDay: number
  createdAt: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("global")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [globalParameters, setGlobalParameters] = useState<GlobalParameters | null>(null)
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([])
  const [newEmployeeType, setNewEmployeeType] = useState({
    name: "",
    isOperator: true,
    costPerDay: 0
  })

  // Estado para la carga de Excel de costos operativos / servicios adicionales
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [isUploadingExcel, setIsUploadingExcel] = useState(false)

  // Proteger la ruta
  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.replace("/login")
      return;
    }
    
    if (session?.user?.role !== "ADMIN") {
      router.replace("/dashboard")
      return;
    }
  }, [status, session, router])

  // Cargar parámetros globales
  useEffect(() => {
    const fetchGlobalParameters = async () => {
      try {
        const response = await fetch("/api/admin/parameters")
        if (!response.ok) throw new Error("Failed to fetch parameters")
        const data = await response.json()
        
        // Intentar obtener los costos fijos mensuales desde localStorage
        const savedMonthlyCosts = localStorage.getItem('monthlyFixedCosts')
        
        setGlobalParameters({
          ...data,
          // Si existe en localStorage, usar ese valor; de lo contrario, usar 0
          monthlyFixedCosts: savedMonthlyCosts ? Number(savedMonthlyCosts) : 0
        })
      } catch (error) {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los parámetros globales",
          variant: "destructive",
        })
      }
    }

    fetchGlobalParameters()
  }, [toast])

  // Cargar tipos de empleados
  useEffect(() => {
    const fetchEmployeeTypes = async () => {
      try {
        const response = await fetch("/api/employee-types")
        if (!response.ok) throw new Error("Failed to fetch employee types")
        const data = await response.json()
        setEmployeeTypes(data)
      } catch (error) {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los tipos de empleados",
          variant: "destructive",
        })
      }
    }

    fetchEmployeeTypes()
  }, [toast])

  const handleGlobalParametersSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch("/api/admin/parameters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(globalParameters),
      })

      if (!response.ok) throw new Error("Failed to update parameters")

      toast({
        title: "Éxito",
        description: "Parámetros globales actualizados correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar los parámetros globales",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateEmployeeType = async () => {
    // Validar que el nombre no esté vacío
    if (!newEmployeeType.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del tipo de empleado no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    // Validar que el costo por día sea un número válido mayor a 0
    if (isNaN(Number(newEmployeeType.costPerDay)) || Number(newEmployeeType.costPerDay) <= 0) {
      toast({
        title: "Error",
        description: "El costo por día debe ser un número mayor a 0",
        variant: "destructive",
      });
      return;
    }

    try {
      // Mostrar una notificación de carga
      toast({
        title: "Procesando",
        description: "Creando tipo de empleado...",
      });

      // Asegurarse de que costPerDay sea un número
      const employeeTypeData = {
        ...newEmployeeType,
        costPerDay: Number(newEmployeeType.costPerDay)
      };

      console.log('Sending data:', employeeTypeData);

      const response = await fetch("/api/employee-types", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(employeeTypeData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || data.details || "Failed to create employee type");
      }

      // Actualizar la lista de tipos de empleados
      setEmployeeTypes(prev => [...prev, data]);
      
      // Reiniciar el formulario
      setNewEmployeeType({ name: "", isOperator: true, costPerDay: 0 });

      toast({
        title: "Éxito",
        description: "Tipo de empleado creado correctamente",
      });
    } catch (error) {
      console.error("Error creating employee type:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el tipo de empleado",
        variant: "destructive",
      });
    }
  }

  const handleDeleteEmployeeType = async (id: string) => {
    try {
      const response = await fetch(`/api/employee-types?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete employee type")

      setEmployeeTypes(prev => prev.filter(type => type.id !== id))

      toast({
        title: "Éxito",
        description: "Tipo de empleado eliminado correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el tipo de empleado",
        variant: "destructive",
      })
    }
  }

  const handleExcelUpload = async () => {
    if (!excelFile) {
      toast({
        title: "Archivo no seleccionado",
        description: "Por favor seleccione un archivo Excel (.xlsx) antes de continuar.",
        variant: "destructive",
      })
      return
    }

    setIsUploadingExcel(true)
    try {
      const formData = new FormData()
      formData.append("file", excelFile)

      const response = await fetch("/api/admin/operational-costs/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Error al subir el archivo")

      toast({
        title: "Éxito",
        description: "Archivo cargado y parámetros actualizados correctamente.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo procesar el archivo.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingExcel(false)
      setExcelFile(null)
    }
  }

  if (status === "loading" || !session) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Sistema</CardTitle>
          <CardDescription>
            Administre los parámetros globales y tipos de empleados del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="global" className="flex items-center space-x-2">
                <Settings2 className="h-4 w-4" />
                <span>Parámetros Globales</span>
              </TabsTrigger>
              <TabsTrigger value="employees" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Tipos de Empleados</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="global">
              {globalParameters && (
                <>
                  <form onSubmit={handleGlobalParametersSubmit} className="space-y-6">
                    <div className="space-y-6">
                      {/* Movilidad */}
                      <div className="space-y-4">
                        <h3 className="font-medium">Movilidad</h3>
                        <div>
                          <Label htmlFor="fuelCostPerLiter">Costo de Combustible por Litro</Label>
                          <Input
                            id="fuelCostPerLiter"
                            type="number"
                            value={globalParameters.fuelCostPerLiter}
                            onChange={(e) => setGlobalParameters(prev => ({
                              ...prev!,
                              fuelCostPerLiter: Number(e.target.value)
                            }))}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label htmlFor="kmPerLiter">Kilómetros por Litro</Label>
                          <Input
                            id="kmPerLiter"
                            type="number"
                            value={globalParameters.kmPerLiter}
                            onChange={(e) => setGlobalParameters(prev => ({
                              ...prev!,
                              kmPerLiter: Number(e.target.value)
                            }))}
                            min="1"
                            step="0.1"
                          />
                        </div>
                      </div>

                      {/* Métodos de Pago */}
                      <div className="space-y-4">
                        <h3 className="font-medium">Comisiones de Métodos de Pago (%)</h3>
                        <div>
                          <Label htmlFor="defaultCreditCardFee">Tarjeta de Crédito</Label>
                          <Input
                            id="defaultCreditCardFee"
                            type="number"
                            value={globalParameters.defaultCreditCardFee}
                            onChange={(e) => setGlobalParameters(prev => ({
                              ...prev!,
                              defaultCreditCardFee: Number(e.target.value)
                            }))}
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label htmlFor="defaultDebitCardFee">Tarjeta de Débito</Label>
                          <Input
                            id="defaultDebitCardFee"
                            type="number"
                            value={globalParameters.defaultDebitCardFee}
                            onChange={(e) => setGlobalParameters(prev => ({
                              ...prev!,
                              defaultDebitCardFee: Number(e.target.value)
                            }))}
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label htmlFor="defaultCashFee">Efectivo</Label>
                          <Input
                            id="defaultCashFee"
                            type="number"
                            value={globalParameters.defaultCashFee}
                            onChange={(e) => setGlobalParameters(prev => ({
                              ...prev!,
                              defaultCashFee: Number(e.target.value)
                            }))}
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 mt-8">
                      <Card>
                        <CardHeader>
                          <CardTitle>Costos Fijos Mensuales</CardTitle>
                          <CardDescription>
                            Configura los costos fijos mensuales para el cálculo de rentabilidad global
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col space-y-4">
                            <div>
                              <Label htmlFor="monthlyFixedCosts">Costos Fijos Mensuales</Label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  id="monthlyFixedCosts"
                                  type="number"
                                  value={globalParameters?.monthlyFixedCosts || 0}
                                  onChange={(e) => {
                                    // Actualizar el estado local
                                    setGlobalParameters(prev => ({
                                      ...prev!,
                                      monthlyFixedCosts: Number(e.target.value)
                                    }))
                                  }}
                                  min="0"
                                  step="1000"
                                />
                                <Button 
                                  onClick={async () => {
                                    try {
                                      // Actualizar solo los costos fijos mensuales mediante un endpoint separado
                                      const response = await fetch("/api/global-monthly-costs", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ 
                                          value: globalParameters?.monthlyFixedCosts || 0 
                                        }),
                                      })

                                      if (!response.ok) throw new Error("Failed to update monthly fixed costs")

                                      // Mostrar mensaje de éxito
                                      toast({
                                        title: "Éxito",
                                        description: "Costos fijos mensuales actualizados correctamente"
                                      })

                                      // Guardar en localStorage para persistencia local
                                      localStorage.setItem('monthlyFixedCosts', String(globalParameters?.monthlyFixedCosts || 0))
                                    } catch (error) {
                                      console.error("Error:", error)
                                      toast({
                                        title: "Error",
                                        description: "No se pudieron actualizar los costos fijos mensuales",
                                        variant: "destructive",
                                      })
                                    }
                                  }}
                                >
                                  Guardar
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">
                                Este valor se utiliza para el cálculo de rentabilidad global de la empresa
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Carga de Excel para definir costos operativos y servicios adicionales */}
                    <Card className="mt-8">
                      <CardHeader>
                        <CardTitle>Cargar costos operativos / servicios adicionales desde Excel</CardTitle>
                        <CardDescription>
                          El archivo debe contener dos hojas: <strong>OperationalCosts</strong> y <strong>AdditionalServices</strong> con las columnas indicadas en la documentación.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4">
                        <Input
                          type="file"
                          accept=".xlsx, .xls"
                          onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                        />
                        <Button type="button" onClick={handleExcelUpload} disabled={isUploadingExcel}>
                          {isUploadingExcel ? (
                            <>
                              <span className="animate-spin mr-2">⏳</span>Cargando...
                            </>
                          ) : (
                            "Subir y Procesar"
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Botón para guardar todos los parámetros globales */}
                    <Button type="submit" disabled={isSaving} className="w-full md:w-auto">
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar Cambios"
                      )}
                    </Button>
                  </form>
                </>
              )}
            </TabsContent>

            <TabsContent value="employees">
              <div className="space-y-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Tipo de Empleado
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Tipo de Empleado</DialogTitle>
                      <DialogDescription>
                        Complete los detalles para el nuevo tipo de empleado
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                          id="name"
                          value={newEmployeeType.name}
                          onChange={(e) => setNewEmployeeType(prev => ({
                            ...prev,
                            name: e.target.value
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="costPerDay">Costo por Día</Label>
                        <Input
                          id="costPerDay"
                          type="number"
                          value={newEmployeeType.costPerDay}
                          onChange={(e) => setNewEmployeeType(prev => ({
                            ...prev,
                            costPerDay: Number(e.target.value)
                          }))}
                          min="0"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateEmployeeType}>Crear</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Costo por Día</TableHead>
                      <TableHead>Fecha de Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell>{type.name}</TableCell>
                        <TableCell>{type.costPerDay}</TableCell>
                        <TableCell>{new Date(type.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteEmployeeType(type.id)}
                          >
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 