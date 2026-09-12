# College Complaint Management System (CampusVoice)

A full-stack, secure, production-grade web application designed for colleges and universities. It enables students to lodge grievances and track their progress in real-time, while empowering campus administrators to oversee, prioritize, assign, and resolve student tickets.

Built with **Python Flask**, **MySQL**, **Vanilla JavaScript**, **CSS3**, and **HTML5**.

---

## 🏗️ Architecture & Security Model

```text
Existing HTML5 / CSS3 / Vanilla JavaScript Frontend
                        │
                  (Fetch API)
                        ▼
            Python Flask Backend (app.py)
            (Session-Based Authentication)
                        │
               (PyMySQL / SQL DDL)
                        ▼
                MySQL Database
     (Normalized: users & complaints tables)
```

- **MySQL Database as Single Source of Truth**: Strictly uses MySQL (no client-side `localStorage` or SQLite).
- **Normalized Schema**: No duplicate student information in the `complaints` table; user info is joined via `complaints.user_id = users.id`.
- **Foreign Key Integrity**: Standard foreign key `FOREIGN KEY (user_id) REFERENCES users(id)` without `ON DELETE CASCADE` to prevent accidental loss of complaint records.
- **Unique Public Complaint IDs**: Public tracking IDs (e.g. `CMP-1001`, `CMP-1002`) are stored with `UNIQUE(complaint_id)`, separate from the internal auto-increment primary key `id`.
- **Werkzeug Password Hashing**: All passwords are encrypted using `generate_password_hash()` and verified via `check_password_hash()`. Plaintext passwords are never stored.
- **Server-Side Session Authentication**: Authenticated sessions are tracked via secure HTTP cookies.
- **Strict Authorization**:
  - **Students**: Can only view, search, and submit complaints for themselves. The backend enforces `WHERE complaints.user_id = session['user_id']`.
  - **Administrators**: Can access campus-wide analytics, view all student tickets, and update lifecycle statuses via `PUT /api/admin/complaints/<complaint_id>/status`. Students attempting admin actions receive `HTTP 403 Forbidden`.

---

## 📁 Project Structure

```text
CollegeComplaint-System/
├── app.py                  # Python Flask backend (REST API & static serving)
├── requirements.txt        # Python dependencies (Flask, Werkzeug, PyMySQL, python-dotenv)
├── .env                    # MySQL credentials and secret key (git-ignored)
├── .env.example            # Environment variables placeholder template
├── .gitignore              # Ignores .env, venv, and Python cache
├── schema.sql              # Normalized MySQL DDL for users and complaints
├── seed.py                 # Development CLI script for database initialization & hashed seeding
│
├── index.html              # Public landing page with hero banner & features
├── login.html              # Authentication portal with 1-click quick-fill demo buttons
├── dashboard.html          # Student dashboard with live KPI counters & recent tickets
├── submit.html             # Grievance submission form with real-time inline validation
├── complaints.html         # Student's complaint history with live search & multi-filters
├── complaint-details.html  # Full ticket view with progress timeline & official remarks
├── admin.html              # Admin control panel with campus KPIs, filters & update modal
│
├── css/
│   └── style.css           # Single unified stylesheet with responsive college theme
│
└── js/
    ├── data.js             # Asynchronous Fetch API layer replacing localStorage
    ├── main.js             # Global session auth verification, dynamic navbar & toasts
    ├── login.js            # Calls POST /api/auth/login with hashed credentials
    ├── dashboard.js        # Asynchronously renders student metrics and recent tickets
    ├── submit.js           # Submits tickets via POST /api/complaints
    ├── complaints.js       # Asynchronously filters complaints via GET /api/complaints
    ├── complaint-details.js# Asynchronously fetches single ticket via GET /api/complaints/<id>
    └── admin.js            # Fetches admin data and updates status via PUT /api/admin/complaints/<id>/status
```

---

## 🛠️ Prerequisites & MySQL Setup

1. **Python 3.10+**: Verify installation with `python --version`.
2. **MySQL Server**: Ensure MySQL Server is running locally (or via XAMPP / WAMP / Docker).
   - Default port: `3306`
   - Default user: `root`

### 1. Configure Environment Variables
Copy `.env.example` to `.env` (or verify `.env`):
```bash
cp .env.example .env
```
Ensure your MySQL credentials in `.env` match your local environment:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=college_complaints
SECRET_KEY=campusvoice_flask_secret_key_2026_secure
PORT=5000
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Initialize & Seed the MySQL Database
Run the standalone development database initializer:
```bash
python seed.py
```
This script will:
- Connect to your MySQL server.
- Execute `schema.sql` to create `college_complaints` database and normalized tables.
- Insert development accounts with **Werkzeug-hashed passwords**:
  - **Student**: `student@college.com` / `12345`
  - **Admin**: `admin@college.com` / `admin123`
- Pre-seed realistic sample complaints (`CMP-1001` through `CMP-1005`).

---

## 🚀 Running the Application

Start the Flask server:
```bash
python app.py
```

Open your browser and navigate to:
```text
http://localhost:5000
```

---

## 👥 Demo User Credentials

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Student** | `student@college.com` | `12345` | Student Dashboard, Submit Complaint, My Complaints, Ticket Details |
| **Administrator** | `admin@college.com` | `admin123` | Admin Portal, All Campus Tickets, Status Update Modal & Remarks |

*(1-Click Demo Login buttons are available on `login.html` for rapid testing).*

---

## 🔌 API Reference

### Authentication
- `POST /api/auth/register` — Register a new student account (`{ name, email, password }`).
- `POST /api/auth/login` — Authenticate and establish Flask session (`{ email, password }`).
- `POST /api/auth/logout` — Terminate session.
- `GET /api/auth/me` — Retrieve active session user information.

### Student Complaints
- `GET /api/complaints` — Retrieve complaints for the authenticated student (Supports `?category=...&status=...&priority=...&search=...`).
- `GET /api/complaints/<complaint_id>` — Retrieve full details for a complaint (Restricted to owner student or admin).
- `POST /api/complaints` — Submit a new grievance (`user_id` taken strictly from session).
- `GET /api/stats/student` — Retrieve student KPI counters (Total, Pending, In Progress, Resolved).

### Administration (Admin Only — HTTP 403 for Students)
- `GET /api/admin/complaints` — View all campus complaints across all students with filters.
- `GET /api/admin/stats` — View campus-wide KPI statistics.
- `PUT /api/admin/complaints/<complaint_id>/status` — Update complaint lifecycle status and official remarks (`{ status, admin_response }`).
