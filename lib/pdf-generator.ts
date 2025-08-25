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

// Helper function to safely parse JSON or return the object if already parsed
function safeParseJSON(data: any) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (error) {
      console.error('Error parsing JSON:', error)
      return {}
    }
  }
  return data || {}
}

// Helper function to safely get numeric value
function safeNumber(value: any): number {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

// Helper function to format currency
function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Helper function to filter out zero values
function filterRelevantData(data: Array<[string, any]>): Array<[string, any]> {
  return data.filter(([label, value]) => {
    if (typeof value === 'string' && value.includes('$')) {
      // Extract number from currency string and check if it's > 0
      const numValue = parseFloat(value.replace(/[$,]/g, ''))
      return numValue > 0
    }
    if (typeof value === 'number') {
      return value > 0
    }
    return true // Keep non-numeric values
  })
}

export function generateQuotationPDF(quotation: QuotationData) {
  try {
    console.log('🔍 Iniciando generación de PDF con datos:', quotation);
    
    const doc = new jsPDF()
    
    // Parse JSON fields safely
    const paywayFees = safeParseJSON(quotation.paywayFees)
    const operationalCosts = safeParseJSON(quotation.operationalCosts)
    
    console.log('📊 Datos parseados:', {
      paywayFees,
      operationalCosts,
      totalRevenue: quotation.totalRevenue,
      grossMargin: quotation.grossMargin
    });
    
    let currentY = 15
    
    // Title
    console.log('✏️ Agregando título...');
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Cotización de Evento', 105, currentY, { align: 'center' })
    currentY += 15
    
    // Event Information
    console.log('📝 Agregando información del evento...');
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Información del Evento', 20, currentY)
    currentY += 5
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nombre: ${quotation.name || 'Sin nombre'}`, 20, currentY)
    currentY += 7
    doc.text(`Tipo de Evento: ${quotation.eventType || 'No especificado'}`, 20, currentY)
    currentY += 7
    doc.text(`Fecha de Creación: ${new Date(quotation.createdAt).toLocaleDateString('es-MX')}`, 20, currentY)
    currentY += 15
    
    // Basic Revenue Information
    console.log('💰 Agregando resumen del evento...');
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumen del Evento', 20, currentY)
    currentY += 5
    
    const basicInfo = filterRelevantData([
      ['Cantidad de Tickets', safeNumber(quotation.ticketQuantity).toLocaleString()],
      ['Precio Promedio por Ticket', formatCurrency(safeNumber(quotation.ticketPrice))],
      ['Ingreso Total', formatCurrency(safeNumber(quotation.totalRevenue))],
    ])
    
    console.log('📋 Información básica filtrada:', basicInfo);
    
    if (basicInfo.length > 0) {
      doc.autoTable({
        startY: currentY,
        head: [['Concepto', 'Valor']],
        body: basicInfo,
        margin: { left: 20 },
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 }
      })
      currentY = doc.lastAutoTable.finalY + 10
    }
    
    // Payment Methods - Only show if there are relevant fees
    console.log('💳 Procesando comisiones de pago...');
    const paymentData = filterRelevantData([
      ['Crédito', formatCurrency(safeNumber(paywayFees.credit))],
      ['Débito', formatCurrency(safeNumber(paywayFees.debit))],
      ['Efectivo', formatCurrency(safeNumber(paywayFees.cash))],
    ])
    
    console.log('💳 Datos de pago filtrados:', paymentData);
    
    if (paymentData.length > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Comisiones de Medios de Pago', 20, currentY)
      currentY += 5
      
      // Add total if there are individual fees
      paymentData.push(['Total Comisiones', formatCurrency(safeNumber(paywayFees.total))])
      
      doc.autoTable({
        startY: currentY,
        head: [['Método de Pago', 'Comisión']],
        body: paymentData,
        margin: { left: 20 },
        theme: 'striped',
        headStyles: { fillColor: [231, 76, 60] },
        styles: { fontSize: 10 }
      })
      currentY = doc.lastAutoTable.finalY + 10
    }
    
    // Operational Costs - Only show relevant costs
    console.log('🔧 Procesando costos operativos...');
    const operationalData = filterRelevantData([
      ['Credenciales', formatCurrency(safeNumber(operationalCosts.credentials))],
      ['Costo de Ticketing', formatCurrency(safeNumber(operationalCosts.ticketing))],
      ['Supervisores', formatCurrency(safeNumber(operationalCosts.supervisors))],
      ['Operadores', formatCurrency(safeNumber(operationalCosts.operators))],
      ['Movilidad', formatCurrency(safeNumber(operationalCosts.mobility))],
    ])
    
    console.log('🔧 Datos operativos filtrados:', operationalData);
    
    if (operationalData.length > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Costos Operativos', 20, currentY)
      currentY += 5
      
      // Add total if there are individual costs
      operationalData.push(['Total Operativo', formatCurrency(safeNumber(operationalCosts.total))])
      
      doc.autoTable({
        startY: currentY,
        head: [['Concepto', 'Costo']],
        body: operationalData,
        margin: { left: 20 },
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113] },
        styles: { fontSize: 10 }
      })
      currentY = doc.lastAutoTable.finalY + 10
    }
    
    // Additional Costs - Only show relevant costs
    console.log('➕ Procesando costos adicionales...');
    const additionalCosts = filterRelevantData([
      ['Plataforma', formatCurrency(safeNumber(quotation.platformFee))],
      ['Fee de Ticketing', formatCurrency(safeNumber(quotation.ticketingFee))],
      ['Servicios Adicionales', formatCurrency(safeNumber(quotation.additionalServices))],
      ['Costo Palco4', formatCurrency(safeNumber(quotation.palco4Cost))],
      ['Costo de Línea', formatCurrency(safeNumber(quotation.lineCost))],
    ])
    
    console.log('➕ Costos adicionales filtrados:', additionalCosts);
    
    if (additionalCosts.length > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Costos Adicionales', 20, currentY)
      currentY += 5
      
      doc.autoTable({
        startY: currentY,
        head: [['Concepto', 'Costo']],
        body: additionalCosts,
        margin: { left: 20 },
        theme: 'striped',
        headStyles: { fillColor: [155, 89, 182] },
        styles: { fontSize: 10 }
      })
      currentY = doc.lastAutoTable.finalY + 10
    }
    
    // Final Results - Always show
    console.log('🎯 Agregando resultados finales...');
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('RESULTADOS FINALES', 20, currentY)
    currentY += 5
    
    const finalResults = [
      ['Ingresos Totales', formatCurrency(safeNumber(quotation.totalRevenue))],
      ['Costos Totales', formatCurrency(safeNumber(quotation.totalCosts))],
      ['Margen Bruto', formatCurrency(safeNumber(quotation.grossMargin))],
      ['Rentabilidad Bruta', `${safeNumber(quotation.grossProfitability).toFixed(2)}%`],
    ]
    
    console.log('🎯 Resultados finales:', finalResults);
    
    doc.autoTable({
      startY: currentY,
      head: [['Concepto', 'Valor']],
      body: finalResults,
      margin: { left: 20 },
      theme: 'grid',
      headStyles: { 
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontStyle: 'bold',
        fontSize: 11
      },
      alternateRowStyles: { fillColor: [236, 240, 241] }
    })
    
    // Add footer
    console.log('🔻 Agregando footer...');
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text(
      `Generado el ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')}`,
      20,
      pageHeight - 10
    )
    
    console.log('✅ PDF generado exitosamente');
    return doc
    
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    console.error('📄 Datos de cotización que causaron el error:', quotation);
    throw new Error(`Error al generar PDF: ${error}`);
  }
} 