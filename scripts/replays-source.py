# Source for the hand-written replays in src/content/replays/.
# Run: python3 scripts/replays-source.py  (writes one JSON file per replay)
# Edit the JSON files directly if you prefer; this script is just an easier place to write long text.
import json, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'content', 'replays')
os.makedirs(OUT, exist_ok=True)

def src(title, authors, year, journal=None):
    d = {"title": title, "authors": authors, "year": year}
    if journal: d["journal"] = journal
    return d

KANDEL = src("Principles of Neural Science (6th ed.)", "Kandel et al.", 2021)

def beat(time, title, structures, text, chemicals=()):
    return {"time": time, "title": title, "structures": list(structures), "chemicals": list(chemicals), "text": text}

R = []

R.append({
  "id": "smell-memory",
  "order": 1,
  "moment": "I smelled fresh bread and suddenly remembered my grandmother’s kitchen.",
  "question": "Why can a smell bring back a memory so fast?",
  "summary": "Smell has an unusually direct line to the brain’s emotion and memory areas, so it can pull up a whole scene before you’ve even named the smell.",
  "beats": [
    beat("0 s", "Molecules land", ["olfactory-bulb"],
      "Tiny molecules from the bread drift into your nose and bind to smell receptors. Each receptor type responds to certain molecular shapes, and your olfactory bulb sorts the signals into a pattern that means fresh bread.",
      ["glutamate"]),
    beat("~0.2 s", "A shortcut to feeling", ["olfactory-bulb", "amygdala"],
      "Sight, sound and touch all stop at the thalamus, a relay station, before reaching the cortex. Smell doesn’t. Its signals go straight to smell cortex, only a step or two from the amygdala, so the smell picks up an emotional charge almost immediately."),
    beat("~0.4 s", "The index finds a match", ["hippocampus", "amygdala"],
      "Your hippocampus links this smell pattern to an old episode where the same smell was present. It starts pulling the stored pieces together: the warm oven, the tiles on the floor, your grandmother’s voice."),
    beat("~0.6 s", "Putting a name to it", ["orbitofrontal"],
      "The orbitofrontal cortex, just above your eyes, helps you consciously recognise the smell and decide it’s pleasant. Often the feeling of familiarity arrives before the word “bread” does."),
    beat("~1 s", "A whole scene rebuilt", ["hippocampus", "visual-cortex", "auditory-cortex", "prefrontal"],
      "Remembering isn’t playing back a recording. The hippocampus helps reactivate sights and sounds stored across your cortex, and your prefrontal cortex helps put them in order. You’re rebuilding the scene from fragments, which is why it feels vivid but may not be exact."),
    beat("a few seconds", "The warm, aching feeling", ["insula", "amygdala"],
      "Your body reacts to the memory as well as the smell. The insula registers the shift (a softening, maybe a lump in your throat), and that mix of memory and body feeling is what we call nostalgia."),
  ],
  "whyItFelt": "Smell-triggered memories feel different because of that wiring. They arrive with emotion already attached, and studies suggest they tend to come from earlier in life, often the first ten years, than memories triggered by words or pictures. That’s why a smell can feel like time travel rather than just remembering.",
  "tryThis": [
    {"title": "Anchor a memory with a scent", "text": "Wear or carry a distinctive smell during a moment you want to remember, like a trip. Smelling it later can help bring the experience back."},
    {"title": "Notice the order", "text": "Next time a smell grabs you, see whether the feeling arrives before you can name the smell. It often does."},
  ],
  "finePrint": [
    "Timings are rough estimates to show the order of events. Real brain activity overlaps and loops back on itself.",
    "“Skipping the thalamus” means smell skips the relay other senses use on their way to the cortex. Smell signals still pass through other areas first, such as piriform cortex.",
  ],
  "sources": [
    src("Smell your way back to childhood: autobiographical odor memory", "Willander & Larsson", 2006, "Psychonomic Bulletin & Review"),
    src("A naturalistic analysis of autobiographical memories triggered by olfactory, visual and auditory stimuli", "Herz", 2004, "Chemical Senses"),
    KANDEL,
  ],
})

