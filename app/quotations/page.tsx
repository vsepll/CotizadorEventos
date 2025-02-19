import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { QuotationList } from "@/components/quotation-list"

export default async function QuotationsPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Saved Quotations</h1>
      <QuotationList />
    </div>
  )
}

