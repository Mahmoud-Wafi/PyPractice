# 🐍 PyLearn — Full-Stack Python Learning Platform

A production-ready Python learning platform with a browser-based Monaco editor, AI tutor, sandboxed code execution, auto-grading, activity heatmap, and leaderboard.

[![CI](https://img.shields.io/badge/tests-31%2F31%20passing-brightgreen)]()
[![Build](https://img.shields.io/badge/build-passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## 🚀 Live Demo

**Try it now** (no installation): `make docker-up` → http://localhost:3000

---

## ✨ Features

### For Learners
- 🎯 **30 curated problems** across 3 levels (Beginner → Intermediate → Advanced)
- ⚡ **Monaco Editor** — VS Code quality editing in the browser
- 🤖 **PyBot AI Tutor** — Socratic hints that guide without spoiling
- 🏃 **Real Python execution** — runs in a sandboxed environment (5s timeout, 64MB RAM)
- 📊 **Progress tracking** — heatmap calendar, completion rings, leaderboard
- 💡 **Hint system** — progressively revealing hints per question
- 🎉 **Gamification** — acceptance overlays, score tracking, daily streaks

### For Developers
- 🔒 **Secure sandbox** — blocks `os`, `sys`, `subprocess`, `socket`, all dangerous imports
- 🧪 **Auto-grading** — test case validation with hidden edge cases
- 🔄 **JWT auth** — access + refresh tokens with rotation and blacklisting
- 🐳 **Docker-ready** — multi-stage builds, healthchecks, production configs
- 🧪 **31 automated tests** — 100% passing coverage of executor, grading, API
- 📦 **CI/CD pipeline** — GitHub Actions workflow included
- 🎨 **Toast system** — user-friendly notifications
- 📱 **Responsive** — mobile-first CSS with breakpoints

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router v6, Monaco Editor, Axios |
| **Backend** | Django 5, Django REST Framework, Celery |
| **Auth** | JWT (SimpleJWT) with token rotation |
| **Execution** | Subprocess sandbox with `resource` limits |
| **AI** | OpenAI GPT-3.5 (mocked if no API key) |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **Cache** | Redis |
| **Deployment** | Docker, Docker Compose, Nginx reverse proxy |

---

## 📁 Project Structure

```
pythonlearn/
├── backend/
│   ├── config/              # Django settings, URLs
│   ├── users/               # User model, auth endpoints
│   ├── curriculum/          # Levels, questions, test cases, hints
│   ├── submissions/         # Submit, run, grade, executor
│   ├── ai_assistant/        # Chat + hint endpoints
│   ├── Dockerfile           # Multi-stage production image
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client modules
│   │   ├── components/      # Navbar, Toast, Skeleton, ActivityHeatmap
│   │   ├── hooks/           # useAuth context
│   │   ├── pages/           # Home, Dashboard, Workspace, Profile, etc.
│   │   └── index.css        # Global styles (dark terminal aesthetic)
│   ├── Dockerfile           # Multi-stage build with nginx
│   └── package.json
├── nginx/
│   └── nginx.conf           # Production reverse proxy with rate limiting
├── docker-compose.yml       # Dev environment
├── docker-compose.prod.yml  # Production stack
├── Makefile                 # Dev commands
└── README.md
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repo
git clone <your-repo-url>
cd pythonlearn

# Start all services
docker-compose up --build

# Access the app
open http://localhost:3000
```

### Option 2: Manual Setup

**Backend**
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed          # Loads 30 questions
python manage.py runserver     # http://localhost:8000
```

**Frontend**
```bash
cd frontend
npm install --legacy-peer-deps
npm start                      # http://localhost:3000
```

### Option 3: Makefile

```bash
make install      # Install deps
make dev-backend  # Terminal 1
make dev-frontend # Terminal 2
```

---

## 🔑 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/` | No | Register new user |
| POST | `/api/auth/login/` | No | Login → JWT tokens |
| POST | `/api/auth/refresh/` | No | Rotate access token |
| POST | `/api/auth/logout/` | Yes | Blacklist refresh token |
| GET | `/api/auth/me/` | Yes | Get current user |
| PATCH | `/api/auth/me/` | Yes | Update name/skill_level |
| GET | `/api/auth/leaderboard/` | Yes | Top 20 users |

### Curriculum
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/levels/` | Optional | All levels + user progress |
| GET | `/api/levels/{slug}/questions/` | Yes | Questions for a level |
| GET | `/api/questions/{id}/` | Yes | Full question + test cases |
| GET | `/api/progress/` | Yes | User progress across all levels |

### Execution
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/run/` | Yes | Run code without grading |
| POST | `/api/submit/` | Yes | Submit + grade against test cases |
| GET | `/api/submissions/` | Yes | All user submissions (for heatmap) |
| GET | `/api/submissions/stats/` | Yes | Aggregate stats |
| GET | `/api/questions/{id}/submissions/` | Yes | Submission history |

### AI
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/chat/` | Yes | Chat with PyBot assistant |
| POST | `/api/ai/hint/{question_id}/` | Yes | Get AI hint for a question |

---

## 🔒 Security

### Code Execution Sandbox
- ❌ **Blocked imports**: `os`, `sys`, `subprocess`, `socket`, `requests`, `urllib`, `http`, `ftplib`, `pickle`, `ctypes`, `importlib`
- ❌ **Blocked builtins**: `eval`, `exec`, `open`, `compile`, `__import__`, `getattr`, `setattr`
- ✅ **Size limit**: 50KB max per submission
- ✅ **Timeout**: 5 seconds hard limit
- ✅ **Memory limit**: 64MB via `resource.setrlimit`
- ✅ **No network access** in execution process

### Authentication
- Passwords hashed with Django's PBKDF2 (bcrypt-compatible)
- JWT access tokens: 60-minute lifetime
- JWT refresh tokens: 7-day lifetime with rotation
- Blacklisted tokens stored in DB

### Production Hardening
- HTTPS redirect (configure in nginx)
- Security headers (X-Frame-Options, CSP, HSTS)
- Rate limiting per endpoint (nginx zones)
- Non-root Docker containers
- Secrets via environment variables

---

## 🧪 Testing

```bash
# Run all backend tests
cd backend
python manage.py test submissions --verbosity=2

# Build frontend (checks for compile errors)
cd frontend
npm run build
```

**Test Coverage**: 31/31 tests passing
- Security tests (blocked imports, forbidden patterns)
- Executor tests (hello world, timeout, runtime errors)
- Grading tests (all pass, partial credit, edge cases)
- API integration tests (auth, CRUD, permissions)

---

## 🌍 Deployment

### Production Checklist

- [ ] Set `SECRET_KEY` to a long random string
- [ ] Set `DEBUG=False`
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Use PostgreSQL (set `DATABASE_URL`)
- [ ] Set `OPENAI_API_KEY` for real AI responses
- [ ] Configure HTTPS (Nginx + Certbot or Cloudflare)
- [ ] Replace subprocess sandbox with Docker-in-Docker
- [ ] Set up monitoring (Sentry, Prometheus)
- [ ] Configure backups (PostgreSQL daily snapshots)

### Deploy with Docker

```bash
# Set environment variables
export SECRET_KEY="your-secret-key"
export DB_PASSWORD="your-db-password"
export OPENAI_API_KEY="sk-..."
export ALLOWED_HOSTS="yourdomain.com"
export DOCKERHUB_USERNAME="your-username"

# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### CI/CD

GitHub Actions workflow included (`.github/workflows/ci.yml`):
- Runs Django tests
- Builds React frontend
- Builds Docker images
- Pushes to Docker Hub (on `main` branch)
- Deploys to server (configure SSH action)

---

## 📊 Database Schema

```
User ──< Submission >── Question ──< TestCase
         |                |
         v                └──< Hint
    (JSON results)
         
User ──< UserProgress >── Level ──< Question
```

**Key Tables**:
- `User` — email, password_hash, skill_level (beginner/intermediate/advanced)
- `Level` — slug, name, order, color, icon
- `Question` — level_id, title, description, starter_code, points
- `TestCase` — question_id, input_data, expected_output, is_hidden
- `Hint` — question_id, content, order
- `Submission` — user_id, question_id, code, status, score, test_results (JSON)
- `UserProgress` — user_id, level_id, questions_completed, total_score

---

## 🎨 Screenshots

### Dashboard
![Dashboard with progress rings and level cards]

### Workspace (Monaco Editor + 3-panel layout)
![Code editor with output panel and AI chat]

### Activity Heatmap
![GitHub-style contribution calendar]

### Leaderboard
![Ranked table with medals and scores]

---

## 🛠️ Environment Variables

### Backend (`.env`)
```bash
SECRET_KEY=your-long-random-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://pylearn:password@db:5432/pylearn
REDIS_URL=redis://redis:6379/0
OPENAI_API_KEY=sk-...
```

### Frontend
React uses the proxy defined in `package.json`. In production, nginx handles routing.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

**Development workflow**:
```bash
make install      # First time setup
make test         # Run tests before committing
make dev-backend  # Terminal 1
make dev-frontend # Terminal 2
```

---

## 📝 License

MIT License — feel free to use this for learning, teaching, or building your own platform.

---

## 🙏 Acknowledgments

- **Monaco Editor** — The VS Code team at Microsoft
- **Django REST Framework** — Tom Christie and contributors
- **React** — Meta and the React community
- Inspired by LeetCode, Codecademy, and Replit

---

## 📧 Support

- **Issues**: [GitHub Issues](your-repo-url/issues)
- **Docs**: See `/docs` folder for detailed guides
- **Community**: Join our Discord (link)

---

Built with ❤️ for Python learners everywhere.
