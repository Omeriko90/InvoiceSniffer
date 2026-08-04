import { en } from "./dictionaries/en"
import type { Dictionary } from "./dictionary"

// A plural leaf carries count-dependent variants instead of a single string.
type PluralLeaf = { _one: string; _other: string }

// Dot-path union of every leaf in the dictionary, e.g. "settings.language.title".
// Recurses into nested objects; treats strings and plural leaves as terminals.
export type TranslationKey = PathsToLeaves<Dictionary>

type PathsToLeaves<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends PluralLeaf
      ? K
      : `${K}.${PathsToLeaves<T[K]>}`
}[keyof T & string]

export type TranslateParams = Record<string, string | number> & { count?: number }

function lookup(dict: Dictionary, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => {
    if (node && typeof node === "object" && part in node) {
      return (node as Record<string, unknown>)[part]
    }
    return undefined
  }, dict)
}

function isPluralLeaf(value: unknown): value is PluralLeaf {
  return typeof value === "object" && value !== null && "_other" in value
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  )
}

// Resolve a key against `dict`, falling back to English, then to the raw key.
// Interpolates {placeholders} and selects plural variants by `params.count`.
export function t(dict: Dictionary, key: TranslationKey, params?: TranslateParams): string {
  let node = lookup(dict, key)
  if (node === undefined && dict !== en) node = lookup(en, key)

  if (isPluralLeaf(node)) {
    const variant = params?.count === 1 ? node._one : node._other
    return interpolate(variant, params)
  }
  if (typeof node === "string") return interpolate(node, params)

  return key
}
