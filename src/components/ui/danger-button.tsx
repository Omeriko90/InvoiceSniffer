// Client component by import — only ever rendered from already-client parents.
import { Button } from "@/components/ui/button"

// The repeated destructive outline button: a red-tinted outline that fills on
// hover. Thin wrapper over the shared Button's `danger` variant so callers get
// it by intent; layout classes (e.g. `shrink-0`) still pass through via className.
export function DangerButton(props: React.ComponentProps<typeof Button>) {
  return <Button variant="danger" size="sm" {...props} />
}
