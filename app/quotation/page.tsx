import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { QuotationForm } from "@/components/quotation-form"

export default async function QuotationPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Event Quotation</h1>
      <QuotationForm />
    </div>
  )
}

