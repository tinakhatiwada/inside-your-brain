# 🧠 Inside the Brain v2 — All Features Complete

## ✅ Quiz Engine with SM-2 Spaced Repetition

````carousel
![Quiz Dashboard — 50 questions across 5 categories, mastery tracking, 3 quiz modes](C:/Users/sansk/.gemini/antigravity-ide/brain/834c6dd2-cf34-4a72-9801-c4dd604d190f/quiz_dashboard_1792941476135.png)
<!-- slide -->
![Quiz Question — Difficulty stars, progress bar, 4 answer options with hover animations](C:/Users/sansk/.gemini/antigravity-ide/brain/834c6dd2-cf34-4a72-9801-c4dd604d190f/quiz_question_1792941505467.png)
<!-- slide -->
![Answer Feedback — Correct answer highlighted green, detailed explanation, Next button](C:/Users/sansk/.gemini/antigravity-ide/brain/834c6dd2-cf34-4a72-9801-c4dd604d190f/quiz_feedback_1792941527203.png)
````

## What Was Built in This Phase

| Feature | Details |
|---------|---------|
| **50-Question Bank** | 10 questions each across: Frontal Lobe, Temporal Lobe, Neural Communication, Memory & Learning, General Brain |
| **SM-2 Algorithm** | Full SuperMemo 2 implementation with ease factor, intervals, and quality ratings |
| **3 Quiz Modes** | Review Due (SRS-prioritized), Practice All (shuffled), New Cards Only |
| **Answer Feedback** | Correct/incorrect highlighting with detailed scientific explanations |
| **Difficulty Stars** | ★★☆ rating system for each question (1-3 difficulty) |
| **Progress Bar** | Question counter and visual progress during quiz sessions |
| **Results Screen** | SVG score ring, session stats, overall mastery tracking |
| **IndexedDB Storage** | Persistent SRS card states, quiz sessions, and settings |
| **Export JSON** | Download full progress as JSON backup |
| **Export Markdown** | Download formatted progress report as `.md` |
| **Import** | Restore progress from JSON file |
| **AI Tutor Drawer** | Floating 🧠 button → slide-up chat panel (needs `ANTHROPIC_API_KEY` in `.env`) |

## Full Feature Checklist

| Feature | Status |
|---------|--------|
| Landing page with hero + portrait | ✅ |
| 3D Brain Explorer (Three.js) | ✅ |
| Clickable lobe info panels | ✅ |
| 7-Stage Thought Journey | ✅ |
| Learning Library (6 topics) | ✅ |
| SM-2 Spaced Repetition Quiz | ✅ **NEW** |
| 50-Question Bank (5 categories) | ✅ **NEW** |
| IndexedDB Progress Tracking | ✅ **NEW** |
| Export/Import (JSON + Markdown) | ✅ **NEW** |
| AI Tutor Drawer (UI ready) | ✅ **NEW** |
| Design system (plum/gold theme) | ✅ |
| Responsive navigation | ✅ |
| Accessibility (skip links, ARIA) | ✅ |

## To Enable AI Tutor

Create a `.env` file in the project root:
```
ANTHROPIC_API_KEY=sk-ant-...
```
Then run `npm run dev` (starts both Vite and the Express API server).

## Project: `C:\Users\sansk\Downloads\inside-the-brain`
## Running: `http://localhost:5173/`
