import type { GameState } from "@/src/game/types";

export function MainMenu({
  state,
  onOpenInventory,
  onOpenCollection,
  onOpenBuilding,
  onOpenSettings,
}: {
  state: GameState;
  onOpenInventory: () => void;
  onOpenCollection: () => void;
  onOpenBuilding: () => void;
  onOpenSettings: () => void;
}) {
  const found = Object.values(state.collectionCounts).filter((count) => count > 0).length;
  const gathered = state.totalGathered;

  return (
    <>
      <header className="panel-heading main-menu-heading">
        <p className="eyebrow">ひと休み</p>
        <h2>なにを する？</h2>
        <span>ゲームは 止まっています</span>
      </header>
      <div className="menu-status menu-status--compact" aria-label="島のきろく">
        <span><small>きょう</small><strong>{state.day}日</strong></span>
        <span><small>ルーメン</small><strong>{state.lumen}</strong></span>
        <span><small>島ランク</small><strong>{state.islandLevel}</strong></span>
      </div>
      <nav className="child-menu-grid" aria-label="メニューをえらぶ">
        <button className="child-menu-card child-menu-card--bag" onClick={onOpenInventory}>
          <span className="child-menu-icon child-menu-icon--bag" aria-hidden="true"><i /></span>
          <span><strong>バッグ</strong><small>もちものを見る</small></span>
          <b>{gathered}こ</b>
        </button>
        <button className="child-menu-card child-menu-card--book" onClick={onOpenCollection}>
          <span className="child-menu-icon child-menu-icon--book" aria-hidden="true"><i /></span>
          <span><strong>島のずかん</strong><small>見つけたもの</small></span>
          <b>{found}しゅ</b>
        </button>
        <button className="child-menu-card child-menu-card--build" onClick={onOpenBuilding}>
          <span className="child-menu-icon child-menu-icon--build" aria-hidden="true"><i /></span>
          <span><strong>島づくり</strong><small>橋・森・作り方</small></span>
          <b>{state.lumen} L</b>
        </button>
        <button className="child-menu-card child-menu-card--settings" onClick={onOpenSettings}>
          <span className="child-menu-icon child-menu-icon--settings" aria-hidden="true"><i /></span>
          <span><strong>せってい</strong><small>音・遊びかた・セーブ</small></span>
          <b>ひらく</b>
        </button>
      </nav>
      <p className="main-menu-tip">まよったら「島づくり」で、つぎの楽しみを見よう。</p>
    </>
  );
}
