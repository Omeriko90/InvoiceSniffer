import type { Dictionary } from "./en"

// Hebrew dictionary. Typed as `satisfies Dictionary` so the compiler enforces
// full key parity with `en.ts`.
export const he = {
  common: {
    save: "שמור",
    cancel: "ביטול",
  },
  settings: {
    language: {
      title: "שפה",
      description: "בחר את שפת הממשק.",
      saved: "השפה עודכנה",
    },
  },
  shell: {
    sidebar: {
      default_org_name: "סביבת העבודה שלי",
      group_workspace: "סביבת עבודה",
      group_insights: "תובנות",
      settings: "הגדרות",
    },
    nav: {
      dashboard: "לוח בקרה",
      invoices: "חשבוניות",
      reconcile: "התאמה",
      fixed_expenses: "הוצאות קבועות",
      alerts: "התראות",
      exports: "ייצוא",
    },
    user_card: {
      default_name: "משתמש",
      log_out: "התנתקות",
    },
    gmail_sync: {
      reconnect_title: "התחברות מחדש ל‑Gmail כדי להמשיך בזיהוי חשבוניות",
      out_of_sync: "Gmail לא מסונכרן · התחברות מחדש",
    },
  },
} satisfies Dictionary
