# Student Academic Planner - Frontend

This is the main interaction layer of the Student Academic Planner.

## Getting Started

### Installation
```bash
npm install
```

### Run Locally
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## Tech Stack
- **React**: Modern component-based UI.
- **Vite**: Ultra-fast build tool.
- **Firebase**: 
  - **Authentication**: Secure student login.
  - **Realtime Database**: Instant data synchronization.
  - **Storage**: Handling syllabus and timetable file uploads.
- **Vanilla CSS**: Custom premium glassmorphism styling.

## Key Files
- `src/pages/`: Contains the main page components (Dashboard, Tasks, etc.).
- `src/services/`: Handles all Firebase interactions (Database, Storage).
- `src/context/`: Manages global state (Auth, Notifications).
- `src/index.css`: Defines the global glassmorphism theme and animations.
