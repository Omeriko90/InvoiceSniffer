import { SavedMapping, SaveMappingRequest } from "@/api-types/import"

async function fetchCsvMappings(): Promise<SavedMapping[]> {
  const res = await fetch("/api/import")
  if (!res.ok) throw new Error("Failed to load saved mappings")
  return res.json()
}

// Remember a file's column mapping so files with the same header signature
// auto-map next time. Best-effort — a failure here shouldn't block reconciling.
async function saveCsvMapping(body: SaveMappingRequest): Promise<void> {
  const res = await fetch("/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to save mapping")
}

export { fetchCsvMappings, saveCsvMapping }
