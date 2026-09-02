// English dictionary — the source of truth for translation keys.
// `he.ts` is typed against this object, so any key added here MUST also be added
// there (a missing Hebrew translation becomes a compile error).
//
// Group keys by namespace. Values may contain {name}-style placeholders, and a
// key may be an object with `_one` / `_other` variants for pluralization.
export const en = {
  common: {
    save: "Save",
    cancel: "Cancel",
  },
  settings: {
    language: {
      title: "Language",
      description: "Choose the language for the interface.",
      saved: "Language updated",
    },
  },
  shell: {
    sidebar: {
      default_org_name: "My Workspace",
      group_workspace: "Workspace",
      group_insights: "Insights",
      settings: "Settings",
    },
    nav: {
      dashboard: "Dashboard",
      invoices: "Invoices",
      reconcile: "Reconcile",
      fixed_expenses: "Fixed Expenses",
      alerts: "Alerts",
      exports: "Exports",
    },
    user_card: {
      default_name: "User",
      log_out: "Log out",
    },
    gmail_sync: {
      reconnect_title: "Reconnect Gmail to resume detecting invoices",
      out_of_sync: "Gmail out of sync · reconnect",
    },
  },
}

export type Dictionary = typeof en
