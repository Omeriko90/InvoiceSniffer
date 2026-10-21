// Client component by import — only ever rendered from <ImportWizard>.
import { STEPS } from "./constants"
import { StepIndicator } from "./StepIndicator"
import { useT } from "@/components/i18n/LocaleProvider"

// Maps each step (data, from constants.ts) to its UI label translation key, by index.
const STEP_LABEL_KEYS = [
  "import_csv.step.upload",
  "import_csv.step.map_columns",
  "import_csv.step.preview_confirm",
] as const

export function Stepper({ current }: { current: number }) {
  const t = useT()
  return (
    <div className="flex items-center gap-4">
      {STEPS.map((label, i) => (
        <StepIndicator
          key={label}
          label={t(STEP_LABEL_KEYS[i])}
          stepNo={i + 1}
          current={current}
          showConnector={i + 1 < STEPS.length}
        />
      ))}
    </div>
  )
}
