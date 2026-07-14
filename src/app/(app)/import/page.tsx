import { redirect } from "next/navigation"

// Import is no longer a separate step — uploading CSVs happens inside the
// Reconcile session. Redirect any old links/bookmarks there.
export default function ImportPage() {
  redirect("/reconcile")
}
