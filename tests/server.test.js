// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseReplay, replayJsonSchema } from '../server/lib/replay-schema.js';
import { retrieve, tokenize } from '../server/lib/retrieve.js';
import { REPLAYS, STRUCTURE_IDS } from '../server/lib/content.js';

const good = () => {
  const { id, order, moment, sources, ...rest } = REPLAYS[0];
  return { safety: 'ok', message: '', ...rest };
};

test('a hand-written replay passes validation unchanged in shape', () => {
  const r = normaliseReplay(good());
  assert.equal(r.ok, true);
  assert.equal(r.value.beats.length, REPLAYS[0].beats.length);
});

test('unknown structure IDs are dropped and casing is fixed', () => {
  const input = good();
  input.safety = 'OK';
  input.beats[0].structures = ['Amygdala', 'made-up-area', 'amygdala'];
  const r = normaliseReplay(input);
  assert.equal(r.ok, true);
  assert.deepEqual(r.value.beats[0].structures, ['amygdala']);
});

test('fewer than three usable steps is rejected so the server retries', () => {
  const input = good();
  input.beats = input.beats.slice(0, 2);
  assert.equal(normaliseReplay(input).ok, false);
});

test('support responses carry a message and no replay', () => {
  const r = normaliseReplay({ safety: 'support', message: '', question: '', summary: '', beats: [], whyItFelt: '', tryThis: [], finePrint: [] });
  assert.equal(r.ok, true);
  assert.equal(r.value.safety, 'support');
  assert.ok(r.value.message.length > 20);
  assert.equal(r.value.beats, undefined);
});

test('the JSON schema only allows known structure IDs', () => {
  const ids = replayJsonSchema.properties.beats.items.properties.structures.items.enum;
  assert.deepEqual(ids, STRUCTURE_IDS);
  assert.equal(replayJsonSchema.additionalProperties, false);
});

test('retrieval finds the right replay and structures', () => {
  assert.equal(retrieve('a song is stuck in my head', { kind: 'replay', k: 1 })[0].id, 'earworm');
  assert.equal(retrieve('why is dopamine important', { kind: 'structure', k: 1 })[0].id, 'reward-circuit');
  assert.ok(tokenize('The memories!').includes('memori'));
});
