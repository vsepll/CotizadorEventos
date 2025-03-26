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
        setGlobalParameters(data)
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
                <form onSubmit={handleGlobalParametersSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Comisiones */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Comisiones por Defecto</h3>
                      <div>
                        <Label htmlFor="defaultPlatformFee">Comisión de Plataforma (%)</Label>
                        <Input
                          id="defaultPlatformFee"
                          type="number"
                          value={globalParameters.defaultPlatformFee}
                          onChange={(e) => setGlobalParameters(prev => ({
                            ...prev!,
                            defaultPlatformFee: Number(e.target.value)
                          }))}
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="defaultTicketingFee">Cargo por Servicio (%)</Label>
                        <Input
                          id="defaultTicketingFee"
                          type="number"
                          value={globalParameters.defaultTicketingFee}
                          onChange={(e) => setGlobalParameters(prev => ({
                            ...prev!,
                            defaultTicketingFee: Number(e.target.value)
                          }))}
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="defaultAdditionalServicesFee">Servicios Adicionales (%)</Label>
                        <Input
                          id="defaultAdditionalServicesFee"
                          type="number"
                          value={globalParameters.defaultAdditionalServicesFee}
                          onChange={(e) => setGlobalParameters(prev => ({
                            ...prev!,
                            defaultAdditionalServicesFee: Number(e.target.value)
                          }))}
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>

                    {/* Medios de Pago */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Medios de Pago</h3>
                      <div>
                        <Label htmlFor="defaultCreditCardFee">Tarjeta de Crédito (%)</Label>
                        <Input
                          id="defaultCreditCardFee"
                          type="number"
                          value={globalParameters.defaultCreditCardFee}
                          onChange={(e) => setGlobalParameters(prev => ({
                            ...prev!,
                            defaultCreditCardFee: Number(e.target.value)
                          }))}
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="defaultDebitCardFee">Tarjeta de Débito (%)</Label>
                        <Input
                          id="defaultDebitCardFee"
                          type="number"
                          value={globalParameters.defaultDebitCardFee}
                          onChange={(e) => setGlobalParameters(prev => ({
                            ...prev!,
                            defaultDebitCardFee: Number(e.target.value)
                          }))}
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="defaultCashFee">Efectivo (%)</Label>
                        <Input
                          id="defaultCashFee"
                          type="number"
                          value={globalParameters.defaultCashFee}
                          onChange={(e) => setGlobalParameters(prev => ({
                            ...prev!,
                            defaultCashFee: Number(e.target.value)
                          }))}
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>

                    {/* Costos Operativos */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Costos Operativos</h3>
                      <div>
                        <Label htmlFor="defaultCredentialsCost">Credenciales</Label>
                        <Input
                          id="defaultCredentialsCost"
                          type="number"
                          value={globalParameters.defaultCredentialsCost}
                          onChange={(e) => setGlobalParameters(prev => ({
                            ...prev!,
                            defaultCredentialsCost: Number(e.target.value)
                          }))}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="defaultSupervisorsCost">Supervisores</Label>
                        <Input
                          id="defaultSupervisorsCost"
                          type="number"
                          value={globalParameters.defaultSupervisorsCost}
                          onChange={(e) => setGlobalParameters(prev => ({
                            ...prev!,
                            defaultSupervisorsCost: Number(e.target.value)
                          }))}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="defaultOperatorsCost">Operadores</Label>
                        <Input
                          id="defaultOperatorsCost"
                          type="number"
                          value={globalParameters.defaultOperatorsCost}
                          onChange={(e) => setGlobalParameters(prev => ({
                            ...prev!,
                            defaultOperatorsCost: Number(e.target.value)
                          }))}
                          min="0"
                        />
                      </div>
                    </div>

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

                    {/* Otros Costos */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Otros Costos</h3>
                      <div>
                        <Label htmlFor="palco4FeePerTicket">Costo por Ticket Palco 4</Label>
                        <Input
                          id="palco4FeePerTicket"
                          type="number"
                          value={globalParameters.palco4FeePerTicket}
                          onChange={(e) => setGlobalParameters(prev => ({
                            ...prev!,
                            palco4FeePerTicket: Number(e.target.value)
                          }))}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lineCostPercentage">Costo de Línea (%)</Label>
                        <Input
                          id="lineCostPercentage"
                          type="number"
                          value={globalParameters.lineCostPercentage}
                          onChange={(e) => setGlobalParameters(prev => ({
                            ...prev!,
                            lineCostPercentage: Number(e.target.value)
                          }))}
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ticketingCostPerTicket">Costo de Ticketing por Ticket</Label>
                        <Input
                          id="ticketingCostPerTicket"
                          type="number"
                          value={globalParameters.ticketingCostPerTicket}
                          onChange={(e) => setGlobalParameters(prev => ({
                            ...prev!,
                            ticketingCostPerTicket: Number(e.target.value)
                          }))}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={isSaving}>
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