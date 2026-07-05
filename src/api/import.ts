import { SavedMapping, ImportRequest, ImportResponse } from "@/api-types/import"

async function fetchCsvMappings(): Promise<SavedMapping[]> {
  const res = await fetch("/api/import")
  if (!res.ok) throw new Error("Failed to load saved mappings")
  return res.json()
}

async function importTransactions(body: ImportRequest): Promise<ImportResponse> {
  const res = await fetch("/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to import transactions")
  return res.json()
}

export { fetchCsvMappings, importTransactions }
