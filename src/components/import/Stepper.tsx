// Client component by import — only ever rendered from <ImportWizard>.
import { STEPS } from "./constants"
import { StepIndicator } from "./StepIndicator"

export function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-4">
      {STEPS.map((label, i) => (
        <StepIndicator
          key={label}
          label={label}
          stepNo={i + 1}
          current={current}
          showConnector={i + 1 < STEPS.length}
        />
      ))}
    </div>
  )
}
