import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { QuotationList } from "@/components/quotation-list"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Cotizaciones en Revisión | Cotizador de Eventos",
  description: "Panel de cotizaciones en revisión pendientes de aprobación",
}

export default async function ReviewDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth")
  }

  return (
    <div className="flex flex-col space-y-8 p-8">
      <PageHeader
        heading="Cotizaciones en Revisión"
        description="Cotizaciones pendientes de revisión y aprobación"
      />
      
      <div className="space-y-6">
        <QuotationList status="REVIEW" />
      </div>
    </div>
  )
} 