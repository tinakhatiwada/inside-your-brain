// Loads the reviewed content once at startup. The AI is grounded on exactly these files.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..', 'src', 'content');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const data = read('structures.json');
export const GROUPS = data.groups;
export const STRUCTURES = data.structures;
export const STRUCTURE_IDS = STRUCTURES.map((s) => s.id);
export const BY_ID = Object.fromEntries(STRUCTURES.map((s) => [s.id, s]));
export const CHEMICALS = read('chemicals.json');
export const CHEMICAL_IDS = Object.keys(CHEMICALS);
export const REPLAYS = readdirSync(join(root, 'replays'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => read(join('replays', f)))
  .sort((a, b) => a.order - b.order);
export const REPLAY_BY_ID = Object.fromEntries(REPLAYS.map((r) => [r.id, r]));

/** Full reviewed notes for one structure, as plain text for a prompt. */
export function structureNotes(s) {
  return [
    `[${s.id}] ${s.name} (${s.nickname}). Group: ${GROUPS[s.group].name}.`,
    s.oneLiner,
    `You use it when: ${s.youUseItWhen.join('; ')}.`,
    ...s.explain,
    s.surprising ? `Surprising: ${s.surprising}` : '',
  ].filter(Boolean).join('\n');
}

/** One-line catalogue entry, used so the model knows every ID it may use. */
export function structureLine(s) {
  return `- ${s.id}: ${s.name}, “${s.nickname}” (${GROUPS[s.group].name.toLowerCase()}). ${s.oneLiner}`;
}
