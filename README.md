# 🎓 CampusVoice — College Grievance & Complaint Management System

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1.3-black.svg?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-orange.svg?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow.svg?logo=javascript&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-Academic%20%2F%20Open-green.svg)](#license)

**CampusVoice** is a modern, full-stack, institutional-grade web application engineered to digitize, streamline, and govern the grievance redressal lifecycle across college campuses. It completely replaces cumbersome manual paper complaints with a transparent, auditable, role-based digital portal for students, faculty, and campus administrators.

---

## 📑 Table of Contents
- [✨ Key Features](#-key-features)
- [🏗️ System Architecture & Data Flow](#️-system-architecture--data-flow)
- [🔒 Security & Data Integrity Model](#-security--data-integrity-model)
- [📁 Project Directory Structure](#-project-directory-structure)
- [👥 Team Division & Viva Presentation Kit](#-team-division--viva-presentation-kit)
- [⚙️ Prerequisites & Installation](#️-prerequisites--installation)
- [🚀 Running the Project](#-running-the-project)
- [🔑 Seeded Accounts & Testing](#-seeded-accounts--testing)
- [🔌 API Specification](#-api-specification)
- [🛠️ Git & Deployment Commands](#️-git--deployment-commands)

---

## ✨ Key Features

### 👨‍🎓 For Students
* **Modernized Landing Page (`index.html`)**: Rich hero section, real-time statistics counters, department category cards, interactive "How It Works" workflow guide, and FAQ accordion.
* **Dual-Tab Authentication (`login.html`)**: Clean, responsive interface providing both secure **Sign In** and new student **Account Registration (`POST /api/auth/register`)**.
* **Student Dashboard (`dashboard.html`)**: Overview of active complaints, real-time status counters (*Total, Pending, In Progress, Resolved*), and recent ticket shortcuts.
* **Structured Complaint Lodging (`submit.html`)**: Category selection (*Hostel, Academic, Infrastructure, Mess/Canteen, Library, Other*), priority level assignment (*Low, Medium, High*), and real-time form validation.
* **Live History & Filtering (`complaints.html`)**: Real-time in-memory search and multi-filtering by status and priority without page reloads.
* **Detailed Ticket Inspection (`complaint-details.html`)**: Read-only timeline view displaying tracking code (`CMP-100X`), filing timestamp, status badge, and official administration remarks.

### 🛡️ For Campus Administrators
* **Centralized Admin Console (`admin.html`)**: Campus-wide metrics overview with real-time aggregate grievance counters.
* **Master Complaint Roster**: Search, filter, and inspect grievances submitted across all college departments.
* **Status Lifecycle Management**: Update ticket progression (`Pending` &rarr; `In Progress` &rarr; `Resolved` / `Rejected`) with official resolution remarks via an inline modal.
* **Student Identity Linking**: Automated SQL `INNER JOIN` displaying student name, email, and contact details alongside ticket data.

---

## 🏗️ System Architecture & Data Flow

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER                                     |
|  [HTML5 / CSS3 / Vanilla JavaScript ES6+]                                             |
|  - Student Views: index, login, dashboard, submit, complaints, complaint-details      |
|  - Admin Console: admin.html                                                          |
+------------------------------------------+--------------------------------------------+
                                           | HTTP Requests (JSON + Session Cookies)
                                           v
+---------------------------------------------------------------------------------------+
|                               FLASK APPLICATION SERVER                                |
|  [Python 3.10+ / Flask 3.1.3 / Werkzeug]                                              |
|  - Static / Template Routing: Serves UI views                                         |
|  - Middleware Guards: @login_required, @admin_required                                |
|  - RESTful API Handlers: /api/auth/*, /api/complaints/*, /api/admin/*                 |
+------------------------------------------+--------------------------------------------+
                                           | Parameterized Queries (PyMySQL)
                                           v
+---------------------------------------------------------------------------------------+
|                                  DATABASE ENGINE                                      |
|  [MySQL 8.0+ / MariaDB (Port 3306)]                                                   |
|  - Database: `college_complaints`                                                     |
|  - Normalized 3NF Tables: `users` (1) <--- [FK: user_id] ---> (N) `complaints`        |
+---------------------------------------------------------------------------------------+
```

### End-to-End Complaint Lifecycle:
1. **Filing**: Student submits form on `submit.html`; client-side JS validates non-empty inputs and executes `fetch('/api/complaints', { method: 'POST' })`.
2. **Authorization & Validation**: Flask validates active session (`session['user_id']`), sanitizes payload, and generates a formatted reference (`CMP-100X`).
3. **Database Insertion**: PyMySQL executes a parameterized `INSERT` query linking `user_id` foreign key.
4. **Resolution**: Admin reviews complaint on `admin.html`, selects status, inputs remarks, and sends `PUT /api/admin/complaints/<id>/status`.
5. **Auditing**: MySQL automatically updates `updated_at` timestamp and status transitions in real time.

---

## 🔒 Security & Data Integrity Model

* **Single Source of Truth**: Data is strictly persisted in MySQL (no `localStorage` data leakage or SQLite shortcuts).
* **Third Normal Form (3NF)**: Student information is not duplicated in `complaints`. Lookups join `users` dynamically.
* **Cryptographic Password Hashing**: Utilizes Werkzeug's modern `scrypt` hashing algorithm with randomized salt generation (`generate_password_hash` / `check_password_hash`). Plaintext passwords are never stored.
* **Stateful Session Security**: Authenticated sessions are cryptographically signed using Flask's `SECRET_KEY` and transmitted via HTTP cookies.
* **Insecure Direct Object Reference (IDOR) Protection**: Students are strictly bounded to `WHERE user_id = session['user_id']`. Directly querying or manipulating another student's complaint ID returns `HTTP 403 Forbidden`.
* **SQL Injection Prevention**: All queries strictly employ parameterized statements (`%s` placeholders with tuple arguments), ensuring user inputs are treated solely as literal values.
* **Data Preservation (No Cascade Delete)**: Foreign keys use `ON DELETE RESTRICT` semantics so official institutional grievance records are preserved even if an account is removed.

---

## 📁 Project Directory Structure

```text
CollegeComplaint-System/
├── app.py                                              # Flask application server, route controllers & auth guards
├── requirements.txt                                    # Project dependencies (Flask, Werkzeug, PyMySQL, python-dotenv, python-docx)
├── .env                                                # MySQL database credentials & secret key (git-ignored)
├── .env.example                                        # Environment configuration template
├── .gitignore                                          # Git ignore rules for venv, cache, and sensitive files
├── schema.sql                                          # MySQL schema definition (users & complaints tables)
├── seed.py                                             # CLI database provisioning & sample data seeder
│
├── CampusVoice_Project_Presentation_and_Viva_Guide.pdf  # 📄 Formatted, printable project & viva evaluation document
├── CampusVoice_Project_Presentation_and_Viva_Guide.docx # 📝 Microsoft Word editable viva presentation guide
├── CampusVoice_Project_Presentation_and_Viva_Guide.md   # 📖 Markdown presentation guide & examiners' Q&A
├── generate_docs.py                                    # Automated script to generate .docx guide
├── generate_pdf.py                                     # Headless browser pipeline to generate printable PDF
│
├── index.html                                          # Modern landing page (hero, categories, workflow, FAQs)
├── login.html                                          # Dual-tab portal (Sign In & Register Account)
├── dashboard.html                                      # Student portal with live KPI metrics & recent tickets
├── submit.html                                         # Structured complaint submission form
├── complaints.html                                     # Filterable student complaint history roster
├── complaint-details.html                              # Detailed ticket view with timeline & admin remarks
├── admin.html                                          # Administrator management console & status modal
│
├── css/
│   └── style.css                                       # Central stylesheet with responsive layout & CSS variables
│
└── js/
    ├── data.js                                         # Centralized asynchronous Fetch API abstraction layer
    ├── main.js                                         # Navigation bar state, session checks & toast alerts
    ├── login.js                                        # Login & account registration event handlers
    ├── dashboard.js                                    # Asynchronously renders student dashboard metrics
    ├── submit.js                                       # Validates & transmits new complaint submissions
    ├── complaints.js                                   # In-memory search & multi-filtering table engine
    ├── complaint-details.js                            # Fetches & displays individual complaint timeline
    └── admin.js                                        # Admin dashboard loader & status update controller
```

---

## 👥 Team Division & Viva Presentation Kit

This repository includes a complete academic presentation package with **2-minute evaluation scripts** and **Top 5 Viva Questions with technical answers** for each team member:

| Member | Module Focus | Core Code Files | Key Concept for Evaluators |
| :--- | :--- | :--- | :--- |
| **Member 1** | **Frontend & UI** | `*.html`, `js/data.js`, `css/style.css` | Native DOM manipulation, async/await fetch, in-memory table filtering, zero-build bundle. |
| **Member 2** | **Backend & REST APIs** | `app.py` (Controllers & Endpoints) | RESTful API design, request parsing & validation, connection rollback, `@wraps` decorators. |
| **Member 3** | **Database & Modeling** | `schema.sql`, `seed.py`, MySQL | 3NF Normalization, foreign key integrity, ENUM data constraints, parameterized SQL queries. |
| **Member 4** | **Auth & Security** | `app.py` (Auth, Werkzeug, Sessions) | One-way `scrypt` hashing with salts, signed session cookies, RBAC decorators, IDOR prevention. |

> 📚 **Complete Viva Documentation**:
> * **[Download / View PDF Guide](CampusVoice_Project_Presentation_and_Viva_Guide.pdf)**
> * **[Download / View Word (.docx) Guide](CampusVoice_Project_Presentation_and_Viva_Guide.docx)**
> * **[Read Markdown Guide Online](CampusVoice_Project_Presentation_and_Viva_Guide.md)**

---

## ⚙️ Prerequisites & Installation

### 1. Requirements
* **Python 3.10+**
* **MySQL Server 8.0+** (running locally or via XAMPP / WAMP / Docker)
* **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/vishesh07-codes/College-Complaint-System-AI.git
cd College-Complaint-System-AI
```

### 3. Create & Activate a Virtual Environment
```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Configure MySQL Environment Variables
Create your local `.env` file by copying `.env.example`:
```bash
cp .env.example .env
```
Open `.env` and verify your local database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=college_complaints
SECRET_KEY=campusvoice_flask_secret_key_2026_secure
PORT=5000
```

### 6. Provision & Seed the Database
Run the seed script to automatically execute `schema.sql`, build the database, and insert demo users:
```bash
python seed.py
```

---

## 🚀 Running the Project

Start the local Flask development server:
```bash
python app.py
```

Open your browser and navigate to:
```text
http://localhost:5000
```

---

## 🔑 Seeded Accounts & Testing

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Student** | `student@college.com` | `12345` | Student Dashboard, Submit Grievance, My Complaints, Ticket Tracking |
| **Administrator** | `admin@college.com` | `admin123` | Master Admin Console, Campus-Wide Complaints, Status Resolution Modal |

> 💡 **Creating New Accounts**: You can click the **Create Account** tab on `login.html` to register any new student with full validation!

---

## 🔌 API Specification

### Authentication Routes
* `POST /api/auth/register` — Register a new student account (`{ name, email, password }`).
* `POST /api/auth/login` — Authenticate user and initiate secure session (`{ email, password }`).
* `POST /api/auth/logout` — Invalidate user session.
* `GET /api/auth/me` — Return identity and role of currently authenticated session.

### Student Complaint Routes
* `GET /api/complaints` — Retrieve complaints for the active student (Supports `?category=...&status=...&priority=...&search=...`).
* `POST /api/complaints` — Lodge a new grievance (`{ title, category, priority, description }`).
* `GET /api/complaints/<id>` — Retrieve full details of a specific grievance (Ownership enforced).
* `GET /api/stats/student` — Return KPI counter metrics for logged-in student.

### Admin Complaint Routes (Restricted: HTTP 403 for Non-Admins)
* `GET /api/admin/complaints` — Fetch master list of all college complaints with student details.
* `GET /api/admin/stats` — Fetch campus-wide aggregate statistics.
* `PUT /api/admin/complaints/<id>/status` — Update complaint status and resolution remarks (`{ status, admin_remarks }`).

---

## 🛠️ Git & Deployment Commands

```bash
# Check working tree status
git status

# Stage all project files
git add .

# Commit changes
git commit -m "Update documentation and features"

# Push to GitHub
git push origin main
```

---

## 📜 License
This project is developed for academic evaluation, software engineering coursework, and educational demonstration. Feel free to adapt and expand for institutional use!
