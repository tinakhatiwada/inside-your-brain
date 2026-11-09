// build-v2-phase8.mjs — Generates quiz, learning, and AI tutor modules
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE = process.argv[2] || '.';
const w = (path, content) => {
  mkdirSync(join(BASE, path.substring(0, path.lastIndexOf('/'))), { recursive: true });
  writeFileSync(join(BASE, path), content.trimStart());
  console.log(`  ✓ ${path}`);
};

// ══════════════════════════════════════════
// QUESTION BANK — 10+ questions per region/topic
// ══════════════════════════════════════════

const questions = {
  "frontal-lobe": [
    { id: "fl-01", question: "What is the primary function of the prefrontal cortex?", options: ["Visual processing", "Executive functions like planning and decision-making", "Auditory processing", "Balance and coordination"], answer: 1, explanation: "The prefrontal cortex is responsible for executive functions including planning, decision-making, working memory, and impulse control.", region: "frontal", difficulty: 1 },
    { id: "fl-02", question: "At approximately what age does the prefrontal cortex fully mature?", options: ["12 years", "18 years", "25 years", "30 years"], answer: 2, explanation: "The prefrontal cortex doesn't fully mature until around age 25, which helps explain teenagers' struggles with impulse control and long-term planning.", region: "frontal", difficulty: 2 },
    { id: "fl-03", question: "What condition results from damage to Broca's area?", options: ["Receptive aphasia", "Expressive aphasia", "Prosopagnosia", "Akinetopsia"], answer: 1, explanation: "Damage to Broca's area (left frontal lobe) causes expressive aphasia — the person understands language but cannot produce fluent speech.", region: "frontal", difficulty: 2 },
    { id: "fl-04", question: "Which structure contains the primary motor cortex?", options: ["Postcentral gyrus", "Precentral gyrus", "Superior temporal gyrus", "Angular gyrus"], answer: 1, explanation: "The precentral gyrus is the primary motor cortex. Each point controls a specific muscle group, creating the motor homunculus.", region: "frontal", difficulty: 2 },
    { id: "fl-05", question: "The case of Phineas Gage demonstrated the importance of which brain area for personality and social behavior?", options: ["Occipital lobe", "Cerebellum", "Ventromedial prefrontal cortex", "Hippocampus"], answer: 2, explanation: "Phineas Gage survived an iron rod through his frontal lobe but underwent dramatic personality changes, demonstrating the ventromedial PFC's role in emotional regulation and social behavior.", region: "frontal", difficulty: 3 },
    { id: "fl-06", question: "What does the dorsolateral prefrontal cortex primarily handle?", options: ["Emotional regulation", "Working memory and cognitive flexibility", "Reward processing", "Smell processing"], answer: 1, explanation: "The dorsolateral PFC handles working memory, planning, and cognitive flexibility — the ability to switch between tasks and mental frameworks.", region: "frontal", difficulty: 2 },
    { id: "fl-07", question: "Which fasciculus connects Broca's area to Wernicke's area?", options: ["Uncinate fasciculus", "Superior longitudinal fasciculus", "Arcuate fasciculus", "Inferior fronto-occipital fasciculus"], answer: 2, explanation: "The arcuate fasciculus connects Broca's area (frontal lobe, speech production) to Wernicke's area (temporal lobe, language comprehension).", region: "frontal", difficulty: 3 },
    { id: "fl-08", question: "The motor homunculus shows that which body parts have disproportionately large cortical representations?", options: ["Torso and legs", "Hands and face", "Arms and shoulders", "Feet and back"], answer: 1, explanation: "The hands and face (especially lips and tongue) have disproportionately large motor cortex representations because they require fine, precise motor control.", region: "frontal", difficulty: 1 },
    { id: "fl-09", question: "What is the role of the anterior cingulate cortex?", options: ["Visual processing", "Conflict monitoring and error detection", "Auditory processing", "Taste processing"], answer: 1, explanation: "The anterior cingulate cortex monitors for conflicts between competing responses and detects errors, playing a crucial role in cognitive control.", region: "frontal", difficulty: 3 },
    { id: "fl-10", question: "Which part of the frontal lobe processes reward and decision-making?", options: ["Premotor cortex", "Broca's area", "Orbitofrontal cortex", "Supplementary motor area"], answer: 2, explanation: "The orbitofrontal cortex processes reward values and helps make decisions by weighing potential outcomes.", region: "frontal", difficulty: 2 }
  ],
  "temporal-lobe": [
    { id: "tl-01", question: "What is the hippocampus named after?", options: ["A Greek philosopher", "A seahorse", "A river in Greece", "A type of flower"], answer: 1, explanation: "The hippocampus is named after the Greek word for 'seahorse' due to its curved shape.", region: "temporal", difficulty: 1 },
    { id: "tl-02", question: "What happens when both hippocampi are removed, as in the famous case of Patient H.M.?", options: ["Loss of all memories", "Inability to form new long-term memories", "Loss of motor control", "Blindness"], answer: 1, explanation: "Patient H.M. could no longer form new long-term memories (anterograde amnesia) but retained memories from before the surgery.", region: "temporal", difficulty: 2 },
    { id: "tl-03", question: "What is the primary function of the amygdala?", options: ["Language processing", "Motor control", "Emotional evaluation, especially threat detection", "Visual processing"], answer: 2, explanation: "The amygdala evaluates the emotional significance of stimuli, particularly threats, and can trigger fear responses before conscious awareness.", region: "temporal", difficulty: 1 },
    { id: "tl-04", question: "Damage to the fusiform gyrus causes what condition?", options: ["Aphasia", "Amnesia", "Prosopagnosia (face blindness)", "Agraphia"], answer: 2, explanation: "The fusiform gyrus specializes in face recognition. Damage causes prosopagnosia — the inability to recognize faces.", region: "temporal", difficulty: 2 },
    { id: "tl-05", question: "What type of aphasia results from damage to Wernicke's area?", options: ["Expressive aphasia", "Receptive aphasia", "Global aphasia", "Anomic aphasia"], answer: 1, explanation: "Damage to Wernicke's area produces receptive aphasia — fluent but meaningless speech, with impaired language comprehension.", region: "temporal", difficulty: 2 },
    { id: "tl-06", question: "The hippocampus is one of only two brain regions where what occurs throughout adult life?", options: ["Myelination", "Neurogenesis (birth of new neurons)", "Synaptogenesis", "Apoptosis"], answer: 1, explanation: "The hippocampus and the olfactory bulb are the only two brain regions where neurogenesis (birth of new neurons) continues throughout adult life.", region: "temporal", difficulty: 3 },
    { id: "tl-07", question: "Which structure in the temporal lobe houses the primary auditory cortex?", options: ["Inferior temporal gyrus", "Middle temporal gyrus", "Superior temporal gyrus", "Fusiform gyrus"], answer: 2, explanation: "The primary auditory cortex is located in the superior temporal gyrus (Heschl's gyrus), where vibrations are first processed as conscious sound.", region: "temporal", difficulty: 2 },
    { id: "tl-08", question: "What role does the entorhinal cortex play?", options: ["Face recognition", "Gateway to the hippocampus for memory formation", "Emotional processing", "Speech production"], answer: 1, explanation: "The entorhinal cortex serves as the main gateway between the hippocampus and the neocortex, playing a critical role in memory formation and spatial navigation.", region: "temporal", difficulty: 3 },
    { id: "tl-09", question: "Which neurotransmitter is most associated with hippocampal memory functions and is lost in Alzheimer's disease?", options: ["Dopamine", "Serotonin", "Acetylcholine", "GABA"], answer: 2, explanation: "Acetylcholine is crucial for memory and attention. Alzheimer's disease involves significant loss of cholinergic neurons, leading to memory impairment.", region: "temporal", difficulty: 3 },
    { id: "tl-10", question: "The 'low road' pathway through the amygdala allows what?", options: ["Conscious emotional analysis", "Fear responses before conscious awareness", "Long-term memory storage", "Language comprehension"], answer: 1, explanation: "The 'low road' pathway bypasses the cortex entirely, allowing the amygdala to trigger fight-or-flight responses in milliseconds — before you consciously recognize the threat.", region: "temporal", difficulty: 2 }
  ],
  "neural-communication": [
    { id: "nc-01", question: "What is the process called when neurons convert stimuli into electrical signals?", options: ["Transduction", "Conduction", "Convection", "Translation"], answer: 0, explanation: "Transduction is the process by which sensory receptors convert physical stimuli (light, sound, pressure) into electrical signals.", topic: "neural-communication", difficulty: 1 },
    { id: "nc-02", question: "What is the 'all-or-nothing' principle in neural communication?", options: ["Neurons can only fire once", "A neuron either fires completely or not at all", "All neurons fire simultaneously", "Neurons only respond to strong stimuli"], answer: 1, explanation: "The all-or-nothing principle means a neuron either fires a full action potential or doesn't fire at all — there's no partial firing.", topic: "neural-communication", difficulty: 1 },
    { id: "nc-03", question: "What is the approximate width of a synaptic cleft?", options: ["20 micrometers", "20 nanometers", "20 millimeters", "2 nanometers"], answer: 1, explanation: "The synaptic cleft is approximately 20 nanometers wide — neurotransmitters must cross this tiny gap to transmit signals between neurons.", topic: "neural-communication", difficulty: 2 },
    { id: "nc-04", question: "What is the brain's main excitatory neurotransmitter?", options: ["GABA", "Dopamine", "Glutamate", "Serotonin"], answer: 2, explanation: "Glutamate is the brain's main excitatory neurotransmitter, involved in learning, memory, and synaptic plasticity.", topic: "neural-communication", difficulty: 1 },
    { id: "nc-05", question: "What is the brain's main inhibitory neurotransmitter?", options: ["Glutamate", "Dopamine", "Acetylcholine", "GABA"], answer: 3, explanation: "GABA (gamma-aminobutyric acid) is the brain's main inhibitory neurotransmitter, preventing over-excitation of neural circuits.", topic: "neural-communication", difficulty: 1 },
    { id: "nc-06", question: "What is saltatory conduction?", options: ["Signal jumping between nodes of Ranvier along myelinated axons", "Signal transmission through the cell body", "Backward signal propagation", "Signal transmission through dendrites"], answer: 0, explanation: "Saltatory conduction is the process where action potentials 'jump' between nodes of Ranvier along myelinated axons, dramatically increasing signal speed.", topic: "neural-communication", difficulty: 2 },
    { id: "nc-07", question: "Hebb's Rule is often summarized as:", options: ["Use it or lose it", "Neurons that fire together wire together", "All or nothing", "Survival of the fittest"], answer: 1, explanation: "Hebb's Rule states that when two neurons repeatedly fire together, the synaptic connection between them strengthens — 'neurons that fire together wire together.'", topic: "neural-communication", difficulty: 1 },
    { id: "nc-08", question: "What is the maximum speed of neural signal transmission?", options: ["12 m/s", "120 m/s", "1200 m/s", "12000 m/s"], answer: 1, explanation: "Neural signals can travel at up to 120 m/s (about 268 mph) along heavily myelinated axons.", topic: "neural-communication", difficulty: 2 },
    { id: "nc-09", question: "Which neurotransmitter is most associated with reward, motivation, and addiction?", options: ["Serotonin", "GABA", "Dopamine", "Norepinephrine"], answer: 2, explanation: "Dopamine is central to the brain's reward system, driving motivation and pleasure. Dysregulation is implicated in addiction and Parkinson's disease.", topic: "neural-communication", difficulty: 1 },
    { id: "nc-10", question: "What is Long-Term Potentiation (LTP)?", options: ["A type of brain damage", "Strengthening of synapses through repeated stimulation", "Weakening of neural connections", "A sleep disorder"], answer: 1, explanation: "LTP is the strengthening of synaptic connections through repeated co-activation. It's considered the primary biological mechanism underlying learning and memory.", topic: "neural-communication", difficulty: 2 }
  ],
  "memory-learning": [
    { id: "ml-01", question: "How many items can working memory typically hold at once?", options: ["About 2", "About 4", "About 10", "About 20"], answer: 1, explanation: "Working memory can hold roughly 4 items (revised from Miller's original 7±2). This is the brain's mental workspace in the prefrontal cortex.", topic: "memory-learning", difficulty: 1 },
    { id: "ml-02", question: "During which sleep stage does memory consolidation primarily occur?", options: ["REM sleep", "Slow-wave (deep) sleep", "Light sleep (Stage 1)", "All stages equally"], answer: 1, explanation: "During slow-wave sleep, the hippocampus 'replays' the day's experiences, strengthening important neural pathways and pruning irrelevant ones.", topic: "memory-learning", difficulty: 2 },
    { id: "ml-03", question: "What are the two main types of long-term memory?", options: ["Short and long", "Explicit (declarative) and implicit (procedural)", "Visual and auditory", "Emotional and logical"], answer: 1, explanation: "Explicit/declarative memory covers facts and events (conscious recall). Implicit/procedural memory covers skills and habits (unconscious, like riding a bike).", topic: "memory-learning", difficulty: 1 },
    { id: "ml-04", question: "London taxi drivers famously have enlarged:", options: ["Amygdalae", "Cerebellums", "Hippocampi", "Prefrontal cortices"], answer: 2, explanation: "Studies show London taxi drivers have enlarged hippocampi from years of navigating complex city streets, demonstrating structural neuroplasticity.", topic: "memory-learning", difficulty: 2 },
    { id: "ml-05", question: "What is memory reconsolidation?", options: ["The process of storing new memories", "Memories being rebuilt and potentially altered each time they're recalled", "Forgetting old memories", "Transferring memories between hemispheres"], answer: 1, explanation: "Memory reconsolidation means each time you recall a memory, it becomes unstable and is re-stored — potentially with subtle alterations. This is why eyewitness testimony can be unreliable.", topic: "memory-learning", difficulty: 3 },
    { id: "ml-06", question: "What is the spacing effect in learning?", options: ["Learning more in larger rooms", "Distributed practice is more effective than massed practice", "Taking breaks harms learning", "Faster reading improves retention"], answer: 1, explanation: "The spacing effect shows that spreading learning over time (distributed practice) produces significantly better long-term retention than cramming (massed practice).", topic: "memory-learning", difficulty: 1 },
    { id: "ml-07", question: "Sensory memory lasts for approximately:", options: ["Milliseconds to seconds", "Minutes to hours", "Hours to days", "Days to weeks"], answer: 0, explanation: "Sensory memory is an ultra-brief trace lasting milliseconds to a few seconds — a fleeting snapshot of raw sensory input before it fades or is encoded.", topic: "memory-learning", difficulty: 1 },
    { id: "ml-08", question: "What role does the hippocampus play in memory?", options: ["Permanent storage of all memories", "Acts as an index, binding distributed cortical patterns", "Only stores emotional memories", "Only stores motor memories"], answer: 1, explanation: "The hippocampus doesn't store memories itself — it acts as an index that binds together the distributed cortical patterns that represent a memory.", topic: "memory-learning", difficulty: 2 },
    { id: "ml-09", question: "What is the term for the strengthening of neural pathways through experience?", options: ["Neural atrophy", "Neuroplasticity", "Neurodegeneration", "Neural stasis"], answer: 1, explanation: "Neuroplasticity is the brain's ability to physically change through experience — strengthening connections, creating new pathways, and even growing gray matter.", topic: "memory-learning", difficulty: 1 },
    { id: "ml-10", question: "Why does sleep deprivation devastate learning?", options: ["It damages neurons permanently", "It prevents memory consolidation during slow-wave sleep", "It destroys the hippocampus", "It only affects motor learning"], answer: 1, explanation: "Sleep deprivation prevents the hippocampal replay during slow-wave sleep that consolidates memories, dramatically impairing the transfer from short-term to long-term storage.", topic: "memory-learning", difficulty: 2 }
  ],
  "general-brain": [
    { id: "gb-01", question: "Approximately how many neurons does the human brain contain?", options: ["8.6 million", "860 million", "86 billion", "860 billion"], answer: 2, explanation: "The human brain contains approximately 86 billion neurons, each connected to thousands of others through synapses.", topic: "general", difficulty: 1 },
    { id: "gb-02", question: "What percentage of the body's energy does the brain consume?", options: ["5%", "10%", "20%", "40%"], answer: 2, explanation: "Despite being only about 2% of body weight, the brain consumes roughly 20% of the body's total energy.", topic: "general", difficulty: 1 },
    { id: "gb-03", question: "Which brain region contains over half of all neurons despite being only 10% of brain volume?", options: ["Frontal lobe", "Temporal lobe", "Cerebellum", "Brainstem"], answer: 2, explanation: "The cerebellum contains 50-80 billion neurons — more than all other brain regions combined — despite being only 10% of brain volume.", topic: "general", difficulty: 1 },
    { id: "gb-04", question: "What does the reticular activating system (RAS) control?", options: ["Movement", "Vision", "Alertness and consciousness", "Digestion"], answer: 2, explanation: "The RAS running through the brainstem is the master alertness switch. Damage to it can cause coma.", topic: "general", difficulty: 2 },
    { id: "gb-05", question: "The 'what' pathway (ventral stream) connects which brain areas?", options: ["Frontal to parietal", "Occipital to temporal", "Temporal to frontal", "Parietal to occipital"], answer: 1, explanation: "The ventral stream ('what' pathway) runs from the occipital lobe to the temporal lobe, identifying objects.", topic: "general", difficulty: 2 },
    { id: "gb-06", question: "What is the Default Mode Network active during?", options: ["Focused external tasks", "Daydreaming, self-reflection, and mind-wandering", "Sleep only", "Physical exercise"], answer: 1, explanation: "The Default Mode Network activates during daydreaming, self-reflection, mental time travel, and imagining others' perspectives.", topic: "general", difficulty: 2 },
    { id: "gb-07", question: "How many cranial nerves originate from the brainstem?", options: ["6", "8", "10", "12"], answer: 2, explanation: "Ten of the twelve cranial nerves originate from the brainstem, controlling facial expressions, eye movements, taste, hearing, and swallowing.", topic: "general", difficulty: 2 },
    { id: "gb-08", question: "What is hemispatial neglect?", options: ["Inability to see", "Inability to perceive one side of the world after right parietal damage", "Inability to hear on one side", "Inability to move one hand"], answer: 1, explanation: "Damage to the right parietal lobe can cause hemispatial neglect — the person genuinely cannot perceive the left side of their world.", topic: "general", difficulty: 3 },
    { id: "gb-09", question: "Which brain area acts as a 'switch operator' between the executive and default mode networks?", options: ["Hippocampus", "Amygdala", "Salience network", "Cerebellum"], answer: 2, explanation: "The salience network (anchored in the anterior insula and anterior cingulate cortex) toggles between the externally-focused executive network and internally-focused default mode network.", topic: "general", difficulty: 3 },
    { id: "gb-10", question: "What does the Global Workspace Theory propose about consciousness?", options: ["Consciousness is in the pineal gland", "Consciousness arises from information broadcast widely across the cortex", "Consciousness is only in the frontal lobe", "Consciousness doesn't exist"], answer: 1, explanation: "Global Workspace Theory proposes that conscious awareness occurs when information is 'broadcast' widely across the cortex, making it available to multiple cognitive processes simultaneously.", topic: "general", difficulty: 3 }
  ]
};

