import { TUTORIAL_STEPS } from "@/src/tutorial/TutorialSteps";
import type { TutorialProgress } from "@/src/tutorial/TutorialSystem";

export function TutorialOverlay({
  progress,
  easyMode,
  onDismiss,
}: {
  progress: TutorialProgress;
  easyMode: boolean;
  onDismiss: () => void;
}) {
  const step = TUTORIAL_STEPS[progress.step];
  if (!step) return null;
  const distance = Math.min(3, progress.walkedDistance);
  return (
    <aside
      className={`tutorial-coach ${easyMode ? "tutorial-coach--easy" : ""}`}
      aria-live="polite"
      data-testid="tutorial-coach"
    >
      <div className="tutorial-coach__step">
        {progress.step + 1}<small>/{TUTORIAL_STEPS.length}</small>
      </div>
      <div>
        <span>いま やること</span>
        <h2>{easyMode ? step.easyTitle : step.title}</h2>
        {step.id === "move" && (
          <div
            className="tutorial-distance"
            aria-label={`${distance.toFixed(1)} / 3メートル`}
          >
            <i style={{ width: `${(distance / 3) * 100}%` }} />
          </div>
        )}
      </div>
      <kbd>{step.keyLabel}</kbd>
      <button onClick={onDismiss}>あとで</button>
    </aside>
  );
}
