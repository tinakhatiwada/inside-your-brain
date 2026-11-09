// Hand-written replays, loaded at build time.
const files = import.meta.glob('./replays/*.json', { eager: true, import: 'default' });

export const REPLAYS = Object.values(files).sort((a, b) => a.order - b.order);
export const REPLAY_BY_ID = Object.fromEntries(REPLAYS.map((r) => [r.id, r]));

/** Every structure a replay lights up, in order of first appearance. */
export function structuresOf(r) {
  return [...new Set(r.beats.flatMap((b) => b.structures))];
}
