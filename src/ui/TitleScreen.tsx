"use client";

export function TitleScreen({
  canContinue,
  onNewGame,
  onContinue,
  onShowcase,
}: {
  canContinue: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onShowcase: () => void;
}) {
  return (
    <main className="title-screen">
      <div className="title-sky" aria-hidden="true">
        <span className="cloud cloud--one" />
        <span className="cloud cloud--two" />
        <span className="sun-disc" />
        <div className="title-island">
          <span className="island-hill island-hill--back" />
          <span className="island-hill island-hill--front" />
          <span className="tiny-house tiny-house--one" />
          <span className="tiny-house tiny-house--two" />
          <span className="tiny-tree tiny-tree--one" />
          <span className="tiny-tree tiny-tree--two" />
          <span className="tiny-tree tiny-tree--three" />
          <span className="island-glow island-glow--one" />
          <span className="island-glow island-glow--two" />
          <span className="island-glow island-glow--three" />
        </div>
      </div>

      <section className="title-content">
        <p className="title-kicker">A SMALL ISLAND, A GENTLE LIGHT</p>
        <h1>
          <span>LUMI</span>
          <span>ISLAND</span>
        </h1>
        <p className="title-subtitle">ひかりを集めて、島の暮らしをつくろう。</p>
        <div className="title-actions">
          <button className="primary-button" onClick={onNewGame}>
            <span>あたらしく始める</span>
            <small>NEW STORY</small>
          </button>
          {canContinue && (
            <button className="secondary-button" onClick={onContinue}>
              <span>つづきから</span>
              <small>CONTINUE</small>
            </button>
          )}
        </div>
        <button className="text-button" onClick={onShowcase}>
          キャラクターをくわしく見る →
        </button>
      </section>

      <footer className="title-footer">
        <span>矢印で歩く</span>
        <span>大きなボタンで調べる</span>
        <span>オートセーブ</span>
      </footer>
    </main>
  );
}
