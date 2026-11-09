// Checks that every replay only uses structures and chemicals that exist,
// and that every structure has the fields the UI and AI rely on.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', 'src', 'content');
const { structures, groups } = JSON.parse(readFileSync(join(root, 'structures.json'), 'utf8'));
const chemicals = JSON.parse(readFileSync(join(root, 'chemicals.json'), 'utf8'));
const ids = new Set(structures.map((s) => s.id));
const errors = [];
const need = ['id', 'name', 'nickname', 'group', 'side', 'pos', 'oneLiner', 'youUseItWhen', 'explain', 'sources'];

for (const s of structures) {
  for (const k of need) if (s[k] === undefined) errors.push(`structure ${s.id}: missing ${k}`);
  if (!groups[s.group]) errors.push(`structure ${s.id}: unknown group ${s.group}`);
  if (!Array.isArray(s.sources) || !s.sources.length) errors.push(`structure ${s.id}: needs at least one source`);
  if (!Array.isArray(s.pos) || s.pos.length !== 3) errors.push(`structure ${s.id}: pos must be [dx, ny, nz]`);
}

const dir = join(root, 'replays');
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const r = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const where = `replay ${f}`;
  for (const k of ['id', 'moment', 'question', 'summary', 'beats', 'whyItFelt', 'tryThis', 'finePrint', 'sources']) {
    if (r[k] === undefined) errors.push(`${where}: missing ${k}`);
  }
  (r.beats || []).forEach((b, i) => {
    if (!b.structures?.length) errors.push(`${where} beat ${i + 1}: no structures`);
    for (const id of b.structures || []) if (!ids.has(id)) errors.push(`${where} beat ${i + 1}: unknown structure ${id}`);
    for (const c of b.chemicals || []) if (!chemicals[c]) errors.push(`${where} beat ${i + 1}: unknown chemical ${c}`);
  });
  if (!r.sources?.length) errors.push(`${where}: needs at least one source`);
}

if (errors.length) {
  console.error(errors.map((e) => '  ✗ ' + e).join('\n'));
  process.exit(1);
}
console.log(`Content OK: ${structures.length} structures, ${readdirSync(dir).length} replays, ${Object.keys(chemicals).length} chemicals.`);