R.append({
  "id": "procrastination",
  "order": 2,
  "moment": "I was supposed to study, but I ended up scrolling my phone for two hours.",
  "question": "Why do I scroll instead of doing what I need to do?",
  "summary": "Procrastination is less about laziness and more about avoiding a bad feeling. Your brain picks instant relief over a reward that’s days away.",
  "beats": [
    beat("0 s", "The task appears", ["visual-cortex", "prefrontal"],
      "You look at your notes. Your prefrontal cortex holds the goal (study for Friday), but the goal is abstract and the payoff is days away."),
    beat("~0.5 s", "A flicker of dread", ["amygdala", "insula", "cingulate"],
      "Your brain predicts how studying will feel: boring, hard, maybe a bit threatening if you’re worried about the result. The amygdala and insula flag that as unpleasant, and the anterior cingulate picks up the clash between “I should” and “I don’t want to”.",
      ["noradrenaline"]),
    beat("~1 s", "An easy way out", ["orbitofrontal", "reward-circuit"],
      "Your phone is right there. The orbitofrontal cortex rates it as nice, right now, while studying is good, but later. Brains naturally shrink the value of rewards that are far off, so the instant option wins more often than it should.",
      ["dopamine"]),
    beat("~2 s", "Relief", ["reward-circuit", "insula"],
      "You pick up the phone and the bad feeling eases straight away. That relief is itself rewarding, so your brain learns that avoiding the task works, at least for now.",
      ["dopamine"]),
    beat("the next 2 hours", "The loop", ["reward-circuit", "visual-cortex", "motor-cortex"],
      "Each swipe might bring something great, or nothing. Dopamine neurons respond strongly to rewards you can’t predict, so “maybe the next one” keeps you going. Your thumb is on autopilot while the goal slips out of working memory.",
      ["dopamine"]),
    beat("later", "The guilt", ["prefrontal", "cingulate", "amygdala"],
      "When you finally notice the time, your prefrontal cortex brings the goal back into focus. The clash returns, now with guilt added, which can make the task feel even worse next time."),
  ],
  "whyItFelt": "Procrastination isn’t laziness or bad time management. Researchers increasingly describe it as a mood problem: you’re dodging a bad feeling now and paying for it later. Your brain is doing what it evolved to do, which is to grab immediate relief, in a world that offers instant rewards everywhere.",
  "tryThis": [
    {"title": "Make the start tiny", "text": "Commit to just two minutes, or just opening the file. Starting is the hardest part, and the dread usually shrinks once you begin."},
    {"title": "Add friction to the phone", "text": "Put it in another room or log out of the app. Even a small barrier cuts down impulsive grabs."},
    {"title": "Name the feeling", "text": "Saying “I’m avoiding this because it feels overwhelming” can take the edge off and make the next step clearer."},
  ],
  "finePrint": [
    "The areas shown are the ones most often linked to emotion, conflict and reward in this research. Brain scans show associations, not an exact script.",
    "If putting things off is constant and getting in the way of your life, a teacher, counsellor or doctor can help. It’s very common and very fixable.",
  ],
  "sources": [
    src("Procrastination and the priority of short-term mood regulation", "Sirois & Pychyl", 2013, "Social and Personality Psychology Compass"),
    src("The nature of procrastination", "Steel", 2007, "Psychological Bulletin"),
    src("A neural substrate of prediction and reward", "Schultz, Dayan & Montague", 1997, "Science"),
  ],
})

