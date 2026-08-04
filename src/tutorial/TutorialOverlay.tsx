"use client";

import { useState } from "react";
import { TUTORIAL_STEPS } from "@/src/tutorial/TutorialSteps";
import type { TutorialProgress } from "@/src/tutorial/TutorialSystem";

export function TutorialOverlay({
  progress,
  easyMode,
  onHide,
  onQuit,
}: {
  progress: TutorialProgress;
  easyMode: boolean;
  onHide: () => void;
  onQuit: () => void;
}) {
  const [confirmQuit, setConfirmQuit] = useState(false);
  const step = TUTORIAL_STEPS[progress.step];
  if (!step) return null;
  const distance = Math.min(3, progress.walkedDistance);
  const guideCopy =
    step.id === "hint" || step.id === "gather"
      ? "金色の輪と 光の柱が『光のしるし』"
      : step.id === "talk"
        ? "『ノラ』の名ふだと 金色の光を さがそう"
        : null;
  return (
    <aside
      className={`tutorial-coach ${easyMode ? "tutorial-coach--easy" : ""}`}
      aria-live="polite"
      data-testid="tutorial-coach"
    >
      <div className="tutorial-coach__step" aria-label={`${progress.step + 1}ばんめ` }>
        {progress.step + 1}<small>/{TUTORIAL_STEPS.length}</small>
      </div>
      <div className="tutorial-coach__goal">
        <span>いま やること</span>
        <h2>{easyMode ? step.easyTitle : step.title}</h2>
        {guideCopy && (
          <p className="tutorial-marker-key">
            <i aria-hidden="true">◆</i>
            <span>{guideCopy}</span>
          </p>
        )}
        {step.id === "move" && (
          <div
            className="tutorial-distance"
            aria-label="歩いたぶん"
          >
            <i style={{ width: `${(distance / 3) * 100}%` }} />
          </div>
        )}
      </div>
      {!easyMode && <kbd>{step.keyLabel}</kbd>}
      {!confirmQuit ? (
        <div className="tutorial-coach__actions">
          <button onClick={onHide}>いったん隠す</button>
          <button className="tutorial-quit-link" onClick={() => setConfirmQuit(true)}>
            チュートリアルをやめる
          </button>
        </div>
      ) : (
        <div className="tutorial-quit-confirm" role="alert">
          <strong>ほんとうに やめる？</strong>
          <button onClick={() => setConfirmQuit(false)}>つづける</button>
          <button onClick={onQuit}>やめる</button>
        </div>
      )}
    </aside>
  );
}