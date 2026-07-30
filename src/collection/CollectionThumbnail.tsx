import type { CSSProperties } from "react";
import type { CollectionEntry } from "@/src/collection/CollectionData";

export function CollectionThumbnail({
  entry,
  found,
}: {
  entry: CollectionEntry;
  found: boolean;
}) {
  const [primary, secondary] = entry.colors;
  return (
    <svg
      className={`collection-thumbnail collection-thumbnail--${entry.visual} ${
        found ? "is-found" : "is-silhouette"
      }`}
      viewBox="0 0 72 72"
      role="img"
      aria-label={found ? `${entry.name}の絵` : "まだ見つけていないものの形"}
      style={
        {
          "--collection-primary": primary,
          "--collection-secondary": secondary,
        } as CSSProperties
      }
    >
      <circle className="collection-thumbnail__back" cx="36" cy="36" r="31" />
      {entry.visual === "fish" && (
        <>
          <path className="collection-thumbnail__primary" d="M18 37c9-13 27-16 39-2-10 16-30 17-39 2Z" />
          <path className="collection-thumbnail__secondary" d="m19 37-10-9v18Z" />
          <circle cx="49" cy="33" r="2.2" fill="#173b39" />
          <path d="M31 28c4 6 4 12 0 18" fill="none" stroke="white" strokeWidth="2.5" opacity=".7" />
        </>
      )}
      {entry.visual === "berry" && (
        <>
          <path className="collection-thumbnail__secondary" d="M37 28c-8-12-17-7-18 1 8 2 14 1 18-1Zm0 0c7-13 17-8 18 0-7 3-13 3-18 0Z" />
          <path d="M36 27v9" stroke="#476643" strokeWidth="3" strokeLinecap="round" />
          <circle className="collection-thumbnail__primary" cx="28" cy="43" r="10" />
          <circle className="collection-thumbnail__primary" cx="45" cy="43" r="10" opacity=".9" />
          <circle cx="25" cy="39" r="2.2" fill="white" opacity=".7" />
        </>
      )}
      {entry.visual === "leaf" && (
        <>
          <path className="collection-thumbnail__primary" d="M36 57C13 43 16 19 53 16c4 24-3 39-17 41Z" />
          <path d="M27 48 48 25M35 40l-10-2m16-5 1-10" fill="none" stroke="white" strokeWidth="2.4" opacity=".72" strokeLinecap="round" />
          <circle className="collection-thumbnail__secondary" cx="49" cy="20" r="4" />
        </>
      )}
      {entry.visual === "mushroom" && (
        <>
          <path className="collection-thumbnail__primary" d="M15 37c1-16 11-23 22-23 12 0 21 8 21 23Z" />
          <path className="collection-thumbnail__secondary" d="M31 35h13l4 23H27Z" />
          <circle cx="29" cy="25" r="3" fill="white" opacity=".76" />
          <circle cx="44" cy="20" r="2.5" fill="white" opacity=".76" />
        </>
      )}
      {entry.visual === "reed" && (
        <>
          <path d="M24 58c1-16 2-26-2-40m15 40c-1-18 1-31 4-43m8 43c0-14 0-24 5-34" fill="none" stroke="var(--collection-secondary)" strokeWidth="4" strokeLinecap="round" />
          <path className="collection-thumbnail__primary" d="M16 19c1-7 9-8 11-1 0 7-3 10-6 12-3-3-5-6-5-11Zm20-5c2-7 10-6 11 1-1 7-4 10-8 11-2-4-4-7-3-12Zm13 9c3-6 11-4 10 3-2 7-6 9-10 9-1-4-2-8 0-12Z" />
        </>
      )}
      {entry.visual === "shell" && (
        <>
          <path className="collection-thumbnail__primary" d="M12 50c2-23 12-35 25-35 14 0 23 13 24 35Z" />
          <path d="M20 48c2-14 8-24 17-31m-7 31c1-17 4-27 7-31m4 31c0-17-1-27-4-31m14 31c-2-14-7-24-14-31" fill="none" stroke="var(--collection-secondary)" strokeWidth="2.5" opacity=".75" />
          <rect x="12" y="48" width="49" height="7" rx="3.5" fill="var(--collection-secondary)" />
        </>
      )}
    </svg>
  );
}