R.append({
  "id": "doorway",
  "order": 3,
  "moment": "I walked into the kitchen and completely forgot why I went in there.",
  "question": "Why do I forget what I came into a room for?",
  "summary": "Your brain splits life into scenes, and a doorway marks the end of one. A goal you were holding can get filed away with the scene you just left.",
  "beats": [
    beat("0 s", "An intention", ["prefrontal", "hippocampus"],
      "On the sofa, you decide to fetch your charger. The goal goes into working memory, held by your prefrontal cortex, and it’s quietly tied to everything around you: the living room, the show you were watching."),
    beat("~3 s", "Walking on autopilot", ["motor-cortex", "cerebellum", "posterior-parietal"],
      "As you walk, your motor cortex and cerebellum handle the movement without you thinking about it. Your mind drifts to other things, so the goal now has to compete for space in working memory."),
    beat("~5 s", "Through the doorway", ["hippocampus", "visual-cortex"],
      "Walking through a doorway is what researchers call an event boundary. Your brain divides experience into chunks, and a new room signals that one chunk has ended. The hippocampus starts filing the old scene away."),
    beat("~6 s", "The goal gets left behind", ["prefrontal", "hippocampus"],
      "Because the intention was bound to the old scene, it gets filed away with it. Your prefrontal cortex is busy updating for the kitchen, and the thread back to “charger” is harder to grab."),
    beat("~7 s", "That blank feeling", ["cingulate", "prefrontal"],
      "You know you came for something. The anterior cingulate notices the gap between “I had a goal” and “I can’t find it”, and you get that odd, frustrating blank."),
    beat("~20 s", "Going back helps", ["hippocampus", "visual-cortex"],
      "Walk back to the sofa and the familiar sights reactivate the old scene. Memory often depends on context, so returning to the original place can bring the goal straight back: charger!"),
  ],
  "whyItFelt": "It feels like a glitch, but it’s a side effect of something useful. Splitting life into scenes helps you organise memories and focus on what’s happening now. The catch is that a fleeting goal can get stuck in the previous scene.",
  "tryThis": [
    {"title": "Say it out loud", "text": "Mutter “charger, charger” as you walk. Repeating it keeps the goal active in working memory."},
    {"title": "Picture it first", "text": "Before you stand up, imagine yourself picking up the charger. A vivid image is easier to carry through the doorway."},
    {"title": "Retrace your steps", "text": "If you forget, go back. Returning to the original context is one of the most reliable ways to recover the goal."},
  ],
  "finePrint": [
    "In lab studies, walking through a doorway causes a bit more forgetting than walking the same distance within one room. The effect is real but modest, and not every study finds it.",
    "Timings are rough and only show the order of events.",
  ],
  "sources": [
    src("Walking through doorways causes forgetting: further explorations", "Radvansky, Krawietz & Tamplin", 2011, "Quarterly Journal of Experimental Psychology"),
    src("The magical number 4 in short-term memory", "Cowan", 2001, "Behavioral and Brain Sciences"),
  ],
})

R.append({
  "id": "stage-nerves",
  "order": 4,
  "moment": "My heart was pounding and my mind went blank right before my presentation.",
  "question": "Why does my mind go blank when I’m nervous?",
  "summary": "Your alarm system treats an audience like a threat. The same chemicals that give you energy also make it harder for your planning area to hold on to your words.",
  "beats": [
    beat("0 s", "All eyes on you", ["visual-cortex", "face-area", "amygdala"],
      "You stand up and see faces turned towards you. Your amygdala reads being watched and judged as highly important, maybe even threatening."),
    beat("~0.2 s", "Alarm", ["amygdala", "hypothalamus", "brainstem"],
      "The amygdala signals the hypothalamus and brainstem. Brainstem neurons release noradrenaline across the brain, and you’re instantly on high alert, scanning for danger.",
      ["noradrenaline"]),
    beat("~1–2 s", "Body on full power", ["hypothalamus", "brainstem", "insula"],
      "Your nervous system tells your adrenal glands to release adrenaline. Your heart pounds, you breathe faster, your palms sweat and your mouth goes dry. The insula registers all of it, and you feel the butterflies.",
      ["adrenaline"]),
    beat("a few seconds", "The planner goes quiet", ["prefrontal"],
      "High levels of stress chemicals weaken the prefrontal cortex, the area holding your opening line in working memory. Control shifts towards faster, more habitual responses. That’s the blank.",
      ["noradrenaline", "dopamine"]),
    beat("minutes", "The slower wave", ["hypothalamus"],
      "A slower chain of hormones releases cortisol, which keeps energy available for the emergency. It’s why you can feel shaky for a while even after the talk is over.",
      ["cortisol"]),
    beat("~1 minute in", "Finding your feet", ["prefrontal", "insula", "brainstem"],
      "Once you get going, things usually settle. A slow breath and a few familiar sentences give your prefrontal cortex room to come back online, and the alarm fades."),
  ],
  "whyItFelt": "Your body is preparing for a physical threat, like a predator, not a room of classmates. The racing heart doesn’t mean you’re going to fail. It’s your body handing you energy. The blank mind happens because the chemicals that make you alert also make it harder to hold on to details.",
  "tryThis": [
    {"title": "Breathe out slowly", "text": "Make each exhale longer than the inhale, for example in for 4 and out for 6. Slow breathing is linked to calming the body’s alarm response."},
    {"title": "Call it excitement", "text": "In one well-known study, people who told themselves “I’m excited” performed better than those who tried to calm down. Excitement and nerves feel almost the same in the body."},
    {"title": "Learn your first line by heart", "text": "Know your opening sentence cold. Once you’re talking, momentum takes over."},
  ],
  "finePrint": [
    "Nerves before speaking are extremely common. If anxiety regularly stops you from doing things you want to do, a doctor, counsellor or therapist can help.",
    "Timings are approximate and only show the order of events.",
  ],
  "sources": [
    src("Stress signalling pathways that impair prefrontal cortex structure and function", "Arnsten", 2009, "Nature Reviews Neuroscience"),
    src("Get excited: reappraising pre-performance anxiety as excitement", "Brooks", 2014, "Journal of Experimental Psychology: General"),
    src("How breath-control can change your life: a systematic review on psycho-physiological correlates of slow breathing", "Zaccaro et al.", 2018, "Frontiers in Human Neuroscience"),
  ],
})

