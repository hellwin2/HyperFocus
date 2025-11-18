![Tests](https://github.com/victormarlor/HyperFocus/actions/workflows/tests.yml/badge.svg)

# HyperFocus – Deep Work & Interruptions Analytics API

HyperFocus is a backend API designed to help remote workers and students understand **how they actually focus** during their workday.

It lets a user:

- Start and end *focus sessions*
- Log *interruptions* (phone, family, noise, self-distractions, urgent tasks…)
- Generate **analytics** about:
  - Total focused time vs. time lost
  - Which interruption types affect them the most
  - At what hours they are most productive
  - When they get most distracted
  - Weekly concentration patterns

---

## 💡 Problem

People who work or study remotely get interrupted all the time:

- Family or roommates
- Phone notifications
- Noise
- “Quick” urgent tasks
- Self-distractions (social media, random browsing, etc.)

We all *feel* less productive, but it's hard to **measure**:

- How much time we really work vs. lose  
- Which sources of interruption hurt us the most  
- When (time of day or week) we struggle to focus  

**HyperFocus** converts those everyday interruptions into meaningful metrics and patterns you can act on.

---

## 🎯 What This API Does

Core capabilities:

- ✅ Manage users  
- ✅ Track focus sessions per user  
- ✅ Log interruptions inside a session  
- ✅ Automatically compute interruption duration  
- ✅ Compute advanced analytics:
  - Summary: total work time, time lost, effective focus time
  - Breakdown by interruption type
  - Productivity by hour of day
  - Peak distraction hour
  - Weekly concentration pattern

The focus is not just CRUD, but **useful analytics** that reflect real human behavior.

---

## 🧱 Tech Stack

- **Language:** Python  
- **Framework:** FastAPI  
- **ORM:** SQLModel (SQLAlchemy + Pydantic)  
- **Database:** SQLite  
- **Schemas:** Pydantic v2  
- **Testing:** Pytest + FastAPI TestClient  
- **Containerization:** Docker  
- **Docs:** Auto-generated OpenAPI (Swagger UI)

---

## 📁 Project Structure

```
hyperfocus/
├─ app/
│  ├─ main.py                 # FastAPI app, lifespan, router registration
│  ├─ models.py               # SQLModel models (User, Session, Interruption)
│  ├─ schemas.py              # Pydantic schemas (input/output)
│  ├─ db.py                   # DB engine, session dependency, table creation
│  ├─ core/
│  │   ├─ stats_logic.py      # All analytics and statistics logic
│  │   └─ config.py           # (Reserved for future configuration)
│  └─ routers/
│      ├─ users.py            # /users endpoints
│      ├─ sessions.py         # /sessions endpoints
│      ├─ interruptions.py    # /interruptions endpoints
│      └─ stats.py            # /users/{id}/stats endpoints
├─ tests/
│  ├─ test_interruptions_api.py  # End-to-end API tests (user → session → interruption)
│  ├─ test_stats_logic.py        # Unit tests for analytics logic
│  └─ conftest.py                # Test DB setup (in-memory SQLite)
├─ requirements.txt
├─ Dockerfile
└─ README.md
````

---

## 🗄️ Data Model

### `User`

Represents a person using the system.

* `id`: int (PK)
* `name`: str
* `email`: str (unique)
* `created_at`: datetime (UTC)

---

### `Session` (Focus Session)

Represents a block of focused work.

* `id`: int (PK)
* `user_id`: FK → `User`
* `start_time`: datetime
* `end_time`: datetime | null (null = still active)
* `created_at`: datetime

Rules:

* A user cannot have **two active sessions** at the same time.

---

### `Interruption`

Represents a single interruption inside a session.

* `id`: int (PK)
* `session_id`: FK → `Session`
* `user_id`: FK → `User`
* `type`: `"family" | "phone" | "noise" | "self" | "urgent_task" | "unknown"`
* `description`: str
* `start_time`: datetime
* `end_time`: datetime
* `duration`: int (seconds, computed automatically)
* `created_at`: datetime

Constraints:

* Every interruption belongs to exactly one session.
* `end_time` must be greater than `start_time`.

---

## 🚀 Getting Started

### 1. Clone the repo

```
git clone https://github.com/<your-username>/hyperfocus.git
cd hyperfocus
```

### 2. Create and activate a virtual environment

**Windows (PowerShell):**

```
py -m venv venv
.\venv\Scripts\Activate
```

**macOS / Linux:**

```
python -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```
pip install -r requirements.txt
```

### 4. Run the development server

```
uvicorn app.main:app --reload
```

Access:

* Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
* Health check: `GET /` → `{"message": "HyperFocus API is running 🚀"}`

---

## 🐳 Run with Docker (optional)

Build the image:

```
docker build -t hyperfocus-api .
```

Run the container:

```
docker run -p 8000:8000 hyperfocus-api
```

API will be available at `http://127.0.0.1:8000`.

---

## 📌 Core API Overview

### 👤 Users

**Create user**

```
POST /users/
```

Body example:

```
{ "name": "Victor", "email": "victor@example.com" }
```

**Get user by ID**

```
GET /users/{id}
```

---

### ⏱ Sessions

**Start a session**

```
POST /sessions/start
```

Body:

```
{ "user_id": 1 }
```

Rules:

* If the user already has an active session → HTTP 400.

**End a session**

```
POST /sessions/{id}/end
```

**Get a session**

```
GET /sessions/{id}
```

**List user sessions (optional day filter)**

```
GET /sessions/user/{user_id}?day=YYYY-MM-DD
```

---

### ❗ Interruptions

**Create interruption**

```
POST /interruptions/
```

Example:

```
{
  "session_id": 1,
  "user_id": 1,
  "type": "phone",
  "description": "WhatsApp messages",
  "start_time": "2025-11-15T16:00:00Z",
  "end_time": "2025-11-15T16:02:30Z"
}
```

Backend automatically:

* Validates session ownership
* Ensures session is active
* Ensures `end_time > start_time`
* Computes `duration`

**List interruptions**

```
GET /interruptions/session/{session_id}
```

---

## 📊 Statistics (Analytics)

All under:

```
/users/{user_id}/stats/...
```

### Available Endpoints

| Endpoint                       | Description                         |
| ------------------------------ | ----------------------------------- |
| `/stats/summary`               | High-level focus summary            |
| `/stats/interruption-types`    | Counts & proportions by type        |
| `/stats/productive-hours`      | Focus vs. distractions by hour      |
| `/stats/peak-distraction-time` | Hour of day with most interruptions |
| `/stats/weekly-pattern`        | Monday–Sunday focus overview        |

---

### Summary Example

`GET /users/{user_id}/stats/summary?range=7d`

Includes:

* `total_sessions`
* `total_interruptions`
* `total_time_worked_seconds`
* `total_time_lost_seconds`
* `effective_time_seconds`
* `average_interruption_duration_seconds`
* `interruptions_per_hour`

---

### Weekly Pattern Example

Each entry contains:

```
{
  "weekday_index": 0,
  "weekday_name": "monday",
  "work_seconds": 5400,
  "time_lost_seconds": 600,
  "effective_time_seconds": 4800,
  "interruptions": 3
}
```

---

## 🧪 Testing

Run all tests:

```
pytest
```

Includes:

* **Unit tests** for analytics (`test_stats_logic.py`)
* **Integration tests** for the interruption flow (`test_interruptions_api.py`)
* **In-memory DB** using `sqlite://` + `StaticPool`
* `TestClient` with dependency overrides

---

## 🧠 Design Decisions

* **SQLModel** chosen for strong typing + declarative models.
* **UTC timezone-aware datetimes** for reliable time calculations.
* **Separation of concerns**:

  * Routers → HTTP logic
  * Models/Schemas → data layer
  * `stats_logic.py` → business & analytics
* **Layered validation** (schemas → API → DB constraints).
* **Tests** ensure analytics work exactly as expected.

---

## 🚧 Future Improvements

* Authentication (JWT)
* Rate limiting
* Export stats (CSV / JSON)
* A dashboard frontend
* More advanced analytics (focus score)
* Deployment on Fly.io / Railway with Docker

---

## 🧾 What I Learned

While building HyperFocus I practiced:

* Modeling a real-world domain (focus sessions & interruptions)
* Clean FastAPI architecture
* SQLModel relationships
* UTC datetime handling
* Separation of analytics logic
* Writing both unit and end-to-end API tests

---

## 📄 License

This project is licensed under the **MIT License**.
See the [LICENSE](./LICENSE) file for details.
