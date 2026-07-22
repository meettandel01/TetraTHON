# 🎓 Adaptive Microlearning Engine & AI Doubt-Resolution Tutor
## Ideas, Architecture & Build Plan

---

## 📌 Problem Breakdown

Indian classrooms have students at wildly different levels in a single grade. Current platforms:
- Are one-size-fits-all (no personalization)
- Can't resolve doubts effectively (generic chatbots)
- Don't work offline or in low-bandwidth environments
- Don't visualize concept gaps through knowledge graphs

### Core Pain Points to Solve
1. **Level detection** — Where is the student right now?
2. **Adaptive pathing** — What should they learn next?
3. **Doubt resolution** — Text OR photo of handwritten question → smart explanation
4. **Concept gap mapping** — Visual knowledge graph of weak areas
5. **Offline capability** — Works in rural/low-connectivity schools

---

## 🧠 Feature Breakdown (Required by Problem Statement)

### Feature 1: Diagnostic Quiz (5-question probe)
- Auto-classify student as: **Foundational / Grade-Level / Advanced**
- Subject: Choose one STEM subject (e.g., Math or Science)
- Questions adapt dynamically based on answers
- Result feeds into learning path selection

### Feature 2: Adaptive Microlearning Paths
- 3 differentiated paths (one per level)
- Each path: 10-minute personalized micro-lessons
- 3 embedded practice questions per lesson
- Instant feedback loop after each question

### Feature 3: AI Doubt-Resolution Engine
- Input: Text OR photo of handwritten question
- OCR for handwritten text extraction
- Root concept identification from student's taxonomy
- Two explanation modes:
  - **Socratic** — Guided questioning
  - **Direct** — Step-by-step solution
- Maps resolved doubt → concept graph node

### Feature 4: Evaluator Dashboard
- Per-student level, completion rate, error patterns
- Session history with mastery progression
- Concept node visualization (knowledge graph)
- Works offline-capable / low-bandwidth mode

---

## 🛠️ Proposed Tech Stack

### Frontend
- **React + Vite** — Fast, modern SPA
- **Tailwind CSS** — Responsive, mobile-first design
- **Cytoscape.js / D3.js** — Knowledge graph visualization
- **React Flow** — Concept node mapping
- **IndexedDB / Service Workers** — Offline support (PWA)

### Backend
- **FastAPI (Python)** — API server, AI orchestration
- **SQLite (dev) / PostgreSQL (prod)** — Student data, session history

### AI Layer
- **Google Gemini API** — LLM for doubt resolution, Socratic explanations
- **Gemini Vision** — Handwritten question image analysis (OCR + understanding)
- **Custom classifier** — 5-question adaptive diagnostic logic
- **Sentence-Transformers** — Concept similarity & graph mapping

### Offline / Low-bandwidth
- **PWA (Progressive Web App)** — Installable, works offline
- **Pre-cached micro-lessons** — Service Worker caching strategy

---

## 🏗️ Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    STUDENT INTERFACE                     │
│  ┌───────────┐  ┌───────────────┐  ┌────────────────┐  │
│  │ Diagnostic│  │  Micro-Lesson │  │  Doubt Resolver│  │
│  │   Quiz    │  │    Player     │  │  (Text/Photo)  │  │
│  └─────┬─────┘  └──────┬────────┘  └───────┬────────┘  │
│        │               │                   │            │
│        └───────────────┴───────────────────┘            │
│                        │                                 │
│              ┌─────────▼──────────┐                     │
│              │  Knowledge Graph   │                     │
│              │  (Concept Map UI)  │                     │
│              └────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
                         │
                    FastAPI Backend
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    Gemini LLM     Gemini Vision    Concept DB
    (Explanations) (OCR + Doubt)   (Graph Store)
```

---

## 📋 Build Phases

### Phase 1 — Foundation (Days 1-2)
- [ ] Setup React + Vite frontend
- [ ] Setup FastAPI backend
- [ ] Design DB schema (students, sessions, concepts, doubts)
- [ ] Build design system (colors, typography, components)

### Phase 2 — Diagnostic Engine (Day 2-3)
- [ ] Question bank for chosen STEM subject
- [ ] 5-question adaptive quiz with branching logic
- [ ] Auto-classification algorithm (Foundational / Grade / Advanced)
- [ ] Level result screen with personalized message

### Phase 3 — Microlearning Module (Day 3-4)
- [ ] 3 learning paths (one per level)
- [ ] Micro-lesson viewer with progress tracking
- [ ] 3 embedded practice questions per lesson
- [ ] Instant feedback + mastery scoring

### Phase 4 — AI Doubt Resolver (Day 4-5)
- [ ] Text input doubt → Gemini API → Explanation
- [ ] Photo/handwriting upload → Gemini Vision → OCR → Explanation
- [ ] Socratic vs Direct mode toggle
- [ ] Root concept tagging from taxonomy

### Phase 5 — Knowledge Graph + Dashboard (Day 5-6)
- [ ] Concept node graph (Cytoscape.js)
- [ ] Dashboard with student analytics
- [ ] Session history + mastery progression
- [ ] Weak area highlighting on graph

### Phase 6 — Offline + Polish (Day 6-7)
- [ ] PWA setup (Service Worker, manifest)
- [ ] IndexedDB caching for lessons
- [ ] Low-bandwidth mode (reduced assets)
- [ ] UI polish + animations + responsive design

---

## 🎯 Subject Recommendation: **Class 8-10 Mathematics**
- Rich concept graph (Algebra → Quadratics → Polynomials etc.)
- Clear foundational vs advanced distinction
- Easy to create handwritten doubt examples
- Relatable for Indian classrooms

---

## 📊 Evaluation Criteria Alignment

| Criteria | Our Approach |
|---|---|
| **Problem Understanding** | Addresses level-diversity, offline constraints, doubt gap |
| **Proposed Approach** | Gemini AI + adaptive logic + PWA offline + graph viz |
| **Market Fit** | Target: 250M+ Indian school students, scalable SaaS model |

---

## 🚀 MVP Demo Flow (for Evaluators)

1. Student opens app → selects subject
2. Takes 5-question diagnostic → classified as "Grade-Level"
3. Sees personalized 10-min lesson
4. Submits a doubt (text or photo)
5. Gets Socratic OR Direct explanation
6. Concept graph updates showing weak node
7. Dashboard shows session history

---

## 💡 Unique Differentiators to Highlight

- **Dual input doubt resolution** (text + handwritten photo)
- **Offline-first PWA** — genuinely usable in rural India
- **Live concept graph** — visual learning gap diagnosis
- **Socratic mode** — teaches HOW to think, not just answers
- **OLlama fallback** — optional local LLM for full offline AI