// Write question bank files
for (const [key, qs] of Object.entries(questions)) {
  w(`src/content/questions/${key}.json`, JSON.stringify(qs, null, 2));
}

console.log('\n── Question Bank ✓ (50 questions across 5 categories) ──');

// ══════════════════════════════════════════
// SM-2 SPACED REPETITION ALGORITHM
// ══════════════════════════════════════════
w('src/learning/srs.js', `/**
 * SM-2 Spaced Repetition Algorithm
 * Based on Piotr Wozniak's SuperMemo 2 algorithm.
 *
 * Quality ratings:
 *   0 = complete blackout
 *   1 = incorrect, but recognized answer
 *   2 = incorrect, but easy to recall after seeing answer
 *   3 = correct with significant difficulty
 *   4 = correct with some hesitation
 *   5 = perfect, instant recall
 */

/** Default card state for a new question */
export function createCard(questionId) {
  return {
    id: questionId,
    easeFactor: 2.5,  // Starting ease factor
    interval: 0,       // Days until next review
    repetition: 0,     // Number of consecutive correct reviews
    nextReview: Date.now(), // When to show next
    lastReview: null,
    totalReviews: 0,
    correctCount: 0,
    streak: 0,
  };
}

/**
 * Process a review and return updated card state
 * @param {Object} card - Current card state
 * @param {number} quality - Rating 0-5
 * @returns {Object} Updated card state
 */
export function reviewCard(card, quality) {
  var updated = Object.assign({}, card);
  updated.totalReviews++;
  updated.lastReview = Date.now();

  if (quality >= 3) {
    // Correct response
    updated.correctCount++;
    updated.streak++;

    if (updated.repetition === 0) {
      updated.interval = 1;
    } else if (updated.repetition === 1) {
      updated.interval = 6;
    } else {
      updated.interval = Math.round(updated.interval * updated.easeFactor);
    }
    updated.repetition++;
  } else {
    // Incorrect — reset
    updated.repetition = 0;
    updated.interval = 0;
    updated.streak = 0;
  }

  // Update ease factor (never below 1.3)
  updated.easeFactor = Math.max(1.3,
    updated.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Set next review time
  updated.nextReview = Date.now() + updated.interval * 24 * 60 * 60 * 1000;

  return updated;
}

/**
 * Get cards due for review
 * @param {Array} cards - All card states
 * @returns {Array} Cards due now, sorted by priority
 */
export function getDueCards(cards) {
  var now = Date.now();
  return cards
    .filter(function(c) { return c.nextReview <= now; })
    .sort(function(a, b) {
      // Priority: new cards first, then overdue, then by ease (harder first)
      if (a.repetition === 0 && b.repetition > 0) return -1;
      if (b.repetition === 0 && a.repetition > 0) return 1;
      return a.easeFactor - b.easeFactor;
    });
}

/**
 * Calculate overall mastery percentage
 * @param {Array} cards - All card states
 * @returns {number} 0-100 mastery percentage
 */
export function calculateMastery(cards) {
  if (cards.length === 0) return 0;
  var mastered = cards.filter(function(c) { return c.repetition >= 3 && c.easeFactor >= 2.0; }).length;
  var learning = cards.filter(function(c) { return c.repetition > 0 && c.repetition < 3; }).length;
  return Math.round(((mastered * 1.0 + learning * 0.4) / cards.length) * 100);
}

/**
 * Get learning stats
 */
export function getStats(cards) {
  var now = Date.now();
  return {
    total: cards.length,
    new: cards.filter(function(c) { return c.repetition === 0 && c.totalReviews === 0; }).length,
    learning: cards.filter(function(c) { return c.repetition > 0 && c.repetition < 3; }).length,
    mastered: cards.filter(function(c) { return c.repetition >= 3; }).length,
    due: cards.filter(function(c) { return c.nextReview <= now; }).length,
    mastery: calculateMastery(cards),
    totalReviews: cards.reduce(function(sum, c) { return sum + c.totalReviews; }, 0),
    longestStreak: Math.max.apply(null, cards.map(function(c) { return c.streak; }).concat([0])),
  };
}
`);