R.append({
  "id": "earworm",
  "order": 5,
  "moment": "A song got stuck in my head all day and I couldn’t make it stop.",
  "question": "Why do songs get stuck in my head?",
  "summary": "Imagining music uses many of the same areas as hearing it. A short, catchy fragment can loop on its own, especially when your mind is idle.",
  "beats": [
    beat("0 s", "The trigger", ["auditory-cortex", "hippocampus"],
      "Maybe you heard the song this morning, or a word reminded you of it. Earworms are often set off by recent listening, a memory, or even a mood."),
    beat("~0.5 s", "Hearing without sound", ["auditory-cortex"],
      "Your auditory cortex starts recreating the tune. Imagining music activates many of the same areas as actually hearing it, which is why an earworm can feel so real."),
    beat("~1 s", "The hook loops", ["auditory-cortex", "broca", "motor-cortex"],
      "It’s usually just a short fragment, often the chorus. Areas that plan speech and movement can join in, as if you’re silently singing along, and that helps keep the loop going."),
    beat("minutes", "An idle mind", ["prefrontal", "cingulate"],
      "Earworms tend to show up when your attention isn’t busy, like when you’re walking or washing up. With nothing else to grab your focus, the loop takes centre stage."),
    beat("hours", "Trying not to think of it", ["prefrontal", "cingulate"],
      "Telling yourself to stop can backfire. To check whether the song has gone, your brain has to look for it, which can bring it right back."),
  ],
  "whyItFelt": "Catchy songs tend to have simple, repetitive melodies with a slightly unusual twist, which makes them easy to replay. One idea is that the fragment feels unfinished, so your brain keeps returning to it, a bit like a question waiting for an answer.",
  "tryThis": [
    {"title": "Listen to the whole song", "text": "Hearing it all the way through may help close the loop."},
    {"title": "Chew gum", "text": "In one study, chewing gum reduced earworms, possibly because it keeps busy the mouth and jaw muscles used for silent singing."},
    {"title": "Give your brain a puzzle", "text": "A moderately hard task, like anagrams or sudoku, can crowd the song out. Too easy and it won’t work; too hard and the song creeps back."},
  ],
  "finePrint": [
    "Surveys suggest most people get an earworm at least once a week, so this is completely normal.",
    "Brain imaging shows imagined and heard music overlap, but the exact circuitry of earworms is still being studied.",
  ],
  "sources": [
    src("Sound of silence activates auditory cortex", "Kraemer et al.", 2005, "Nature"),
    src("How do earworms start? Classifying the everyday circumstances of involuntary musical imagery", "Williamson et al.", 2012, "Psychology of Music"),
    src("Dissecting an earworm: melodic features and song popularity predict involuntary musical imagery", "Jakubowski et al.", 2017, "Psychology of Aesthetics, Creativity, and the Arts"),
    src("Want to block earworms from conscious awareness? B(u)y gum!", "Beaman et al.", 2015, "Quarterly Journal of Experimental Psychology"),
  ],
})

