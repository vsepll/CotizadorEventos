"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

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
}

export function ParameterForm() {
  const { toast } = useToast()
  const [parameters, setParameters] = useState<GlobalParameters>({
    defaultPlatformFee: 5,
    defaultTicketingFee: 3,
    defaultAdditionalServicesFee: 2,
    defaultCreditCardFee: 3.67,
    defaultDebitCardFee: 0.8,
    defaultCashFee: 0.5,
    defaultCredentialsCost: 216408,
    defaultSupervisorsCost: 60000,
    defaultOperatorsCost: 10000,
    defaultMobilityCost: 25000,
    palco4FeePerTicket: 180, // 0.15 * 1200
    lineCostPercentage: 0.41,
    ticketingCostPerTicket: 5,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchParameters = async () => {
      try {
        const response = await fetch("/api/admin/parameters")
        if (!response.ok) {
          throw new Error("Failed to fetch parameters")
        }
        const data = await response.json()
        setParameters(data)
      } catch (error) {
        console.error("Error fetching parameters:", error)
        toast({
          title: "Error",
          description: "Failed to load parameters. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchParameters()
  }, [toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setParameters((prev) => ({ ...prev, [name]: Number.parseFloat(value) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/parameters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parameters),
      })

      if (!response.ok) {
        throw new Error("Failed to update parameters")
      }

      toast({
        title: "Success",
        description: "Parameters updated successfully",
      })
    } catch (error) {
      console.error("Error updating parameters:", error)
      toast({
        title: "Error",
        description: "Failed to update parameters. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="defaultPlatformFee">Default Platform Fee (%)</Label>
          <Input
            id="defaultPlatformFee"
            name="defaultPlatformFee"
            type="number"
            value={parameters.defaultPlatformFee}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultTicketingFee">Default Ticketing Fee (%)</Label>
          <Input
            id="defaultTicketingFee"
            name="defaultTicketingFee"
            type="number"
            value={parameters.defaultTicketingFee}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultAdditionalServicesFee">Default Additional Services Fee (%)</Label>
          <Input
            id="defaultAdditionalServicesFee"
            name="defaultAdditionalServicesFee"
            type="number"
            value={parameters.defaultAdditionalServicesFee}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultCreditCardFee">Default Credit Card Fee (%)</Label>
          <Input
            id="defaultCreditCardFee"
            name="defaultCreditCardFee"
            type="number"
            value={parameters.defaultCreditCardFee}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultDebitCardFee">Default Debit Card Fee (%)</Label>
          <Input
            id="defaultDebitCardFee"
            name="defaultDebitCardFee"
            type="number"
            value={parameters.defaultDebitCardFee}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultCashFee">Default Cash Fee (%)</Label>
          <Input
            id="defaultCashFee"
            name="defaultCashFee"
            type="number"
            value={parameters.defaultCashFee}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultCredentialsCost">Default Credentials Cost</Label>
          <Input
            id="defaultCredentialsCost"
            name="defaultCredentialsCost"
            type="number"
            value={parameters.defaultCredentialsCost}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultSupervisorsCost">Default Supervisors Cost</Label>
          <Input
            id="defaultSupervisorsCost"
            name="defaultSupervisorsCost"
            type="number"
            value={parameters.defaultSupervisorsCost}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultOperatorsCost">Default Operators Cost</Label>
          <Input
            id="defaultOperatorsCost"
            name="defaultOperatorsCost"
            type="number"
            value={parameters.defaultOperatorsCost}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultMobilityCost">Default Mobility Cost</Label>
          <Input
            id="defaultMobilityCost"
            name="defaultMobilityCost"
            type="number"
            value={parameters.defaultMobilityCost}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="palco4FeePerTicket">Palco 4 Fee Per Ticket</Label>
          <Input
            id="palco4FeePerTicket"
            name="palco4FeePerTicket"
            type="number"
            value={parameters.palco4FeePerTicket}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lineCostPercentage">Line Cost Percentage (%)</Label>
          <Input
            id="lineCostPercentage"
            name="lineCostPercentage"
            type="number"
            value={parameters.lineCostPercentage}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ticketingCostPerTicket">Ticketing Cost Per Ticket</Label>
          <Input
            id="ticketingCostPerTicket"
            name="ticketingCostPerTicket"
            type="number"
            value={parameters.ticketingCostPerTicket}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Updating..." : "Update Parameters"}
      </Button>
    </form>
  )
}

