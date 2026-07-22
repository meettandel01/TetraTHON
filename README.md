# TetraTHON 🎓
## Adaptive Microlearning Engine & AI Doubt-Resolution Tutor

> An AI-powered personalized learning platform for Indian Class 8–10 Mathematics students.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧪 **Diagnostic Quiz** | 5-question adaptive quiz classifies students as Foundational / Grade-Level / Advanced |
| 📚 **Adaptive Lessons** | 10-minute personalized micro-lessons with embedded practice questions |
| 🤖 **AI Doubt Resolver** | Text OR photo input → Gemini AI → Socratic or Direct explanation |
| 📊 **Knowledge Graph** | Visual concept map with weak-area highlighting (Phase 5) |
| 📴 **PWA / Offline** | Progressive Web App for low-bandwidth Indian classrooms (Phase 6) |

---

## 🛠 Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS + Framer Motion
- **Backend**: FastAPI + SQLAlchemy + SQLite
- **AI**: Google Gemini 1.5 Flash (text + vision)
- **Graph**: Cytoscape.js / React Flow (Phase 5)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+

### 1. Setup Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Copy env file and add your Gemini API key
copy .env.example .env
# Edit .env → set GEMINI_API_KEY=your_key_here

# Start backend
uvicorn main:app --reload --port 8000
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Or use the startup script
```bash
# Double-click start.bat from the root TetraTHON folder
```

### Access Points
- **App**: http://localhost:5173
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🔑 Environment Variables

Create `backend/.env`:
```
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite:///./tetrathon.db
FRONTEND_URL=http://localhost:5173
```

Get your Gemini API key at: https://aistudio.google.com/app/apikey

---

## 📁 Project Structure

```
TetraTHON/
├── frontend/               # React + Vite
│   └── src/
│       ├── pages/          # LandingPage, QuizPage, ResultPage, LessonPage, DoubtPage, DashboardPage
│       ├── components/     # Navbar
│       ├── context/        # StudentContext (global state)
│       └── services/       # api.js (axios client)
│
├── backend/                # FastAPI
│   ├── main.py             # App entry, CORS, routers
│   ├── database.py         # SQLAlchemy models
│   └── routers/
│       ├── students.py     # Student CRUD
│       ├── quiz.py         # Question bank + classification
│       ├── lessons.py      # Differentiated content + sessions
│       ├── doubts.py       # Gemini AI integration
│       └── dashboard.py    # Analytics aggregation
│
└── start.bat               # One-click dev launcher
```

---

## 🗺 Phases

- [x] **Phase 1**: Foundation & Scaffold ✅
- [ ] **Phase 2**: Diagnostic Engine
- [ ] **Phase 3**: Microlearning Module
- [ ] **Phase 4**: AI Doubt Resolver
- [ ] **Phase 5**: Knowledge Graph & Dashboard
- [ ] **Phase 6**: PWA & Offline
