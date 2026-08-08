# Self-Evolving Autonomous Research Agent — Deployment & Production Guide

This guide provides step-by-step instructions for building, configuring, and deploying the Self-Evolving Autonomous Research Agent in production.

---

## 1. Required Environment Variables

Copy `.env.example` to `.env` in production. Environment variables are managed via Pydantic Settings in `backend/app/config/settings.py` and Vite env variables in `frontend/.env`.

### Backend Environment Variables (`.env`)

| Variable | Description | Production Value Example |
| :--- | :--- | :--- |
| `APP_ENV` | Application environment | `production` |
| `DEBUG` | Enable debug logging | `false` |
| `SECRET_KEY` | JWT signing secret key | `super-secret-random-32-byte-hex-string` |
| `ALLOWED_ORIGINS` | Allowed CORS origins | `https://your-domain.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@postgres-host:5432/research_db` |
| `CHROMA_HOST` | ChromaDB vector host | `chroma-host` |
| `CHROMA_PORT` | ChromaDB vector port | `8001` |
| `TAVILY_API_KEY` | Tavily Web Search API Key | `tvly-prod-key...` |
| `OPENAI_API_KEY` | OpenAI API Key | `sk-prod-key...` |

### Frontend Environment Variables (`frontend/.env`)

| Variable | Description | Value Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend REST API URL | `https://api.your-domain.com` |
| `VITE_WS_BASE_URL` | WebSocket Server URL | `wss://api.your-domain.com` |
| `VITE_USE_MOCK_DATA` | Enable mock data fallback | `false` |

---

## 2. Database Setup (PostgreSQL)

The application uses SQLAlchemy with `asyncpg`.
1. Provision a PostgreSQL instance (v14+).
2. Create database `research_agent`.
3. Configure `DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>:5432/research_agent`.
4. Tables (`users`, `research_sessions`) are automatically created on startup via `init_db()`.

---

## 3. Backend Installation & Production Run

### Installation
```bash
cd backend
python -m venv .venv
# On Linux/macOS:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

pip install -r requirements.txt
```

### Production Execution
Run FastAPI using Uvicorn with multi-worker support:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 4. Frontend Installation & Production Build

### Installation
```bash
cd frontend
npm install
```

### Build Production Artifacts
```bash
npm run build
```
This produces optimized static assets in `frontend/dist/`.

### Serving Frontend Artifacts
Serve `frontend/dist/` using Nginx, Caddy, or Cloudflare Pages / Vercel.

---

## 5. Security & Authentication Architecture

1. **Password Hashing**: Passwords are securely hashed using `bcrypt` (`gensalt()`, `checkpw()`). Plaintext passwords or hashes are never returned over API endpoints.
2. **Session Security**: JWT Bearer Tokens signed with `SECRET_KEY` (HS256).
3. **Data Isolation**: Every research query, step execution, findings snapshot, and history entry is linked to `user_id`. Non-owners receive HTTP 403 Forbidden.
