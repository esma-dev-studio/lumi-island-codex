export interface RockCrack {
  id: number;
  strength: number;
}

export interface RockChoiceResult {
  correct: boolean;
  amount: number;
  grade: "normal" | "excellent";
}

export function createRockCracks(sourceId: string): RockCrack[] {
  const seed = [...sourceId].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  const strongest = seed % 3;
  return [0, 1, 2].map((id) => ({
    id,
    strength: id === strongest ? 1 : 0.42 + ((seed + id) % 2) * 0.13,
  }));
}

export function chooseRockCrack(
  cracks: RockCrack[],
  selectedId: number,
): RockChoiceResult {
  const strongest = cracks.reduce((best, crack) =>
    crack.strength > best.strength ? crack : best,
  );
  const correct = strongest.id === selectedId;
  return {
    correct,
    amount: correct ? 2 : 1,
    grade: correct ? "excellent" : "normal",
  };
}
