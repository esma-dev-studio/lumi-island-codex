import type { GameState } from "@/src/game/types";

export function SettingsPanel({
  state,
  tutorialActive,
  tutorialHidden,
  onSave,
  onResumeTutorial,
  onRestartTutorial,
  onCameraReset,
  onTitle,
  onEasyMode,
  onAudioSettings,
}: {
  state: GameState;
  tutorialActive: boolean;
  tutorialHidden: boolean;
  onSave: () => void;
  onResumeTutorial: () => void;
  onRestartTutorial: () => void;
  onCameraReset: () => void;
  onTitle: () => void;
  onEasyMode: (enabled: boolean) => void;
  onAudioSettings: (settings: GameState["audioSettings"]) => void;
}) {
  const audioLabel = state.audioSettings.muted
    ? "音をけしています"
    : `音量 ${Math.round(state.audioSettings.effectsVolume * 100)}%`;

  return (
    <>
      <header className="panel-heading settings-heading">
        <p className="eyebrow">見やすさ・音・セーブ</p>
        <h2>せってい</h2>
        <span>見やすさと 音をえらべます</span>
      </header>
      <div className="settings-list">
        <button
          className={state.easyMode ? "is-selected" : ""}
          onClick={() => onEasyMode(!state.easyMode)}
        >
          <span className="settings-symbol settings-symbol--easy" aria-hidden="true"><i /></span>
          <span>
            <strong>やさしい表示 {state.easyMode ? "ON" : "OFF"}</strong>
            <small>大きな案内・ゆっくりした操作</small>
          </span>
        </button>
        <div className="audio-settings-card settings-audio">
          <span className="settings-symbol settings-symbol--sound" aria-hidden="true"><i /></span>
          <div>
            <strong>こうか音</strong>
            <small>{audioLabel}</small>
          </div>
          <button
            className={state.audioSettings.muted ? "is-selected" : ""}
            onClick={() =>
              onAudioSettings({
                ...state.audioSettings,
                muted: !state.audioSettings.muted,
              })
            }
          >
            {state.audioSettings.muted ? "音を出す" : "音をけす"}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={state.audioSettings.effectsVolume}
            aria-label="こうか音の音量"
            onChange={(event) =>
              onAudioSettings({
                ...state.audioSettings,
                effectsVolume: Number(event.target.value),
                muted: false,
              })
            }
          />
        </div>
        {tutorialActive && (
          <button onClick={onResumeTutorial}>
            <span className="settings-symbol settings-symbol--guide" aria-hidden="true"><i /></span>
            <span>
              <strong>
                {tutorialHidden
                  ? "遊びかたを もう一度見る"
                  : "遊びかたへ もどる"}
              </strong>
              <small>いまのつづきから案内します</small>
            </span>
          </button>
        )}
        <button onClick={onRestartTutorial}>
          <span className="settings-symbol settings-symbol--restart" aria-hidden="true"><i /></span>
          <span>
            <strong>遊びかたを 最初から</strong>
            <small>歩くところから もう一度</small>
          </span>
        </button>
        <button onClick={onCameraReset}>
          <span className="settings-symbol settings-symbol--camera" aria-hidden="true"><i /></span>
          <span>
            <strong>カメラを もどす</strong>
            <small>見やすい向きにします</small>
          </span>
        </button>
        <button onClick={onSave}>
          <span className="settings-symbol settings-symbol--save" aria-hidden="true"><i /></span>
          <span>
            <strong>いま セーブする</strong>
            <small>この端末に島のようすを保存</small>
          </span>
        </button>
        <button onClick={onTitle}>
          <span className="settings-symbol settings-symbol--home" aria-hidden="true"><i /></span>
          <span>
            <strong>タイトルへ もどる</strong>
            <small>先に自動でセーブします</small>
          </span>
        </button>
      </div>
    </>
  );
}
