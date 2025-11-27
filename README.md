![Tests](https://github.com/victormarlor/HyperFocus/actions/workflows/ci.yml/badge.svg)

# 🧠 HyperFocus
### Master Your Deep Work. Track Your Interruptions.

**HyperFocus** is not just another time tracker. It is a **Full-Stack Analytics Platform** designed for remote workers, developers, and students who want to understand the *science* behind their productivity. 

We all feel busy, but are we **productive**? HyperFocus helps you answer that question by tracking your "Deep Work" sessions and analyzing exactly what breaks your flow—whether it's a phone call, a family member, or your own wandering mind.

---

## ✨ Key Features

### 🛡️ Enterprise-Grade Security
*   **Secure Authentication**: Built with **OAuth2** and **JWT** (JSON Web Tokens).
*   **Data Protection**: Passwords hashed with **Argon2**, the winner of the Password Hashing Competition.
*   **Role-Based Access**: Granular permissions for Users and Admins.

### ⏱️ Seamless Focus Tracking
*   **Focus Timer (Pomodoro)**: Built-in timer with presets (25m, 50m) and visual progress ring.
*   **One-Click Sessions**: Start a "Deep Work" session instantly.
*   **Frictionless Interruption Logging**: Log distractions in seconds without losing your context.

### 📊 Professional Analytics Dashboard
*   **AI Insights 🧠**: Local intelligence engine that analyzes your patterns to give personalized productivity tips.

*   **Productivity Score**: A proprietary algorithm that scores your focus quality (0-100).
*   **Interruption Breakdown**: Visual Pie Charts identifying your top distractors.
*   **Peak Performance Hours**: Heatmaps showing *when* you are most productive.

### 🎨 Premium User Experience
*   **Modern UI**: Built with **React** and **Vite** for blazing fast performance.
*   **Dark Mode Native**: Designed for late-night coding sessions with a custom-tuned dark palette.
*   **Fully Responsive**: Works perfectly on your Desktop, Tablet, and Mobile.

---

## 🏗️ Tech Stack

This project was built using industry-standard best practices and modern technologies.

### Backend (The Brain)
*   **Language**: Python 3.11+
*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (High performance, easy to learn)
*   **Database**: SQLite (Dev) / PostgreSQL (Prod ready)
*   **ORM**: [SQLModel](https://sqlmodel.tiangolo.com/) (The power of SQLAlchemy + Pydantic)
*   **Testing**: Pytest, Factory Boy

### Frontend (The Face)
*   **Framework**: [React](https://react.dev/) 18
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Simple, scalable state)
*   **Routing**: React Router v6
*   **Visualization**: Recharts
*   **Styling**: Modern CSS Variables & Responsive Design

### DevOps (The Engine)
*   **Containerization**: Docker & Docker Compose
*   **CI/CD**: GitHub Actions (Automated Testing & Linting)
*   **Deployment**: Ready for Railway (Backend) & Vercel (Frontend)

---

## 🚀 Replication Guide (How to Run This Project)

Want to run HyperFocus on your own machine? Follow these steps.

### Prerequisites
*   **Docker** (Recommended) OR **Python 3.11+** & **Node.js 18+**
*   **Git**

### Option A: The "I want it running NOW" Method (Docker) 🐳

This will spin up the Backend, Frontend, and Database in isolated containers.

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/victormarlor/HyperFocus.git
    cd HyperFocus
    ```

2.  **Launch with Docker Compose**
    ```bash
    docker-compose up --build
    ```

3.  **That's it!**
    *   **Frontend**: Open [http://localhost](http://localhost)
    *   **Backend API**: [http://localhost:8000](http://localhost:8000)
    *   **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: The "Hacker" Method (Manual Setup) 💻

If you want to develop or modify the code, run the services locally.

#### 1. Backend Setup

```bash
# Navigate to the project root
cd HyperFocus

# Create a virtual environment
python -m venv venv

# Activate it
# Windows:
.\venv\Scripts\Activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload
```
*The API is now running at `http://localhost:8000`*

#### 2. Frontend Setup

Open a new terminal window.

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
```
*The App is now running at `http://localhost:5173`*

---

## 🧪 Quality Assurance

We maintain high code quality standards. You can run our test suites to verify everything is working.

**Backend Tests:**
```bash
pytest
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

---

## 📂 Project Structure

A detailed look at the architecture:

```
HyperFocus/
├── .github/
│   └── workflows/
│       └── ci.yml            # CI/CD Pipeline configuration
├── app/                      # FastAPI Backend Source
│   ├── core/
│   │   ├── config.py         # Environment configuration
│   │   ├── deps.py           # Dependency Injection
│   │   ├── logging_config.py # Logger setup
│   │   ├── security.py       # JWT & Password hashing
│   │   └── stats_logic.py    # Analytics business logic
│   ├── routers/
│   │   ├── auth.py           # Authentication endpoints
│   │   ├── interruptions.py  # Interruption management
│   │   ├── sessions.py       # Session management
│   │   ├── stats.py          # Statistics endpoints

│   │   └── users.py          # User management
│   ├── db.py                 # Database connection
│   ├── main.py               # App entry point
│   ├── models.py             # SQLModel Database Models
│   └── schemas.py            # Pydantic Data Schemas
├── frontend/                 # React Frontend Source
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js      # Axios instance with interceptors
│   │   ├── components/
│   │   │   ├── features/     # Feature Widgets (Timer, Insights)
│   │   │   ├── layout/       # Layout & Sidebar components
│   │   │   └── ui/           # Reusable UI (Buttons, Inputs, Cards)
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── SessionsPage.jsx
│   │   ├── store/
│   │   │   └── authStore.js  # Zustand Auth Store
│   │   ├── styles/
│   │   │   ├── layout.css    # Responsive Layout Styles
│   │   │   └── theme.css     # CSS Variables & Dark Mode
│   │   ├── App.jsx           # Main App Component & Routing
│   │   └── main.jsx          # React Entry Point
│   ├── Dockerfile            # Frontend Dockerfile (Nginx)
│   ├── package.json          # Frontend Dependencies
│   └── vite.config.js        # Vite Configuration
├── tests/                    # Backend Integration Tests
│   ├── conftest.py           # Test Fixtures
│   ├── test_auth.py          # Auth Tests
│   ├── test_interruptions_api.py
│   └── test_stats_logic.py
├── .dockerignore             # Docker exclusion list
├── .gitignore                # Git exclusion list
├── docker-compose.yml        # Docker Orchestration
├── Dockerfile                # Backend Dockerfile
├── railway.toml              # Railway Deployment Config
├── requirements.txt          # Backend Dependencies
└── README.md                 # Project Documentation
```

---

## 🔮 Future Roadmap

*   [x] **Focus Timer**: Pomodoro integration directly in the session view.

*   [x] **AI Insights**: Local heuristics engine to improve your workflow.
*   [ ] **Mobile App**: Native React Native application.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ by Victormarlor*
