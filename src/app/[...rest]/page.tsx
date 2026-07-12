import { redirect } from "next/navigation"

// Catch-all for unmatched routes — fall back to the dashboard
export default function CatchAllPage() {
  redirect("/")
}