R.append({
  "id": "catch-glass",
  "order": 6,
  "moment": "A glass slipped off the table and I caught it before I even thought about it.",
  "question": "How did I catch it before I even thought about it?",
  "summary": "Fast, practised movements run on circuits that don’t wait for conscious thought. Awareness arrives a moment after your hand is already moving.",
  "beats": [
    beat("0 ms", "Something moves", ["visual-cortex", "thalamus"],
      "Light from the falling glass hits your eyes. Within a few tens of milliseconds, signals pass through the thalamus to your visual cortex."),
    beat("~100 ms", "Motion detected", ["motion-area", "posterior-parietal"],
      "Your motion area picks up something dropping fast. The posterior parietal cortex works out where it is compared with your hand."),
    beat("~200 ms", "Launch", ["posterior-parietal", "motor-cortex"],
      "Without waiting for you to decide, your motor cortex sends commands down the spinal cord. At the muscles, acetylcholine triggers the contraction, and your hand shoots out.",
      ["acetylcholine"]),
    beat("~250 ms", "Corrections in flight", ["cerebellum", "motion-area"],
      "The cerebellum predicts where the glass will be and adjusts your hand’s path on the fly, faster than you could steer it on purpose."),
    beat("~400 ms", "Awareness catches up", ["prefrontal", "cingulate"],
      "Around now you consciously notice: glass falling! In lab studies, people start correcting a reach before they become aware of the change they’re reacting to."),
    beat("after", "The jolt", ["amygdala", "brainstem"],
      "Your heart jumps once it’s all over. The alarm system arrived a little late to help, but it will make sure you remember the near-miss.",
      ["adrenaline"]),
  ],
  "whyItFelt": "It feels like you acted without thinking, and in a sense you did. Quick, well-practised actions are handled by circuits that don’t wait for conscious thought. Awareness is more like a report that arrives after the action has started, which is why the catch feels almost magical.",
  "tryThis": [
    {"title": "Test your own speed", "text": "Try the reaction-time experiment in the Lab. Most people land somewhere between 200 and 300 milliseconds."},
    {"title": "Practice makes it automatic", "text": "Sports drills work because repetition builds fast, automatic routes, so less has to pass through slow, deliberate thinking."},
  ],
  "finePrint": [
    "Timings are approximate. Reaction speed varies with age, alertness, practice and how expected the event is.",
    "A glass falling from table height takes about 0.4 seconds to hit the floor, so a catch is fast but possible.",
  ],
  "sources": [
    src("Temporal dissociation of motor responses and subjective awareness", "Castiello, Paulignan & Jeannerod", 1991, "Brain"),
    src("Factors influencing the latency of simple reaction time", "Woods et al.", 2015, "Frontiers in Human Neuroscience"),
    KANDEL,
  ],
})

