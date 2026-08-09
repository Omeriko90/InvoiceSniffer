// Single source of truth for invoice expense categories. Shared by the Prisma
// enum (kept in lockstep — see schema.prisma `enum InvoiceCategory`), the
// always-run LLM categorizer (llm-categorizer.ts), the PATCH validation schema,
// and every UI surface (badge, filter, dashboard breakdown).
//
// UNCATEGORIZED is the DB default and the fail-open value when categorization is
// disabled or uncertain. OTHER is a real category the LLM may pick for a
// clearly-business-but-unlisted expense.

export const INVOICE_CATEGORIES = [
  "MARKETING",
  "EQUIPMENT",
  "SOFTWARE",
  "TRAVEL",
  "OFFICE_SUPPLIES",
  "PROFESSIONAL_SERVICES",
  "UTILITIES",
  "OTHER",
  "UNCATEGORIZED",
] as const

export type InvoiceCategory = (typeof INVOICE_CATEGORIES)[number]

// The category rubric handed to the LLM. Shared by the always-run text-only
// categorizer (llm-categorizer.ts) and the Tier-2 vision extractor
// (llm-extractor.ts) so both classify against identical definitions.
export const CATEGORY_GUIDANCE = `Pick exactly ONE category, by what the business is spending money ON:
- MARKETING: advertising, ad spend, PR, social/media, design, sponsorships, events.
- EQUIPMENT: physical hardware and machinery — computers, phones, furniture, tools.
- SOFTWARE: SaaS, cloud/hosting, licenses, subscriptions, developer/API services.
- TRAVEL: flights, hotels, car rental, taxi/rideshare, fuel, parking, meals while traveling.
- OFFICE_SUPPLIES: consumables and small office goods — paper, stationery, kitchen, cleaning.
- PROFESSIONAL_SERVICES: accountants, lawyers, consultants, agencies, contractors, bookkeeping.
- UTILITIES: electricity, water, gas, internet, phone/mobile service, communications.
- OTHER: a clear business expense that fits none of the above.
- UNCATEGORIZED: only when there is genuinely not enough information to decide.
Return UNCATEGORIZED rather than guessing when unsure.`

export const CATEGORY_LABELS: Record<InvoiceCategory, string> = {
  MARKETING: "Marketing",
  EQUIPMENT: "Equipment",
  SOFTWARE: "Software",
  TRAVEL: "Travel",
  OFFICE_SUPPLIES: "Office Supplies",
  PROFESSIONAL_SERVICES: "Professional Services",
  UTILITIES: "Utilities",
  OTHER: "Other",
  UNCATEGORIZED: "Uncategorized",
}

// Badge colors follow the STATUS_META pattern (pastel bg + saturated fg) in
// src/components/invoices/constants.ts.
export const CATEGORY_COLORS: Record<InvoiceCategory, { bg: string; color: string }> = {
  MARKETING:             { bg: "#FDF2F8", color: "#DB2777" },
  EQUIPMENT:             { bg: "#FFFBEB", color: "#B45309" },
  SOFTWARE:              { bg: "#EFF6FF", color: "#2563EB" },
  TRAVEL:                { bg: "#ECFEFF", color: "#0891B2" },
  OFFICE_SUPPLIES:       { bg: "#F5F3FF", color: "#7C3AED" },
  PROFESSIONAL_SERVICES: { bg: "#ECFDF5", color: "#059669" },
  UTILITIES:             { bg: "#FFF7ED", color: "#EA580C" },
  OTHER:                 { bg: "#F1F5F9", color: "#475569" },
  UNCATEGORIZED:         { bg: "#F1F3F8", color: "#94A3B8" },
}

// Categories a user may assign from the UI. UNCATEGORIZED is last so it reads as
// a "clear" option rather than a real expense type.
export const CATEGORY_SELECTABLE: InvoiceCategory[] = [
  ...INVOICE_CATEGORIES.filter((c) => c !== "UNCATEGORIZED"),
  "UNCATEGORIZED",
]
