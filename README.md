# 🐛 BugBoard

AI-powered bug reporting and classification system. Users report bugs in natural language and the AI automatically classifies them by severity, module, reproduction steps, and suggested fix.

![BugBoard Dashboard](https://via.placeholder.com/800x400?text=BugBoard+Dashboard)

## ✨ Features

- **Natural language bug reporting** — users describe bugs the way they talk, no forms to fill
- **AI classification** — llama3.2 via Ollama classifies severity, module, reproduction steps and suggests a fix
- **Real-time preview** — the AI classifies the bug as you type, before you submit
- **Automatic browser context** — captures browser, OS, URL and screen resolution automatically
- **Duplicate detection** — detects similar bugs and links them to the original
- **Dashboard** — filter bugs by severity, module and status
- **Metrics** — charts showing bug trends by module, severity and timeline
- **Embeddable widget** — add BugBoard to any app with 2 lines of HTML

## 🛠️ Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17+ + Tailwind CSS |
| Backend | Python + FastAPI |
| AI | Ollama + llama3.2 (runs locally) |
| Database | PostgreSQL |
| Containerization | Docker |

## 🚀 Getting Started

### Prerequisites

- [Ollama](https://ollama.ai) installed and running
- [Docker Desktop](https://docker.com) installed and running
- Node.js 18+ and npm
- Python 3.11+

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/bugboard.git
cd bugboard
```

### 2. Start Ollama and pull the model

```bash
brew services start ollama
ollama pull llama3.2
```

### 3. Start PostgreSQL

```bash
docker run -d \
  --name bugboard-postgres \
  -e POSTGRES_DB=bugboard_db \
  -e POSTGRES_USER=bugboard \
  -e POSTGRES_PASSWORD=bugboard123 \
  -p 5432:5432 \
  postgres:16-alpine
```

### 4. Start the backend

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend running at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### 5. Start the frontend

```bash
cd frontend/bugboard-app
npm install
ng serve
```

Frontend running at `http://localhost:4200`

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bugs/` | Report a bug — classifies with AI |
| POST | `/api/bugs/preview` | Real-time classification preview |
| GET | `/api/bugs/` | List all bugs with filters |
| GET | `/api/bugs/:id` | Get bug detail |
| PATCH | `/api/bugs/:id/status` | Update bug status |
| GET | `/api/metrics/summary` | Overall stats |
| GET | `/api/metrics/by-severity` | Bugs grouped by severity |
| GET | `/api/metrics/by-module` | Bugs grouped by module |
| GET | `/api/metrics/timeline` | Bug reports over time |

## 🧩 Embeddable Widget

Add BugBoard to any web app with 2 lines:

```html
<script src="https://your-bugboard-url.com/widget.js"></script>
<bug-report-widget app-id="your-app-name" />
```

The widget automatically captures:
- Browser and version
- Operating system
- Current URL
- Screen resolution

## 📁 Project Structure

```
bugboard/
├── backend/
│   ├── app/
│   │   ├── core/         # Config and settings
│   │   ├── database/     # SQLAlchemy connection
│   │   ├── models/       # PostgreSQL models
│   │   ├── routers/      # FastAPI endpoints
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Ollama integration
│   │   └── main.py
│   └── requirements.txt
└── frontend/
    └── bugboard-app/
        └── src/app/
            ├── core/         # Services and models
            └── features/
                ├── dashboard/
                ├── bug-detail/
                ├── bug-report/
                ├── metrics/
                └── widget/
```

## 🤖 How the AI works

1. User writes a bug in natural language
2. FastAPI sends the text to Ollama with a structured prompt
3. llama3.2 returns a JSON with severity, module, reproduction steps and suggested fix
4. The result is saved to PostgreSQL and shown in the dashboard

The prompt includes the available modules so the AI can classify correctly:

```
auth, payments, dashboard, profile, notifications, api, ui, database, other
```

## 👤 Author

**Anderson Frias** — [@anndev](https://youtube.com/@anndev)

- YouTube: [youtube.com/@anndev](https://youtube.com/@anndev)
- GitHub: [github.com/yourusername](https://github.com/anderj14)

---

Built with ❤️ using FastAPI, Angular, and llama3.2