console.log('── SM-2 Algorithm ✓ ──');

// ══════════════════════════════════════════
// INDEXEDDB PROGRESS STORAGE
// ══════════════════════════════════════════
w('src/learning/progress.js', `/**
 * IndexedDB Progress Storage
 * Stores SRS card states, quiz history, and user settings.
 */

var DB_NAME = 'insidethebrain';
var DB_VERSION = 1;

function openDB() {
  return new Promise(function(resolve, reject) {
    var request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = function() { reject(request.error); };
    request.onsuccess = function() { resolve(request.result); };
    request.onupgradeneeded = function(event) {
      var db = event.target.result;
      if (!db.objectStoreNames.contains('cards')) {
        db.createObjectStore('cards', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        var sessions = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        sessions.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}

/** Save a card state */
export async function saveCard(card) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction('cards', 'readwrite');
    tx.objectStore('cards').put(card);
    tx.oncomplete = function() { resolve(); };
    tx.onerror = function() { reject(tx.error); };
  });
}

/** Save multiple cards */
export async function saveCards(cards) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction('cards', 'readwrite');
    var store = tx.objectStore('cards');
    cards.forEach(function(c) { store.put(c); });
    tx.oncomplete = function() { resolve(); };
    tx.onerror = function() { reject(tx.error); };
  });
}

/** Get all card states */
export async function getAllCards() {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction('cards', 'readonly');
    var request = tx.objectStore('cards').getAll();
    request.onsuccess = function() { resolve(request.result); };
    request.onerror = function() { reject(request.error); };
  });
}

/** Get a single card */
export async function getCard(id) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction('cards', 'readonly');
    var request = tx.objectStore('cards').get(id);
    request.onsuccess = function() { resolve(request.result); };
    request.onerror = function() { reject(request.error); };
  });
}

/** Save a quiz session */
export async function saveSession(session) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction('sessions', 'readwrite');
    tx.objectStore('sessions').add(Object.assign({ date: Date.now() }, session));
    tx.oncomplete = function() { resolve(); };
    tx.onerror = function() { reject(tx.error); };
  });
}

/** Get all sessions */
export async function getAllSessions() {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction('sessions', 'readonly');
    var request = tx.objectStore('sessions').getAll();
    request.onsuccess = function() { resolve(request.result); };
    request.onerror = function() { reject(request.error); };
  });
}

/** Clear all data */
export async function clearAll() {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(['cards', 'sessions', 'settings'], 'readwrite');
    tx.objectStore('cards').clear();
    tx.objectStore('sessions').clear();
    tx.objectStore('settings').clear();
    tx.oncomplete = function() { resolve(); };
    tx.onerror = function() { reject(tx.error); };
  });
}
`);

