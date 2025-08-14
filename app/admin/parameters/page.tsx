import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { ParameterForm } from "@/components/parameter-form"
import { authOptions } from "@/lib/auth"

export default async function AdminParametersPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Global Parameters</h1>
      <ParameterForm />
    </div>
  )
}