R.append({
  "id": "face-name",
  "order": 7,
  "moment": "I spotted my friend in a huge crowd but couldn’t remember her name for a second.",
  "question": "Why can I recognise a face but blank on the name?",
  "summary": "Recognising faces is fast and automatic. Names are arbitrary labels with few links to anything else, so they’re the first thing to slip.",
  "beats": [
    beat("0 ms", "Scanning", ["visual-cortex", "posterior-parietal"],
      "Your eyes jump across the crowd several times a second. Visual cortex handles each glimpse while your parietal cortex steers where to look next."),
    beat("~170 ms", "A face pops out", ["face-area"],
      "The fusiform face area responds. Brain recordings show a face-specific signal about 170 milliseconds after a face appears, fast enough that her face seems to jump out at you."),
    beat("~250 ms", "Familiar!", ["face-area", "amygdala", "hippocampus"],
      "The face matches a stored pattern. A sense of familiarity and warmth arrives straight away, as emotional areas recognise someone who matters to you."),
    beat("~400 ms", "Who is she?", ["hippocampus", "prefrontal"],
      "Next comes what you know about her: you met in class, she likes the same band. This knowledge is stored across the temporal lobes and recalled with help from the hippocampus and prefrontal cortex."),
    beat("~1 s", "The name won’t come", ["wernicke", "broca", "cingulate"],
      "Names are the last and weakest link. A name is an arbitrary label that isn’t connected to anything else about her, so finding it fails more easily. Your anterior cingulate notices you’re stuck: it’s on the tip of your tongue."),
    beat("~3 s", "Got it", ["broca", "prefrontal"],
      "Often the name turns up on its own a moment later, once you stop pushing. The sound of the word finally clicks into place, ready to say."),
  ],
  "whyItFelt": "Recognising faces is one of the brain’s oldest and most practised skills, so it’s fast and automatic. Names are different. If you learn that someone is a baker, that job comes with lots of linked knowledge (bread, early mornings, flour). If you learn her surname is Baker, it’s just a label. That’s why names slip first.",
  "tryThis": [
    {"title": "Build a link", "text": "When you learn a name, connect it to something: Maya, like the ancient Maya. Extra links give your brain more ways to find it."},
    {"title": "Use it straight away", "text": "Say the name back in conversation. Recalling it once soon after learning strengthens it."},
    {"title": "Stop pushing", "text": "If it’s stuck, think about something else. The answer often pops up on its own."},
  ],
  "finePrint": [
    "Some people have lifelong difficulty recognising faces (developmental prosopagnosia), estimated at about 2 in 100 people. It isn’t related to eyesight or intelligence.",
    "Timings are approximate and only show the order of events.",
  ],
  "sources": [
    src("The fusiform face area: a module in human extrastriate cortex specialized for face perception", "Kanwisher, McDermott & Chun", 1997, "Journal of Neuroscience"),
    src("Electrophysiological studies of face perception in humans", "Bentin et al.", 1996, "Journal of Cognitive Neuroscience"),
    src("The “tip of the tongue” phenomenon", "Brown & McNeill", 1966, "Journal of Verbal Learning and Verbal Behavior"),
    src("Putting names to faces", "McWeeny et al.", 1987, "British Journal of Psychology"),
  ],
})

R.append({
  "id": "tickle",
  "order": 8,
  "moment": "My friend can tickle me easily, but when I try to tickle myself, nothing happens.",
  "question": "Why can’t I tickle myself?",
  "summary": "Your brain predicts what your own movements will feel like and turns those sensations down. A tickle only works when it’s a surprise.",
  "beats": [
    beat("0 ms", "You decide to move", ["prefrontal", "motor-cortex"],
      "You reach for your own ribs. Your motor cortex sends commands to your arm and fingers."),
    beat("at the same moment", "A copy of the plan", ["motor-cortex", "cerebellum"],
      "A copy of that movement command goes to the cerebellum, like your brain sending itself a note: here’s what I’m about to do."),
    beat("~50 ms", "Prediction", ["cerebellum"],
      "The cerebellum predicts exactly what the touch will feel like: where, when and how hard."),
    beat("~100 ms", "Touch arrives, turned down", ["body-map", "cerebellum"],
      "The real touch signal reaches your body map. Because it matches the prediction, the response here is dialled down. No surprise, no tickle."),
    beat("by contrast", "When a friend does it", ["body-map", "amygdala", "insula"],
      "When someone else tickles you, there’s no prediction to cancel it out. The touch is unexpected, your body map responds fully, and you squirm and laugh."),
  ],
  "whyItFelt": "Your brain is constantly predicting the results of your own actions so it can focus on what’s unexpected. That’s useful: it’s how you can tell a spider on your arm from your own sleeve brushing it. Self-tickling fails because it’s too predictable.",
  "tryThis": [
    {"title": "Feel the difference", "text": "Lightly stroke your palm with your own finger, then have someone else do the same. The second usually feels stronger, because your brain couldn’t predict it."},
    {"title": "Add a delay", "text": "In one experiment, people tickled themselves through a robot. Adding a delay of about a fifth of a second made the touch feel more ticklish, because it no longer matched the prediction."},
  ],
  "finePrint": [
    "The robot studies used small groups of people, but many later studies support the idea that the brain dampens sensations it caused itself.",
  ],
  "sources": [
    src("Central cancellation of self-produced tickle sensation", "Blakemore, Wolpert & Frith", 1998, "Nature Neuroscience"),
    src("Spatio-temporal prediction modulates the perception of self-produced stimuli", "Blakemore, Frith & Wolpert", 1999, "Journal of Cognitive Neuroscience"),
  ],
})

for r in R:
    with open(os.path.join(OUT, r["id"] + ".json"), "w") as f:
        json.dump(r, f, ensure_ascii=False, indent=2)
print("wrote", len(R), "replays")
