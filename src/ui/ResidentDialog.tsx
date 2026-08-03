import type { ResidentId } from "@/src/game/types";
import { nollaDialogue } from "@/src/progression/FriendshipSystem";

const RESIDENT_COPY: Record<ResidentId, { greeting: string; help: string }> = {
  ノラ: {
    greeting: "広場の木が、朝の雨で少しゆるんだみたい。",
    help: "木のえだが3本あれば、すぐに直せるよ。",
  },
  カイ: {
    greeting: "池の水面、今日は銀色に光っているね。",
    help: "波のあとには、音のちがう貝が見つかるんだ。",
  },
  セラ: {
    greeting: "森のハーブは、夕方にいちばん香るの。",
    help: "赤い実と合わせたら、みんなの元気になるよ。",
  },
};

export function ResidentDialog({
  resident,
  easyMode,
  line,
  friendshipLevel,
  canGiveWood = false,
  nightGardenUnlocked = false,
  groveRepairs = 0,
  groveQuestComplete = false,
  onGiveWood,
  onNext,
  onClose,
}: {
  resident: ResidentId;
  easyMode: boolean;
  line: number;
  friendshipLevel: number;
  canGiveWood?: boolean;
  nightGardenUnlocked?: boolean;
  groveRepairs?: number;
  groveQuestComplete?: boolean;
  onGiveWood?: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const baseCopy =
    resident === "ノラ" ? nollaDialogue(friendshipLevel) : RESIDENT_COPY[resident];
  const copy =
    resident === "セラ" && nightGardenUnlocked
      ? {
          greeting: "夜の庭に、月あかり花が咲いたよ。",
          help: "夜7時をすぎたら、庭の小さな光を見においで。",
        }
      : resident === "セラ" && groveRepairs >= 2
        ? {
            greeting: groveRepairs >= 3
              ? "森の奥まで、光がもどったよ。"
              : "香り草がもどって、森が深呼吸しているみたい。",
            help: groveRepairs >= 3 && !groveQuestComplete
              ? "新しい場所の ひかりキノコを 1つ見つけてみて。"
              : "いっしょに森を元気にしてくれて、ありがとう。",
          }
        : baseCopy;
  const hasNextLine = easyMode && line === 0;

  return (
    <div className="dialog-wrap">
      <section
        className="resident-dialog resident-dialog--story"
        aria-label={`${resident}との会話`}
      >
        <div className={`resident-portrait resident-portrait--${resident}`}>
          <span />
        </div>
        <div className="resident-dialog-copy">
          <p className="dialog-name">
            {resident}{" "}
            <small>
              {"★".repeat(friendshipLevel)}
              {"☆".repeat(3 - friendshipLevel)}
            </small>
          </p>
          {easyMode ? (
            <p>{hasNextLine ? copy.greeting : copy.help}</p>
          ) : (
            <>
              <p>{copy.greeting}</p>
              <p>{copy.help}</p>
            </>
          )}
          {resident === "セラ" && groveRepairs >= 3 && !groveQuestComplete && (
            <p className="dialog-goal">森のしごと：新しい場所の ひかりキノコを 1つ</p>
          )}
          {resident === "ノラ" && friendshipLevel === 1 && (
            <p className="dialog-goal">つぎ：木のえだを 1こ プレゼント</p>
          )}
          {resident === "ノラ" && friendshipLevel === 2 && (
            <p className="dialog-goal">つぎ：ノラの工具台を 近くに置く</p>
          )}
        </div>
        <div className="dialog-actions">
          {canGiveWood && onGiveWood && (
            <button className="dialog-gift" onClick={onGiveWood}>
              木のえだを あげる
            </button>
          )}
          <button onClick={hasNextLine ? onNext : onClose}>
            {hasNextLine ? "つぎ" : "またね"}
          </button>
        </div>
      </section>
    </div>
  );
}