console.log('── IndexedDB Progress ✓ ──');

// ══════════════════════════════════════════
// EXPORT / IMPORT
// ══════════════════════════════════════════
w('src/learning/export.js', `/**
 * Export/Import learning progress as JSON or Markdown
 */
import { getAllCards, saveCards, getAllSessions, clearAll } from './progress.js';
import { getStats } from './srs.js';

/** Export progress as JSON */
export async function exportJSON() {
  var cards = await getAllCards();
  var sessions = await getAllSessions();
  var stats = getStats(cards);
  var data = {
    version: '2.0.0',
    exportDate: new Date().toISOString(),
    stats: stats,
    cards: cards,
    sessions: sessions,
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'brain-progress-' + formatDate(new Date()) + '.json');
}

/** Export progress as Markdown report */
export async function exportMarkdown() {
  var cards = await getAllCards();
  var sessions = await getAllSessions();
  var stats = getStats(cards);
  var lines = [
    '# Inside the Brain — Learning Progress',
    '',
    'Exported: ' + new Date().toISOString(),
    '',
    '## Stats',
    '- Total questions: ' + stats.total,
    '- Mastered: ' + stats.mastered,
    '- Learning: ' + stats.learning,
    '- New: ' + stats.new,
    '- Due for review: ' + stats.due,
    '- Mastery: ' + stats.mastery + '%',
    '- Total reviews: ' + stats.totalReviews,
    '- Longest streak: ' + stats.longestStreak,
    '',
    '## Card Details',
    '| Question ID | Ease | Interval (days) | Reps | Streak |',
    '|---|---|---|---|---|',
  ];
  cards.forEach(function(c) {
    lines.push('| ' + c.id + ' | ' + c.easeFactor.toFixed(2) + ' | ' + c.interval + ' | ' + c.repetition + ' | ' + c.streak + ' |');
  });
  var blob = new Blob([lines.join('\\n')], { type: 'text/markdown' });
  downloadBlob(blob, 'brain-progress-' + formatDate(new Date()) + '.md');
}

/** Import progress from JSON file */
export async function importJSON(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = async function(e) {
      try {
        var data = JSON.parse(e.target.result);
        if (!data.cards || !Array.isArray(data.cards)) {
          reject(new Error('Invalid progress file'));
          return;
        }
        await clearAll();
        await saveCards(data.cards);
        resolve({ imported: data.cards.length, date: data.exportDate });
      } catch (err) { reject(err); }
    };
    reader.onerror = function() { reject(reader.error); };
    reader.readAsText(file);
  });
}

function downloadBlob(blob, filename) {
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
`);

