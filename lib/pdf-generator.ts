import jsPDF from 'jspdf'
import 'jspdf-autotable'
import type { QuotationResults } from './calculations'

interface QuotationData extends QuotationResults {
  id: string
  name: string
  eventType: string
  totalAmount: number
  ticketPrice: number
  createdAt: string
  userId: string
}

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void
    lastAutoTable: {
      finalY: number
    }
  }
}

export function generateQuotationPDF(quotation: QuotationData) {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(20)
  doc.text('Cotización de Evento', 105, 15, { align: 'center' })
  
  // Event Information
  doc.setFontSize(12)
  doc.text(`Nombre del Evento: ${quotation.name}`, 20, 30)
  doc.text(`Tipo de Evento: ${quotation.eventType}`, 20, 40)
  doc.text(`Fecha de Creación: ${new Date(quotation.createdAt).toLocaleDateString()}`, 20, 50)
  
  // Revenue Details
  doc.setFontSize(16)
  doc.text('Detalles de Ingresos', 20, 70, { align: 'left' })
  doc.setFontSize(12)
  doc.autoTable({
    startY: 75,
    head: [['Concepto', 'Valor']],
    body: [
      ['Cantidad de Tickets', quotation.ticketQuantity],
      ['Precio por Ticket', `$${quotation.ticketPrice.toFixed(2)}`],
      ['Ingreso Total', `$${quotation.totalRevenue.toFixed(2)}`],
    ],
  })
  
  // Payment Methods
  doc.setFontSize(16)
  doc.text('Métodos de Pago - Comisiones', 20, doc.lastAutoTable.finalY + 15, { align: 'left' })
  doc.setFontSize(12)
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Método', 'Comisión']],
    body: [
      ['Crédito', `$${quotation.paywayFees.credit.toFixed(2)}`],
      ['Débito', `$${quotation.paywayFees.debit.toFixed(2)}`],
      ['Efectivo', `$${quotation.paywayFees.cash.toFixed(2)}`],
      ['Total Comisiones', `$${quotation.paywayFees.total.toFixed(2)}`],
    ],
  })
  
  // Operational Costs
  doc.setFontSize(16)
  doc.text('Costos Operativos', 20, doc.lastAutoTable.finalY + 15, { align: 'left' })
  doc.setFontSize(12)
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Concepto', 'Costo']],
    body: [
      ['Credenciales', `$${quotation.operationalCosts.credentials.toFixed(2)}`],
      ['Ticketing', `$${quotation.operationalCosts.ticketing.toFixed(2)}`],
      ['Supervisores', `$${quotation.operationalCosts.supervisors.toFixed(2)}`],
      ['Operadores', `$${quotation.operationalCosts.operators.toFixed(2)}`],
      ['Movilidad', `$${quotation.operationalCosts.mobility.toFixed(2)}`],
      ['Total Operativo', `$${quotation.operationalCosts.total.toFixed(2)}`],
    ],
  })
  
  // Additional Costs
  doc.setFontSize(16)
  doc.text('Costos Adicionales', 20, doc.lastAutoTable.finalY + 15, { align: 'left' })
  doc.setFontSize(12)
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Concepto', 'Costo']],
    body: [
      ['Plataforma', `$${quotation.platformFee.toFixed(2)}`],
      ['Ticketing', `$${quotation.ticketingFee.toFixed(2)}`],
      ['Servicios Adicionales', `$${quotation.additionalServices.toFixed(2)}`],
      ['Costo Palco4', `$${quotation.palco4Cost.toFixed(2)}`],
      ['Costo de Línea', `$${quotation.lineCost.toFixed(2)}`],
    ],
  })
  
  // Final Results
  doc.setFontSize(16)
  doc.text('Resultados Finales', 20, doc.lastAutoTable.finalY + 15, { align: 'left' })
  doc.setFontSize(12)
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Concepto', 'Valor']],
    body: [
      ['Ingresos Totales', `$${quotation.totalRevenue.toFixed(2)}`],
      ['Costos Totales', `$${quotation.totalCosts.toFixed(2)}`],
      ['Margen Bruto', `$${quotation.grossMargin.toFixed(2)}`],
      ['Rentabilidad Bruta', `${quotation.grossProfitability.toFixed(2)}%`],
    ],
  })
  
  return doc
} 