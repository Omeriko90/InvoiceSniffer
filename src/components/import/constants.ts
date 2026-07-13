import { Field } from "./types"

export const FIELDS: Field[] = [
  { key: "date",     label: "Transaction date",    hint: "When the charge posted", required: true },
  { key: "merchant", label: "Merchant",            hint: "Who was paid",           required: true },
  { key: "amount",   label: "Amount",              hint: "Charge amount",          required: true },
  { key: "currency", label: "Currency (optional)", hint: "Defaults to USD",        required: false },
]

export const STEPS = ["Upload", "Map columns", "Preview & confirm"]