console.log('── Export/Import ✓ ──');

// ══════════════════════════════════════════
// QUIZ PAGE MODULE (full implementation)
// ══════════════════════════════════════════
w('src/pages/quiz.js', `import '../main.js';
import { createCard, reviewCard, getDueCards, getStats } from '../learning/srs.js';
import { getAllCards, saveCard, saveCards, saveSession } from '../learning/progress.js';
import { exportJSON, exportMarkdown, importJSON } from '../learning/export.js';

// Load all questions
var questionModules = import.meta.glob('../content/questions/*.json', { eager: true });
var allQuestions = [];
Object.values(questionModules).forEach(function(m) {
  var qs = m.default || m;
  if (Array.isArray(qs)) allQuestions = allQuestions.concat(qs);
});

var container = document.getElementById('quiz-container');
var state = { cards: [], currentQ: null, currentCard: null, answered: false, sessionCorrect: 0, sessionTotal: 0, mode: 'menu' };

async function init() {
  state.cards = await getAllCards();
  // Initialize cards for any new questions
  var existingIds = {};
  state.cards.forEach(function(c) { existingIds[c.id] = true; });
  var newCards = [];
  allQuestions.forEach(function(q) {
    if (!existingIds[q.id]) {
      var card = createCard(q.id);
      newCards.push(card);
      state.cards.push(card);
    }
  });
  if (newCards.length > 0) await saveCards(newCards);
  showMenu();
}

function getQuestion(id) {
  return allQuestions.find(function(q) { return q.id === id; });
}

function showMenu() {
  state.mode = 'menu';
  var stats = getStats(state.cards);
  var due = getDueCards(state.cards);
  container.innerHTML = [
    '<div class="quiz-menu">',
    '  <div class="quiz-stats-grid">',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--plum-300)">' + stats.mastery + '%</span><span class="quiz-stat-label">Mastery</span></div>',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--teal)">' + stats.mastered + '</span><span class="quiz-stat-label">Mastered</span></div>',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--gold-300)">' + stats.learning + '</span><span class="quiz-stat-label">Learning</span></div>',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--text-muted)">' + stats.new + '</span><span class="quiz-stat-label">New</span></div>',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--coral)">' + stats.due + '</span><span class="quiz-stat-label">Due Now</span></div>',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--sky)">' + stats.totalReviews + '</span><span class="quiz-stat-label">Reviews</span></div>',
    '  </div>',
    '  <div class="quiz-mastery-bar"><div class="quiz-mastery-fill" style="width:' + stats.mastery + '%"></div></div>',
    '  <div class="quiz-actions">',
    due.length > 0 ? '    <button class="btn-primary" id="q-review">Review Due (' + due.length + ') ⚡</button>' : '    <button class="btn-primary" id="q-review" disabled style="opacity:0.5">No Cards Due ✓</button>',
    '    <button class="btn-outline" id="q-practice">Practice All 🧠</button>',
    '    <button class="btn-outline" id="q-new">New Cards Only 🆕</button>',
    '  </div>',
    '  <div class="quiz-tools">',
    '    <button class="quiz-tool-btn" id="q-export-json">Export JSON</button>',
    '    <button class="quiz-tool-btn" id="q-export-md">Export Markdown</button>',
    '    <label class="quiz-tool-btn" id="q-import-label">Import<input type="file" accept=".json" id="q-import" style="display:none"></label>',
    '  </div>',
    '</div>',
  ].join('\\n');

  var reviewBtn = document.getElementById('q-review');
  if (reviewBtn && due.length > 0) reviewBtn.addEventListener('click', function() { startQuiz('due'); });
  var practiceBtn = document.getElementById('q-practice');
  if (practiceBtn) practiceBtn.addEventListener('click', function() { startQuiz('all'); });
  var newBtn = document.getElementById('q-new');
  if (newBtn) newBtn.addEventListener('click', function() { startQuiz('new'); });

  document.getElementById('q-export-json').addEventListener('click', exportJSON);
  document.getElementById('q-export-md').addEventListener('click', exportMarkdown);
  document.getElementById('q-import').addEventListener('change', async function(e) {
    if (e.target.files[0]) {
      try {
        var result = await importJSON(e.target.files[0]);
        alert('Imported ' + result.imported + ' cards from ' + result.date);
        state.cards = await getAllCards();
        showMenu();
      } catch(err) { alert('Import failed: ' + err.message); }
    }
  });
}

function startQuiz(mode) {
  state.sessionCorrect = 0;
  state.sessionTotal = 0;
  var pool;
  if (mode === 'due') {
    pool = getDueCards(state.cards);
  } else if (mode === 'new') {
    pool = state.cards.filter(function(c) { return c.repetition === 0 && c.totalReviews === 0; });
  } else {
    pool = state.cards.slice();
    // Shuffle
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = pool[i]; pool[i] = pool[j]; pool[j] = temp;
    }
  }
  state.pool = pool;
  state.poolIdx = 0;
  showNextQuestion();
}

function showNextQuestion() {
  if (state.poolIdx >= state.pool.length) {
    showResults();
    return;
  }
  state.answered = false;
  state.currentCard = state.pool[state.poolIdx];
  state.currentQ = getQuestion(state.currentCard.id);

  if (!state.currentQ) {
    state.poolIdx++;
    showNextQuestion();
    return;
  }

  var q = state.currentQ;
  var progress = (state.poolIdx + 1) + ' / ' + state.pool.length;
  var diffStars = '';
  for (var d = 0; d < q.difficulty; d++) diffStars += '★';
  for (var d2 = q.difficulty; d2 < 3; d2++) diffStars += '☆';

  container.innerHTML = [
    '<div class="quiz-card-wrap">',
    '  <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + ((state.poolIdx / state.pool.length) * 100) + '%"></div></div>',
    '  <div class="quiz-header-row">',
    '    <span class="quiz-counter">' + progress + '</span>',
    '    <span class="quiz-diff">' + diffStars + '</span>',
    '    <button class="quiz-exit-btn" id="q-exit">✕</button>',
    '  </div>',
    '  <div class="quiz-question">' + q.question + '</div>',
    '  <div class="quiz-options" id="quiz-options">',
    q.options.map(function(opt, i) {
      return '    <button class="quiz-option" data-idx="' + i + '">' + String.fromCharCode(65 + i) + '. ' + opt + '</button>';
    }).join('\\n'),
    '  </div>',
    '  <div class="quiz-feedback" id="quiz-feedback" style="display:none"></div>',
    '  <button class="btn-primary quiz-next-btn" id="q-next" style="display:none">Next →</button>',
    '</div>',
  ].join('\\n');

  document.querySelectorAll('.quiz-option').forEach(function(btn) {
    btn.addEventListener('click', function() { handleAnswer(parseInt(btn.dataset.idx)); });
  });
  document.getElementById('q-exit').addEventListener('click', function() {
    if (state.sessionTotal > 0) showResults();
    else showMenu();
  });
}

function handleAnswer(selectedIdx) {
  if (state.answered) return;
  state.answered = true;
  state.sessionTotal++;
  var q = state.currentQ;
  var correct = selectedIdx === q.answer;
  if (correct) state.sessionCorrect++;

  // SM-2 quality rating
  var quality = correct ? 4 : 1;
  var updated = reviewCard(state.currentCard, quality);
  // Update in state
  for (var i = 0; i < state.cards.length; i++) {
    if (state.cards[i].id === updated.id) { state.cards[i] = updated; break; }
  }
  saveCard(updated);

  // Highlight options
  document.querySelectorAll('.quiz-option').forEach(function(btn) {
    var idx = parseInt(btn.dataset.idx);
    btn.disabled = true;
    if (idx === q.answer) btn.classList.add('correct');
    else if (idx === selectedIdx && !correct) btn.classList.add('incorrect');
  });

  // Show feedback
  var fb = document.getElementById('quiz-feedback');
  fb.style.display = 'block';
  fb.innerHTML = (correct ? '<strong style="color:var(--sage)">✓ Correct!</strong>' : '<strong style="color:var(--coral)">✗ Incorrect</strong>') + '<p>' + q.explanation + '</p>';

  var nextBtn = document.getElementById('q-next');
  nextBtn.style.display = 'inline-flex';
  nextBtn.addEventListener('click', function() {
    state.poolIdx++;
    showNextQuestion();
  });
}

function showResults() {
  var pct = state.sessionTotal > 0 ? Math.round((state.sessionCorrect / state.sessionTotal) * 100) : 0;
  var stats = getStats(state.cards);

  saveSession({ correct: state.sessionCorrect, total: state.sessionTotal, mastery: stats.mastery });

  var grade = pct >= 90 ? '🌟 Outstanding!' : pct >= 70 ? '👍 Great job!' : pct >= 50 ? '📚 Keep practicing!' : '💪 Don\\'t give up!';

  container.innerHTML = [
    '<div class="quiz-results">',
    '  <h2>' + grade + '</h2>',
    '  <div class="quiz-score-ring">',
    '    <svg viewBox="0 0 120 120">',
    '      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>',
    '      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--plum-300)" stroke-width="8" stroke-dasharray="' + (326.7 * pct / 100) + ' 326.7" stroke-linecap="round" transform="rotate(-90 60 60)" style="transition:stroke-dasharray 1s ease"/>',
    '    </svg>',
    '    <span class="quiz-score-text">' + pct + '%</span>',
    '  </div>',
    '  <p>' + state.sessionCorrect + ' correct out of ' + state.sessionTotal + ' questions</p>',
    '  <div class="quiz-stats-grid" style="margin-top:24px">',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--plum-300)">' + stats.mastery + '%</span><span class="quiz-stat-label">Overall Mastery</span></div>',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--teal)">' + stats.mastered + '</span><span class="quiz-stat-label">Mastered</span></div>',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--coral)">' + stats.due + '</span><span class="quiz-stat-label">Due Now</span></div>',
    '  </div>',
    '  <div class="quiz-actions" style="margin-top:24px">',
    '    <button class="btn-primary" id="q-again">Quiz Again 🔄</button>',
    '    <button class="btn-outline" id="q-menu">Back to Menu</button>',
    '  </div>',
    '</div>',
  ].join('\\n');

  document.getElementById('q-again').addEventListener('click', function() { startQuiz('all'); });
  document.getElementById('q-menu').addEventListener('click', showMenu);
}

init();
`);

