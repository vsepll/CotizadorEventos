import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { ParameterForm } from "@/components/parameter-form"

export default async function AdminParametersPage() {
  const session = await getServerSession()

  if (!session || session.user?.role !== "admin") {
    redirect("/login")
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Global Parameters</h1>
      <ParameterForm />
    </div>
  )
}

