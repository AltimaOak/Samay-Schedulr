# Student Academic Planner with AI Suggestions (Samay Schedulr)

A premium glassmorphism-style academic planner with React + Firebase for frontend and  Python backend.

Samay Schedulr combines NLP (Natural Language Processing) and AI Intelligence to analyze your syllabus, parse timetables, and generate personalized study roadmaps—all in one smart platform.

## Project Summary

- **Frontend**: React + Vite app in `frontend/`
- **Backend**: Python (Flask/FastAPI style in `backend/`, optional)
- **Auth + Data**: Firebase Realtime Database
- **Features**:
  - AI syllabus/task/timetable suggestions
  - Real-time sync
  - theme + notification + user account flow
  - local file storage via Base64 in database

## Prerequisites

- Node.js installed (14+ recommended)
- Python 3.10+ for backend (optional)
- npm or yarn
- Firebase project + config inside `frontend/src/firebase.js`

## Frontend setup

```bash
cd frontend
npm install
npm run dev

Open browser to URL shown (e.g. http://localhost:5173).
## Backend setup 
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/macOS
# source venv/bin/activate
pip install -r requirements.txt
python main.py