console.log('── Quiz Page ✓ ──');

// ══════════════════════════════════════════
// QUIZ CSS (append to components.css)
// ══════════════════════════════════════════
w('src/styles/quiz.css', `/* ── QUIZ STYLES ── */
.quiz-menu, .quiz-card-wrap, .quiz-results {
  max-width: 680px; margin: 0 auto; padding: var(--sp-8) var(--sp-6);
  position: relative; z-index: 1;
}
.quiz-stats-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--sp-4); margin-bottom: var(--sp-6);
}
.quiz-stat { text-align: center; padding: var(--sp-4); background: var(--bg-card); border: 1px solid var(--line); border-radius: var(--radius-md); }
.quiz-stat-num { font-family: var(--font-heading); font-size: var(--fs-2xl); font-weight: 600; display: block; }
.quiz-stat-label { font-size: var(--fs-xs); color: var(--text-muted); margin-top: var(--sp-1); }
.quiz-mastery-bar { width: 100%; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; margin-bottom: var(--sp-8); overflow: hidden; }
.quiz-mastery-fill { height: 100%; background: linear-gradient(90deg, var(--plum-500), var(--teal)); border-radius: 4px; transition: width 0.8s var(--ease-out); }
.quiz-actions { display: flex; gap: var(--sp-4); justify-content: center; flex-wrap: wrap; }
.quiz-tools { display: flex; gap: var(--sp-3); justify-content: center; margin-top: var(--sp-8); flex-wrap: wrap; }
.quiz-tool-btn { appearance: none; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: var(--text-muted); font-family: var(--font-body); font-size: var(--fs-xs); padding: var(--sp-2) var(--sp-4); border-radius: var(--radius-sm); cursor: pointer; transition: all var(--dur-fast); }
.quiz-tool-btn:hover { background: rgba(255,255,255,0.08); color: var(--text); }

/* Question card */
.quiz-progress-bar { width: 100%; height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; margin-bottom: var(--sp-5); }
.quiz-progress-fill { height: 100%; background: var(--plum-300); border-radius: 2px; transition: width 0.4s var(--ease-out); }
.quiz-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--sp-6); }
.quiz-counter { font-size: var(--fs-sm); color: var(--text-muted); }
.quiz-diff { font-size: var(--fs-sm); color: var(--gold-500); letter-spacing: 2px; }
.quiz-exit-btn { appearance: none; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: var(--fs-sm); transition: all var(--dur-fast); }
.quiz-exit-btn:hover { background: rgba(255,255,255,0.12); color: var(--text); }
.quiz-question { font-family: var(--font-heading); font-size: var(--fs-xl); font-weight: 500; line-height: 1.4; margin-bottom: var(--sp-6); color: var(--text); }
.quiz-options { display: flex; flex-direction: column; gap: var(--sp-3); }
.quiz-option {
  appearance: none; text-align: left;
  background: var(--bg-card); border: 1px solid var(--line);
  color: var(--text); font-family: var(--font-body); font-size: var(--fs-base);
  padding: var(--sp-4) var(--sp-5); border-radius: var(--radius-md);
  cursor: pointer; transition: all var(--dur-normal); line-height: 1.5;
}
.quiz-option:hover:not(:disabled) { background: var(--bg-raised); border-color: var(--plum-500); transform: translateX(4px); }
.quiz-option.correct { background: rgba(139,191,159,0.15); border-color: var(--sage); color: var(--sage); }
.quiz-option.incorrect { background: rgba(232,123,138,0.12); border-color: var(--coral); color: var(--coral); }
.quiz-option:disabled { cursor: default; opacity: 0.7; }
.quiz-option:disabled:not(.correct):not(.incorrect) { opacity: 0.4; }

/* Feedback */
.quiz-feedback {
  margin-top: var(--sp-5); padding: var(--sp-4) var(--sp-5);
  background: var(--bg-card); border: 1px solid var(--line);
  border-radius: var(--radius-md); font-size: var(--fs-sm); line-height: 1.7;
  animation: fadeSlideIn 0.3s ease;
}
.quiz-feedback p { margin: var(--sp-2) 0 0; max-width: none; color: var(--text-muted); }
.quiz-next-btn { margin-top: var(--sp-5); }

/* Results */
.quiz-results { text-align: center; }
.quiz-results h2 { font-size: var(--fs-2xl); margin-bottom: var(--sp-6); }
.quiz-score-ring { position: relative; width: 140px; height: 140px; margin: 0 auto var(--sp-6); }
.quiz-score-ring svg { width: 100%; height: 100%; }
.quiz-score-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-family: var(--font-heading); font-size: var(--fs-2xl); font-weight: 600; color: var(--plum-300); }
.quiz-results > p { text-align: center; margin: 0 auto var(--sp-2); }

@keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`);

