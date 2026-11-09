// Anatomy helpers shared by the 3D view and the UI.
// Positions in structures.json are normalised to the model's bounding box:
//   pos = [dx, ny, nz] where dx is the distance from the midline (0..0.5 of the width),
//   ny is 0 (bottom of brainstem) .. 1 (top), and nz is 0 (back) .. 1 (front).
// The model's +x side is the subject's LEFT hemisphere (checked against a right-handed
// RAS frame with +z anterior and +y superior), so "left" structures sit at +x.
import data from '../content/structures.json';

export const GROUPS = data.groups;
export const STRUCTURES = data.structures;
export const BY_ID = Object.fromEntries(STRUCTURES.map((s) => [s.id, s]));
export const STRUCTURE_IDS = STRUCTURES.map((s) => s.id);

export function groupColor(id) {
  const s = BY_ID[id];
  return s ? GROUPS[s.group].color : '#ffffff';
}

/** Normalised [nx, ny, nz] points (0..1 box coordinates) for a structure, one per hemisphere it occupies. */
export function normalisedPoints(s) {
  const [dx, ny, nz] = s.pos;
  if (s.side === 'mid' || dx === 0) return [[0.5, ny, nz]];
  if (s.side === 'left') return [[0.5 + dx, ny, nz]];
  if (s.side === 'right') return [[0.5 - dx, ny, nz]];
  return [[0.5 + dx, ny, nz], [0.5 - dx, ny, nz]];
}

export const LOBES = [
  { id: 'frontal', name: 'Frontal lobe', color: '#7DA7E0', job: 'Planning, decisions, movement and speech' },
  { id: 'parietal', name: 'Parietal lobe', color: '#E8C468', job: 'Touch, body sense and where things are in space' },
  { id: 'temporal', name: 'Temporal lobe', color: '#79C9A0', job: 'Hearing, language, memory and recognising faces' },
  { id: 'occipital', name: 'Occipital lobe', color: '#E58A7B', job: 'Vision' },
  { id: 'cerebellum', name: 'Cerebellum', color: '#B993D6', job: 'Balance, coordination and prediction' },
  { id: 'brainstem', name: 'Brainstem', color: '#E8A15C', job: 'Breathing, heartbeat and alertness' },
];

/**
 * Approximate lobe for a point in normalised box coordinates.
 * Boundaries follow the main landmarks (lateral fissure, central sulcus, parieto-occipital line)
 * as sloped planes rather than boxes. It's still a teaching approximation, not an atlas.
 */
export function lobeOf(nx, ny, nz) {
  const dx = Math.abs(nx - 0.5);
  // Brainstem: narrow, medial column at the bottom.
  if (ny < 0.33 && dx < 0.085 && nz > 0.3 && nz < 0.5) return 5;
  // Cerebellum: below and behind the cerebrum.
  const cerebTop = 0.34 - (nz - 0.1) * 0.12;
  if (nz < 0.48 && ny < cerebTop) return 4;
  if (ny < 0.27 && nz < 0.52) return dx < 0.09 ? 5 : 4;
  // Lateral (Sylvian) fissure: rises from front-low to back-high.
  const sylvian = 0.5 + (0.8 - nz) * 0.26;
  const isTemporal = ny < sylvian && nz < 0.85 && nz > 0.16 && (dx > 0.16 || nz < 0.62);
  // Parieto-occipital boundary, slightly sloped.
  const occ = 0.17 + (0.6 - ny) * 0.09;
  if (nz < occ) return 3;
  if (isTemporal) return 2;
  // Central sulcus: slopes forward as it goes down the side of the brain.
  const central = 0.5 + (1 - ny) * 0.22;
  return nz > central ? 0 : 1;
}
