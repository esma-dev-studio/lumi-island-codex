import type { ResidentId } from "@/src/game/types";

const RESIDENT_COPY: Record<
  ResidentId,
  { greeting: string; help: string }
> = {
  ノラ: {
    greeting: "広場の木が、朝の雨で少しゆるんだみたい。",
    help: "木のえだが3本あれば、すぐに直せるよ。",
  },
  カイ: {
    greeting: "池の水面、今日は銀色に光っているね。",
    help: "波のあとには、音のちがう貝が見つかるんだ。",
  },
  セラ: {
    greeting: "月のハーブは、夕方にいちばん香るの。",
    help: "赤い実と合わせたら、みんなのお茶になるよ。",
  },
};

export function ResidentDialog({
  resident,
  easyMode,
  line,
  onNext,
  onClose,
}: {
  resident: ResidentId;
  easyMode: boolean;
  line: number;
  onNext: () => void;
  onClose: () => void;
}) {
  const copy = RESIDENT_COPY[resident];
  const hasNextLine = easyMode && line === 0;
  return (
    <div className="dialog-wrap">
      <section className="resident-dialog" aria-label={`${resident}との会話`}>
        <div className={`resident-portrait resident-portrait--${resident}`}>
          <span />
        </div>
        <div>
          <p className="dialog-name">{resident}</p>
          {easyMode ? (
            <p>{hasNextLine ? copy.greeting : copy.help}</p>
          ) : (
            <>
              <p>{copy.greeting}</p>
              <p>{copy.help}</p>
            </>
          )}
        </div>
        <button onClick={hasNextLine ? onNext : onClose}>
          {hasNextLine ? "つぎ" : "またね"}
        </button>
      </section>
    </div>
  );
}