console.log('── Quiz CSS ✓ ──');

// ══════════════════════════════════════════
// AI TUTOR DRAWER
// ══════════════════════════════════════════
w('src/components/tutor-drawer.js', `/**
 * AI Tutor Drawer — Ask questions grounded in course content.
 * Only visible when VITE_AI_ENABLED=true and server has API key.
 */

export function initTutorDrawer() {
  var fab = document.createElement('button');
  fab.className = 'tutor-fab';
  fab.setAttribute('data-ai', 'true');
  fab.setAttribute('aria-label', 'Open AI Tutor');
  fab.innerHTML = '\\ud83e\\udde0';
  fab.title = 'Ask the AI Tutor';
  document.body.appendChild(fab);

  var drawer = document.createElement('div');
  drawer.className = 'tutor-drawer';
  drawer.setAttribute('data-ai', 'true');
  drawer.innerHTML = [
    '<div class="tutor-header">',
    '  <h3>\\ud83e\\udde0 AI Tutor</h3>',
    '  <span class="tutor-badge">Grounded in course content</span>',
    '  <button class="tutor-close" id="tutor-close">\\u2715</button>',
    '</div>',
    '<div class="tutor-messages" id="tutor-messages">',
    '  <div class="tutor-msg tutor-msg-ai">Hi! I can answer questions about neuroscience based on the course material. What would you like to know?</div>',
    '</div>',
    '<form class="tutor-input-form" id="tutor-form">',
    '  <input type="text" class="tutor-input" id="tutor-input" placeholder="Ask about the brain..." maxlength="1000" autocomplete="off">',
    '  <button type="submit" class="tutor-send">\\u2192</button>',
    '</form>',
  ].join('\\n');
  document.body.appendChild(drawer);

  var isOpen = false;
  fab.addEventListener('click', function() { isOpen = !isOpen; drawer.classList.toggle('open', isOpen); fab.classList.toggle('active', isOpen); });
  document.getElementById('tutor-close').addEventListener('click', function() { isOpen = false; drawer.classList.remove('open'); fab.classList.remove('active'); });

  var form = document.getElementById('tutor-form');
  var input = document.getElementById('tutor-input');
  var messagesEl = document.getElementById('tutor-messages');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = '';

    // Add user message
    var userMsg = document.createElement('div');
    userMsg.className = 'tutor-msg tutor-msg-user';
    userMsg.textContent = text;
    messagesEl.appendChild(userMsg);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Add loading
    var loadingMsg = document.createElement('div');
    loadingMsg.className = 'tutor-msg tutor-msg-ai tutor-loading';
    loadingMsg.textContent = 'Thinking...';
    messagesEl.appendChild(loadingMsg);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      var res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      var data = await res.json();
      loadingMsg.classList.remove('tutor-loading');
      loadingMsg.textContent = data.reply || data.message || 'AI features are not yet configured. Set ANTHROPIC_API_KEY in your .env file to enable the tutor.';
    } catch (err) {
      loadingMsg.classList.remove('tutor-loading');
      loadingMsg.textContent = 'Could not reach the AI server. Make sure the API server is running (npm run dev:api).';
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}
`);

