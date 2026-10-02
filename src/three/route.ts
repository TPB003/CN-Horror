// Shared route polyline for the old-street block (mirrors VillageCanvas).
// Station i (0-based) sits at route[i].

export const ROUTE: ReadonlyArray<readonly [number, number]> = [
  [-6, 5], [-4.8, 3.4], [-3.5, 2], [-2, 0.9], [-0.5, 0], [1.1, -0.8],
  [2.1, -2.2], [1.2, -3.7], [2.9, -5], [4.7, -4.1], [5.5, -2.2], [4.2, -0.3],
] as const;

export function streetLevel(x: number, z: number): number {
  return Math.max(-0.02, (z + 8.5) * 0.047 + Math.sin(x * 0.83 + z * 0.61) * 0.045);
}
