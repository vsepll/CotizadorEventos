import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { QuotationDetails } from "@/components/quotation-details"

export default async function QuotationDetailsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Quotation Details</h1>
      <QuotationDetails id={params.id} />
    </div>
  )
}

