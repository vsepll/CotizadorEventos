import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome to your Dashboard</h1>
      <p className="mb-4">You are logged in as: {session.user?.email}</p>
      <p className="mb-4">Your role is: {session.user?.role}</p>
      <div className="space-x-4">
        <Button asChild>
          <Link href="/quotation">Create New Quotation</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/quotations">View Saved Quotations</Link>
        </Button>
      </div>
    </div>
  )
}