w('src/styles/tutor.css', `/* ── AI TUTOR DRAWER ── */
.tutor-fab {
  position: fixed; bottom: var(--sp-6); right: var(--sp-6);
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, var(--plum-500), var(--plum-700));
  border: none; color: #fff; font-size: 1.5rem;
  cursor: pointer; z-index: 10000;
  box-shadow: 0 4px 20px rgba(123,63,160,0.4);
  transition: transform var(--dur-normal), box-shadow var(--dur-normal);
  display: flex; align-items: center; justify-content: center;
}
.tutor-fab:hover { transform: scale(1.08); box-shadow: 0 6px 30px rgba(123,63,160,0.5); }
.tutor-fab.active { transform: scale(0.9); }
.tutor-drawer {
  position: fixed; bottom: var(--sp-6); right: var(--sp-6);
  width: 380px; height: 520px;
  background: var(--bg-surface); border: 1px solid var(--line);
  border-radius: var(--radius-lg); overflow: hidden;
  z-index: 10001; display: flex; flex-direction: column;
  box-shadow: var(--shadow-elevated);
  transform: translateY(120%) scale(0.9); opacity: 0;
  transition: transform 0.35s var(--ease-spring), opacity 0.25s ease;
  pointer-events: none;
}
.tutor-drawer.open { transform: translateY(0) scale(1); opacity: 1; pointer-events: all; }
.tutor-header {
  display: flex; align-items: center; gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-5);
  border-bottom: 1px solid var(--line);
  background: var(--bg-raised);
}
.tutor-header h3 { font-size: var(--fs-base); margin: 0; flex: 1; }
.tutor-badge { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: var(--sage); background: rgba(139,191,159,0.1); padding: 2px 8px; border-radius: var(--radius-full); }
.tutor-close { appearance: none; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: var(--fs-base); padding: var(--sp-1); }
.tutor-messages { flex: 1; overflow-y: auto; padding: var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-3); }
.tutor-msg { padding: var(--sp-3) var(--sp-4); border-radius: var(--radius-md); font-size: var(--fs-sm); line-height: 1.6; max-width: 85%; animation: fadeSlideIn 0.2s ease; }
.tutor-msg-user { background: rgba(123,63,160,0.2); color: var(--text); align-self: flex-end; border-bottom-right-radius: 4px; }
.tutor-msg-ai { background: var(--bg-card); color: var(--text-muted); align-self: flex-start; border-bottom-left-radius: 4px; }
.tutor-loading { animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
.tutor-input-form { display: flex; gap: var(--sp-2); padding: var(--sp-3) var(--sp-4); border-top: 1px solid var(--line); background: var(--bg-raised); }
.tutor-input { flex: 1; appearance: none; background: var(--bg-card); border: 1px solid var(--line); color: var(--text); font-family: var(--font-body); font-size: var(--fs-sm); padding: var(--sp-3) var(--sp-4); border-radius: var(--radius-sm); outline: none; }
.tutor-input:focus { border-color: var(--plum-500); }
.tutor-send { appearance: none; background: var(--plum-500); border: none; color: #fff; width: 36px; height: 36px; border-radius: var(--radius-sm); cursor: pointer; font-size: var(--fs-base); transition: background var(--dur-fast); }
.tutor-send:hover { background: var(--plum-400); }
@media (max-width: 500px) { .tutor-drawer { width: calc(100vw - 32px); right: 16px; bottom: 16px; } }
`);

console.log('── AI Tutor Drawer ✓ ──');
console.log('\\n\\ud83c\\udf89 Phase 8 complete! All remaining v2 features generated.');
