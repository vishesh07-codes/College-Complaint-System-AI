# College Complaint Management System (CampusVoice)

A full-featured, responsive, multi-page web application designed for colleges and universities to enable students to lodge complaints and track their status in real-time, while providing administrators with a powerful control panel to review, assign, and resolve campus grievances.

Built entirely with **pure HTML5, CSS3, and Vanilla JavaScript** — No frameworks, no external libraries, and no build tools required. Simply open `index.html` in any web browser.

---

## 📁 Project Structure

```text
CollegeComplaint-System/
├── index.html               # Public landing page with hero, features & role overview
├── login.html               # Authentication portal with 1-click demo login buttons
├── dashboard.html           # Student dashboard with live KPI counters & recent tickets
├── submit.html              # Validated grievance submission form with inline errors
├── complaints.html          # Student's complaint history with search & multi-filtering
├── complaint-details.html   # Full ticket details, timeline tracker & admin action panel
├── admin.html               # Admin control panel with campus KPIs & status update modal
├── css/
│   └── style.css            # Unified, responsive blue-and-white college theme
├── js/
│   ├── data.js              # Data schema, demo seed records & localStorage CRUD helpers
│   ├── main.js              # Global auth checks, role guards, navbar & toast alerts
│   ├── login.js             # Form validation, credentials check & role routing
│   ├── dashboard.js         # Student metrics calculation & recent complaints list
│   ├── submit.js            # Input validation, ID generator (CMP-100X) & submission
│   ├── complaints.js        # Search & filtering by Category, Status, Priority
│   ├── complaint-details.js # Query-param reader, status timeline & admin updater
│   └── admin.js             # Campus metrics, all-complaints table & status modal
└── README.md                # Project documentation and viva guide
```

---

## 🚀 How to Run the Project

1. **Direct Browser Execution**:
   - Double-click `index.html` or right-click `index.html` &rarr; *Open with Google Chrome / Microsoft Edge / Firefox*.
   - Or open your terminal and run:
     ```bash
     start index.html
     ```

2. **Using a Local Server (Optional)**:
   - If using VS Code: Right-click `index.html` &rarr; **Open with Live Server**.
   - Or with Python:
     ```bash
     python -m http.server 8000
     ```
     Then open `http://localhost:8000` in your browser.

---

## 👥 Demo Roles & Credentials

For fast evaluation and viva testing, **1-Click Quick Fill buttons** are provided directly on `login.html`:

| Role | Email | Password | Allowed Access |
|---|---|---|---|
| **Student** | `student@college.com` | `12345` | Dashboard, Submit Complaint, My Complaints, View Details |
| **Administrator** | `admin@college.com` | `admin123` | Admin Portal, All Complaints, Update Status, Remarks Modal |

---

## 🔄 Roles & Workflow

### 👨‍🎓 Student Flow
1. **Login**: Authenticate at `login.html` as Student.
2. **Dashboard**: View personal statistics (Total, Pending, In Progress, Resolved) and recent activity.
3. **Submit Complaint**: Fill `submit.html` with category, priority, location, title, and detailed description. Inline validation guarantees clean data.
4. **My Complaints**: Search tickets in real time, filter by Category / Status / Priority.
5. **Track Status**: Click "View" to open `complaint-details.html` and inspect the visual step timeline (`Submitted` &rarr; `Under Review` &rarr; `Resolved`) and administrative responses.

### 🏛️ Administrator Flow
1. **Login**: Authenticate at `login.html` as Administrator.
2. **Admin Portal**: View campus-wide KPI metrics and tickets submitted by all students.
3. **Filter & Search**: Quickly filter tickets by department, category, or status.
4. **Update Status**: Click "Update" on any ticket row to open the status modal:
   - Change status: `Pending` &rarr; `In Progress` &rarr; `Resolved` (or `Rejected`).
   - Add official remarks (e.g. *"Work order assigned to AC technician"*).
5. **Cross-Role Reflection**: When the student logs in or visits `complaint-details.html`, the updated status badge, progress timeline, and admin response are displayed instantly.

---

## 📊 Data Schema (`js/data.js`)

All data is stored in the browser's `localStorage` under the key `college_complaints_data` and persists across page reloads:

```javascript
{
  id: "CMP-1001",                   // Auto-generated sequential ID
  studentName: "Aarav Sharma",       // Student full name
  studentEmail: "student@college.com",// Student email
  title: "Wi-Fi drops in Block B",   // Title (min 5 chars)
  category: "IT/Internet",           // Category from pre-defined list
  department: "Computer Science",   // Student department
  location: "Hostel Block B, 3rd Fl",// Exact campus location
  priority: "High",                 // Low, Medium, High, Urgent
  status: "Pending",                 // Pending, In Progress, Resolved, Rejected
  description: "Detailed issue...", // Detailed description (min 15 chars)
  adminResponse: "",                 // Official response added by admin
  createdAt: "2026-08-30T10:30:00Z",// ISO timestamp
  updatedAt: "2026-08-30T10:30:00Z" // ISO timestamp
}
```

### Supported Categories:
`Academic`, `Infrastructure`, `Hostel`, `Library`, `Transport`, `Canteen`, `IT/Internet`, `Administration`, `Cleanliness`, `Other`.

### Status Badges & Colors:
- **Pending**: Orange (`#f59e0b` / bg: `#fef3c7`, text: `#b45309`)
- **In Progress**: Blue (`#3b82f6` / bg: `#dbeafe`, text: `#1d4ed8`)
- **Resolved**: Green (`#10b981` / bg: `#d1fae5`, text: `#047857`)
- **Rejected**: Red (`#ef4444` / bg: `#fee2e2`, text: `#b91c1c`)

---

## 🎓 Viva / Presentation Guide

If explaining this project in a college viva or evaluation, highlight these architectural points:

1. **No Backend Required (localStorage Architecture)**:
   - Data persists in the user's browser `localStorage` using `JSON.stringify()` on write and `JSON.parse()` on read.
   - Initial demo seed complaints auto-populate if the storage is empty, ensuring the application always has rich data for demonstration.

2. **Role-Based Client Guarding (`js/main.js`)**:
   - `enforceAuthGuard()` inspects `window.location.pathname` and the active session in `localStorage`.
   - If a student tries to enter `admin.html`, the system alerts them and redirects to `dashboard.html`.
   - Unauthenticated visitors attempting to open internal portals are redirected to `login.html`.

3. **DOM Manipulation & Real-time Filtering (`js/complaints.js`, `js/admin.js`)**:
   - Live search uses JavaScript array methods (`.filter()`, `.includes()`) attached to `input` and `change` event listeners, dynamically regenerating HTML table rows without full page reloads.

4. **URL Query Parameters (`js/complaint-details.js`)**:
   - `new URLSearchParams(window.location.search).get('id')` is used to load and render specific complaint details dynamically from a single template file.

5. **Responsive CSS Design (`css/style.css`)**:
   - CSS Grid (`grid-template-columns: repeat(auto-fit, minmax(...))`) and Flexbox are used for cards, stats, and navigation.
   - Tables use `.table-responsive` with `overflow-x: auto` so tables never overflow or break on mobile devices.
