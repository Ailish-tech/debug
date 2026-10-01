# 🏴‍☠️ Dead Man's Debug — Competition System

> **Fix the Code or Walk the Plank!**
> A pirate-themed competitive debugging arena with admin controls, real-time rounds, code evaluation, and live leaderboard.

---

## 🚀 Quick Start

```bash
cd Debugging
npm install      # Already done
npm start        # Start the server
```

**Server runs at:** [http://localhost:3000](http://localhost:3000)

---

## 🔐 Login Credentials

| Role | Username | Password |
|------|----------|----------|
| **Admin (Captain)** | `captain` | `blackpearl` |
| **Participants** | Register via the landing page | — |

---

## 📖 How It Works

### Admin Flow (Captain's Quarters)
1. **Login** → Enter admin credentials at `/`
2. **Create Challenges** → Upload buggy code with test cases, assign to rounds
3. **Configure Rounds** → Set duration, max attempts per round
4. **Start Round** → Participants see challenges and timer begins
5. **Monitor** → Watch live submissions, manage crew, send announcements
6. **End Round** → Locks submissions, updates leaderboard

### Participant Flow (The Arena)
1. **Register** → Create a pirate name at `/`
2. **Wait** → Lobby screen until Captain starts a round
3. **Debug** → Select challenge → Edit code in CodeMirror editor
4. **Submit** → Click FIRE! → Code runs against test cases instantly
5. **Results** → See pass/fail per test case, score, attempts remaining
6. **Leaderboard** → Track rankings in real-time

---

## 📄 Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing/Login | `/` | Admin login + participant registration |
| Captain's Quarters | `/admin` | Full admin dashboard |
| The Arena | `/arena` | Participant debugging workspace |
| Leaderboard | `/leaderboard` | Live ranking (can be projected) |

---

## ⚙️ Features

### Core
- ✅ **Two competition rounds** — configurable duration & attempts
- ✅ **Challenge management** — Create, edit, delete challenges with buggy code & test cases
- ✅ **Real-time round control** — Start/stop rounds, all participants notified instantly
- ✅ **Code evaluation engine** — Supports C
- ✅ **Automated scoring** — Base score + time bonus − attempt penalty + efficiency bonus
- ✅ **Live leaderboard** — Auto-updates via WebSocket

### Admin
- ✅ Dashboard with stats
- ✅ Challenge CRUD with test cases, hints, difficulty levels
- ✅ Round configuration (duration, max attempts, naming)
- ✅ Participant management (view, remove)
- ✅ Live submission feed
- ✅ Broadcast announcements
- ✅ Full system reset

### Participant
- ✅ CodeMirror code editor with syntax highlighting
- ✅ Real-time countdown timer
- ✅ Visual attempt tracking (cannonball dots)
- ✅ Detailed test results per submission
- ✅ Hints system
- ✅ Automatic round entry when admin starts

### Technical
- ✅ WebSocket (Socket.IO) for real-time events
- ✅ JSON file persistence (survives restarts)
- ✅ Session-based authentication
- ✅ Execution timeout protection (10s per test)
- ✅ Pirate-themed UI with ocean animations & gold accents

---

## 🏗️ Architecture

```
Debugging/
├── server.js          # Express + Socket.IO backend
├── package.json       # Dependencies
├── data/              # Persistent storage + temp execution
│   ├── db.json        # Database (auto-generated)
│   └── temp/          # Temporary code execution files
└── public/
    ├── index.html     # Login/Registration page
    ├── admin.html     # Admin dashboard
    ├── arena.html     # Participant arena
    ├── leaderboard.html # Live leaderboard
    └── css/
        └── styles.css # Pirate theme design system
```

---

## 💰 Scoring System

| Factor | Points |
|--------|--------|
| Base score (all tests pass) | 100 |
| Time bonus (solving faster) | Up to +50 |
| Attempt penalty (per extra attempt) | −15 each |
| Efficiency bonus (fast execution) | Up to +20 |
| **Maximum possible per challenge** | **170** |

---

## 🌐 Supported Languages

| Language | Extension | Command |
|----------|-----------|---------|
| C | `.c` | `gcc` + run |

> **Note:** C requires the GCC compiler installed on the system.

---

## 🎨 Pirate Theme

The UI features:
- Deep ocean gradient background with animated stars
- Floating wave animations
- Gold treasure accents with glow effects
- Glass morphism cards with backdrop blur
- Animated skull & crossbones branding
- Fire gradient submit button
- Toast notifications for real-time events
- Responsive design for projector/screen display
