import os
import subprocess
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_color):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def create_word_document(filename):
    doc = Document()

    # Page setup - Standard 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Styles & Colors
    PRIMARY = RGBColor(37, 99, 235)     # Royal Blue #2563eb
    DARK = RGBColor(15, 23, 42)         # Slate 900 #0f172a
    MUTED = RGBColor(71, 85, 105)       # Slate 600 #475569
    ACCENT = RGBColor(13, 148, 136)     # Teal #0d9488

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = p_title.add_run("CampusVoice")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(26)
    run_title.font.bold = True
    run_title.font.color.rgb = PRIMARY

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = p_sub.add_run("College Grievance Management System\nComplete Project Architecture, Team Division & Viva Guide")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(15)
    run_sub.font.bold = True
    run_sub.font.color.rgb = DARK

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_meta = p_meta.add_run("Role: Senior Full Stack Engineer & College Evaluator Guide | Team Size: 3-4 Members")
    run_meta.font.name = "Arial"
    run_meta.font.size = Pt(10)
    run_meta.font.italic = True
    run_meta.font.color.rgb = MUTED

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    def add_heading_1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(6)
        r = h.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(16)
        r.font.bold = True
        r.font.color.rgb = PRIMARY
        return h

    def add_heading_2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = DARK
        return h

    def add_heading_3(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(2)
        r = h.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = ACCENT
        return h

    def add_body_p(text, bold_prefix="", italic=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = "Arial"
            rb.font.size = Pt(10.5)
            rb.font.bold = True
            rb.font.color.rgb = DARK
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(10.5)
        r.font.italic = italic
        r.font.color.rgb = DARK
        return p

    def add_bullet_p(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = "Arial"
            rb.font.size = Pt(10)
            rb.font.bold = True
            rb.font.color.rgb = DARK
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(10)
        r.font.color.rgb = DARK
        return p

    def add_callout(text, title="2-MINUTE SCRIPT FOR THE EXAMINER"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_background(cell, "F1F5F9")  # Slate 100
        set_cell_margins(cell, top=140, bottom=140, left=200, right=200)

        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(4)
        r_title = p.add_run(f"★ {title}\n")
        r_title.font.name = "Arial"
        r_title.font.size = Pt(11)
        r_title.font.bold = True
        r_title.font.color.rgb = PRIMARY

        r_text = p.add_run(f'"{text}"')
        r_text.font.name = "Arial"
        r_text.font.size = Pt(10)
        r_text.font.italic = True
        r_text.font.color.rgb = DARK
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    def add_qa_box(q_text, a_text):
        p_q = doc.add_paragraph()
        p_q.paragraph_format.space_before = Pt(8)
        p_q.paragraph_format.space_after = Pt(2)
        rq = p_q.add_run(q_text)
        rq.font.name = "Arial"
        rq.font.size = Pt(10.5)
        rq.font.bold = True
        rq.font.color.rgb = PRIMARY

        p_a = doc.add_paragraph()
        p_a.paragraph_format.space_after = Pt(6)
        p_a.paragraph_format.line_spacing = 1.15
        ra_lbl = p_a.add_run("Direct Answer: ")
        ra_lbl.font.name = "Arial"
        ra_lbl.font.size = Pt(10)
        ra_lbl.font.bold = True
        ra_lbl.font.color.rgb = DARK

        ra = p_a.add_run(a_text)
        ra.font.name = "Arial"
        ra.font.size = Pt(10)
        ra.font.color.rgb = DARK

    # ==================== SECTION 1 ====================
    add_heading_1("1. High-Level Architecture Overview")
    add_body_p(
        "CampusVoice is an enterprise-pattern, role-governed web application built to modernize and digitize college grievance redressal. "
        "It eliminates physical paperwork, lost complaint records, and lack of transparency by providing an auditable, automated complaint tracking portal."
    )

    add_heading_2("Core System Personas & Workflow")
    add_bullet_p("Can register, log in, lodge complaints categorized by department (Hostel, Academic, Infrastructure, Mess, Library, Other), assign priority (Low, Medium, High), track live status in real time, and view resolution remarks.", "1. Students: ")
    add_bullet_p("Can access an administrative control roster, inspect complaints college-wide, filter grievances, update status (Pending -> In Progress -> Resolved / Rejected), and provide formal administrative remarks.", "2. Administrators: ")

    add_heading_2("End-to-End Architectural Data Flow")
    add_bullet_p("Student fills out grievance form on submit.html (Title, Category, Priority, Description).", "Step 1 (Client Submission): ")
    add_bullet_p("JavaScript (submit.js) intercepts submit event, validates non-empty inputs, and calls data.js (createComplaint).", "Step 2 (Client Validation & Fetch): ")
    add_bullet_p("A POST request carrying a JSON payload and session cookies is transmitted to /api/complaints.", "Step 3 (HTTP Transmission): ")
    add_bullet_p("Flask checks session['user_id'] via @login_required, re-validates payload bounds, and generates a formatted ID (CMP-100X).", "Step 4 (Controller & Auth Guards): ")
    add_bullet_p("PyMySQL executes a parameterized INSERT query into MySQL, assigning user_id foreign key.", "Step 5 (Database Persistence): ")
    add_bullet_p("JSON confirmation { success: true, complaint_id } returns; UI renders instant notification toast without page reload.", "Step 6 (UI Feedback): ")
    add_bullet_p("Admin logs in, views grievances via GET /api/admin/complaints (JOIN with users table), and updates status via PUT /api/admin/complaints/<id>/status.", "Step 7 (Admin Lifecycle): ")

    # ==================== SECTION 2 ====================
    add_heading_1("2. Member 1: Frontend Module")
    add_body_p("Responsible for the Presentation Tier, Client-Side State, DOM Manipulation, and API Fetching.", "Role Summary: ")

    add_heading_2("File & Component Breakdown")
    add_bullet_p("Public landing page featuring the hero section, quick categories, workflow cards, statistics, and FAQ accordion.", "index.html: ")
    add_bullet_p("Dual-tab authentication interface supporting both Sign In and Create Account registration forms.", "login.html: ")
    add_bullet_p("Student portal with live metric cards (Total, Pending, In Progress, Resolved) and recent complaints roster.", "dashboard.html: ")
    add_bullet_p("Structured complaint filing form with category and priority dropdowns.", "submit.html: ")
    add_bullet_p("Complete student complaint history table with live search, status filtering, and priority filtering.", "complaints.html: ")
    add_bullet_p("Read-only timeline view displaying tracking code, student identity, timestamp, status badge, and official admin remarks.", "complaint-details.html: ")
    add_bullet_p("Restricted administrative console with metric cards, searchable master complaint roster, and inline status update modal.", "admin.html: ")
    add_bullet_p("Centralized API abstraction module containing async/await fetch functions for all backend endpoints.", "js/data.js: ")
    add_bullet_p("Global layout controller managing active navbar links, greeting updates, session checks, and toast alerts.", "js/main.js: ")
    add_bullet_p("Mobile-responsive styling utilizing CSS variables, flexbox, CSS grid, and interactive hover states.", "css/style.css: ")

    add_callout(
        "Good morning, Respected Evaluator. I was responsible for the Frontend and Client-Side Architecture of CampusVoice. "
        "Our design goal was to build a clean, mobile-responsive, zero-dependency interface that provides students and administrators with intuitive navigation. "
        "I designed seven key pages using HTML5, modern CSS3, and JavaScript ES6. For students, we built dedicated views for registration, complaint submission, tracking history, and detailed status inspection. For staff, we built an administrative portal with filterable status tables. "
        "Instead of scattering API calls across individual pages, I abstracted all backend communication into a centralized service module, js/data.js. Whenever an action occurs—such as lodging a complaint—the form validates input constraints client-side, builds a JSON payload, and initiates an asynchronous fetch() call. If the backend accepts the request, our UI immediately parses the JSON response and dynamically updates the DOM using templates without requiring a full page refresh. We also implemented an alert toast system that gives instant visual feedback for errors or success states. "
        "Now I am ready to answer any questions regarding our frontend design, DOM manipulation, or client-side API integration."
    )

    add_heading_2("Top 5 Frontend Viva Questions & Answers")
    add_qa_box(
        "Q1: Why did you use Vanilla JavaScript instead of a framework like React or Vue?",
        "Vanilla JavaScript was chosen to eliminate complex build tooling, node_modules dependencies, and bundle overhead. It leverages native browser DOM APIs and the fetch interface directly, providing instant load times, zero compilation requirements, and proving foundational software engineering principles without framework abstraction."
    )
    add_qa_box(
        "Q2: How do you prevent a user from submitting an empty or invalid complaint form?",
        "We implement two-tier validation. On the frontend in submit.js, we attach an event listener to form submission, call event.preventDefault(), and verify that title, category, priority, and description are non-empty. If invalid, an alert toast is shown immediately. If valid, data is sent to the server, which independently verifies the payload before database insertion."
    )
    add_qa_box(
        "Q3: How does your search and filter feature work on complaints.html?",
        "When complaints are fetched via GET /api/complaints, they are held in a client-side array. We listen to input and change events on the search box and dropdowns. On each trigger, an in-memory filter runs: checking if complaint titles match the query string and whether the status matches the selected filter. The table DOM is then immediately updated without repeated network round-trips."
    )
    add_qa_box(
        "Q4: How is sensitive data protected on the client side? Are passwords or tokens saved in localStorage?",
        "No passwords, tokens, or credentials are stored in localStorage or sessionStorage. Storing authentication tokens in localStorage leaves them vulnerable to Cross-Site Scripting (XSS) attacks. Instead, our application uses server-controlled HTTP session cookies handled transparently and securely by the browser."
    )
    add_qa_box(
        "Q5: What is the purpose of event.preventDefault() in your form handling?",
        "By default, submitting an HTML form initiates a traditional HTTP navigation that reloads the entire page. Calling event.preventDefault() suppresses this behavior, allowing our asynchronous JavaScript (fetch) to transmit data in the background and update the interface smoothly."
    )

    # ==================== SECTION 3 ====================
    add_heading_1("3. Member 2: Backend & API Module")
    add_body_p("Responsible for Server Setup, RESTful Routing, Controller Logic, Request Validation, and Error Handling.", "Role Summary: ")

    add_heading_2("API Routing & Controller Architecture")
    add_bullet_p("Flask 3.x WSGI micro-framework written in Python.", "Server Framework: ")
    add_bullet_p("POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me", "Auth Endpoints: ")
    add_bullet_p("GET /api/complaints (Student's own), POST /api/complaints (Lodge), GET /api/complaints/<id> (Details)", "Student Endpoints: ")
    add_bullet_p("GET /api/admin/complaints (Master list with JOIN), PUT /api/admin/complaints/<id>/status (Update status & remarks)", "Admin Endpoints: ")

    add_callout(
        "Good morning, Respected Evaluator. I developed the Backend Server and RESTful API Layer of this system. "
        "Our backend is built using Python and Flask. We structured the backend around REST design principles, establishing clear separation between user interfaces and data services. All business logic is centralized in app.py, which exposes structured endpoints under /api/auth, /api/complaints, and /api/admin. "
        "Whenever a request reaches our server, it goes through our validation pipeline. First, our custom Python route decorators intercept the request to verify whether the client holds an active session and whether their role has permission to access that endpoint. Second, our controllers validate the incoming JSON payload to ensure required fields are present, properly formatted, and within acceptable limits. "
        "For example, when an administrator changes a grievance status via PUT /api/admin/complaints/<id>/status, our backend validates that the requested status belongs to our permitted set—Pending, In Progress, Resolved, or Rejected—executes an update query via PyMySQL, and returns a structured JSON confirmation. Every database operation includes automated connection pooling, commit, and rollback logic to safeguard against errors. "
        "I am pleased to demonstrate any route controller, middleware logic, or API response handling."
    )

    add_heading_2("Top 5 Backend Viva Questions & Answers")
    add_qa_box(
        "Q1: What is a REST API and why did you choose it for this project?",
        "REST (Representational State Transfer) is an architectural style utilizing standard HTTP methods (GET, POST, PUT, DELETE) and exchanging stateless JSON payloads. We chose REST because it cleanly decouples the frontend user experience from server business logic, allowing either layer to be upgraded, tested, or scaled independently."
    )
    add_qa_box(
        "Q2: What are Python Decorators and how did you use them in your Flask code?",
        "A decorator is a design pattern that wraps an existing function to extend its behavior dynamically. We implemented @login_required to verify the existence of session['user_id'] and @admin_required to verify session.get('role') == 'admin'. If unauthorized, requests are terminated immediately with HTTP 401 or 403 status codes."
    )
    add_qa_box(
        "Q3: Why do you use PUT instead of POST for updating a complaint status?",
        "Under HTTP/1.1 semantics, POST is intended for creating subordinate resources, whereas PUT is specified for updating or replacing an existing resource at a specific URI. Since updating a status modifies an existing record at /api/admin/complaints/<id>/status, PUT is semantically correct and idempotent."
    )
    add_qa_box(
        "Q4: How does Flask handle Cross-Origin Resource Sharing (CORS)?",
        "Because our Flask application serves both the static frontend files and the REST API endpoints from the same origin (host and port), CORS browser policies are not triggered. If the frontend were deployed on a different domain, we would configure the flask-cors extension to set Access-Control-Allow-Origin headers."
    )
    add_qa_box(
        "Q5: What happens if the database goes down while a user submits a complaint?",
        "The database connection attempt raises a pymysql.MySQLError. In our controller, this is intercepted inside a try...except block: any open transaction is rolled back via conn.rollback(), the error is logged, and the client receives a clean HTTP 500 JSON response ({'error': 'Database unavailable'}) without crashing the application."
    )

    # ==================== SECTION 4 ====================
    add_heading_1("4. Member 3: Database & Data Modeling")
    add_body_p("Responsible for Schema Normalization, Relational Modeling, Data Types, Constraints, and Persistence.", "Role Summary: ")

    add_heading_2("Relational Schema Definition")
    add_bullet_p("id (PK, AUTO_INCREMENT), name (VARCHAR 100), email (VARCHAR 100 UNIQUE), password (VARCHAR 255), role (ENUM 'student', 'admin'), created_at (TIMESTAMP).", "Table 'users': ")
    add_bullet_p("id (PK), complaint_id (VARCHAR 20 UNIQUE), user_id (FK -> users.id), title (VARCHAR 200), category (ENUM), priority (ENUM), description (TEXT), status (ENUM), admin_remarks (TEXT), created_at, updated_at.", "Table 'complaints': ")

    add_callout(
        "Good morning, Respected Evaluator. I was responsible for the Database Architecture, Relational Modeling, and Data Persistence. "
        "For our storage engine, we chose MySQL because of its ACID transactional guarantees and robust foreign key integrity. Our database, college_complaints, contains two core relational entities: users and complaints. "
        "When designing the schema, our primary objective was achieving Third Normal Form (3NF). We deliberately avoided storing redundant student information—such as student name or contact details—inside the complaints table. Instead, the complaints table holds a foreign key reference, user_id, linked to users.id. Whenever the admin portal needs student details, we execute an optimized INNER JOIN in MySQL. If a student ever updates their profile details, the change is reflected across all their past grievances automatically with zero data inconsistencies. "
        "Furthermore, we enforced strict data integrity using SQL ENUM constraints for fields like grievance category, priority, and status. We also separated our database primary key—an auto-incrementing integer for index efficiency—from our human-readable tracking identifier, complaint_id. All connections use parameterized SQL queries through PyMySQL, completely safeguarding the database from SQL Injection. "
        "I am ready to explain our schema constraints, normalization stages, or query executions."
    )

    add_heading_2("Top 5 Database Viva Questions & Answers")
    add_qa_box(
        "Q1: What is Normalization and what Normal Form is your database in?",
        "Normalization organizes relational tables to eliminate redundancy and update anomalies. Our schema satisfies Third Normal Form (3NF): all columns contain atomic values (1NF), all attributes depend fully on the primary key without partial dependencies (2NF), and there are no transitive dependencies (3NF)—student details exist exclusively in the users table."
    )
    add_qa_box(
        "Q2: What happens if a user record is deleted? What is your Foreign Key strategy?",
        "In our schema, FOREIGN KEY (user_id) REFERENCES users(id) does not use ON DELETE CASCADE. Grievance records constitute formal institutional legal records and must never be deleted accidentally if an account is removed. The database prevents deletion of a user who has active complaints, preserving institutional history."
    )
    add_qa_box(
        "Q3: What is the difference between VARCHAR and TEXT in your schema?",
        "VARCHAR(200) stores variable-length strings inline up to 200 characters, ideal for short, indexable data like title and complaint_id. TEXT stores larger text blocks up to 64KB off-page with an internal pointer, making it ideal for complaint descriptions and admin remarks without bloating the primary row size."
    )
    add_qa_box(
        "Q4: Why did you use ENUM for Status and Category instead of plain VARCHAR?",
        "ENUM provides two critical benefits: first, it strictly restricts inputs to predefined valid options ('Pending', 'In Progress', 'Resolved', 'Rejected') at the database level. Second, MySQL internally stores ENUM values as 1-byte integer indices, improving query performance and storage efficiency."
    )
    add_qa_box(
        "Q5: How do you prevent SQL Injection at the database communication layer?",
        "We strictly utilize parameterized queries via PyMySQL using %s parameter placeholders. The SQL structure is compiled first, and parameters are transmitted as literal data rather than concatenated code, completely preventing SQL syntax injection."
    )

    # ==================== SECTION 5 ====================
    add_heading_1("5. Member 4 / Shared: Authentication & Role-Based Access")
    add_body_p("Responsible for Password Cryptography, Stateful Sessions, Route Authorization, and IDOR Prevention.", "Role Summary: ")

    add_heading_2("Security & Cryptographic Architecture")
    add_bullet_p("Passwords are never stored in plaintext or reversible encryption. We use Werkzeug's generate_password_hash() implementing the scrypt algorithm with unique cryptographic salts.", "Password Hashing: ")
    add_bullet_p("Flask manages signed session cookies using a server-side SECRET_KEY. Cookies cannot be tampered with by the client.", "Session Management: ")
    add_bullet_p("Enforced in controllers: Students can strictly query complaints WHERE user_id = session['user_id']. Students attempting to fetch another student's complaint ID receive HTTP 403 Forbidden.", "IDOR Protection: ")

    add_callout(
        "Good morning, Respected Evaluator. I was responsible for Authentication, Cryptography, and Role-Based Access Control (RBAC). "
        "Security is the backbone of any institution-grade portal. We focused on three critical security vectors: password protection, session security, and horizontal/vertical authorization. "
        "First, we enforce zero plaintext password storage. When a student registers, their password is processed through Werkzeug’s cryptographic engine using the scrypt hashing algorithm with randomized salt generation. Even if an intruder obtained a raw dump of our database, the passwords cannot be reversed or decrypted via dictionary or rainbow-table attacks. "
        "Second, we implemented stateful session management. Upon successful login, the server writes cryptographically signed session cookies. We created custom Python decorators—@login_required and @admin_required—that intercept requests to sensitive endpoints. "
        "Third, we protected against Insecure Direct Object References (IDOR). A student cannot view another student's complaint simply by altering the URL or ID. Our backend always cross-checks the logged-in session['user_id'] against the database record's owner before returning data. Admins, and only admins, have permission to trigger status updates via /api/admin. "
        "I am prepared to explain our hashing algorithms, session lifecycle, or authorization code."
    )

    add_heading_2("Top 5 Auth & Security Viva Questions & Answers")
    add_qa_box(
        "Q1: Why should passwords never be stored in plain text or encrypted with two-way encryption like AES?",
        "Plain text exposes credentials directly in case of a database breach. Two-way encryption relies on a private secret key; if that key is compromised, all passwords can be decrypted. In contrast, one-way cryptographic hashing (scrypt) is irreversible: verification compares hashes rather than reconstructing passwords."
    )
    add_qa_box(
        "Q2: What is a Salt and why is it important in password hashing?",
        "A salt is a cryptographically random byte string generated and appended to the password before hashing. It ensures that identical passwords generate completely different hashes in the database, fully defeating precomputed rainbow-table and dictionary attacks."
    )
    add_qa_box(
        "Q3: What is the difference between Authentication and Authorization?",
        "Authentication (AuthN) verifies identity ('Who are you?'), such as checking credentials during login. Authorization (AuthZ) verifies permissions ('What are you permitted to do?'), such as confirming whether an authenticated user possesses the admin role to modify grievance statuses."
    )
    add_qa_box(
        "Q4: What is an IDOR vulnerability and how did you prevent it?",
        "IDOR (Insecure Direct Object Reference) occurs when an application exposes a record identifier (e.g. /api/complaints/5) without verifying ownership. We prevent this by verifying in app.py: if session.get('role') != 'admin' and complaint['user_id'] != session['user_id']: return jsonify({'error': 'Access denied'}), 403."
    )
    add_qa_box(
        "Q5: How does Flask protect against Session Tampering?",
        "Flask signs session cookies cryptographically using HMAC with the application's SECRET_KEY. If a client tampers with cookie contents (such as changing role: 'student' to 'admin'), the cryptographic signature verification fails on the server, and Flask discards the session immediately."
    )

    # ==================== SECTION 6: CHEAT SHEET ====================
    add_heading_1("6. Team Coordination Quick Reference Table")
    tbl = doc.add_table(rows=5, cols=4)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Member", "Focus Area", "Primary Code Files", "Key Technical Concept"]
    for i, h in enumerate(headers):
        cell = tbl.cell(0, i)
        set_cell_background(cell, "2563EB")
        set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.name = "Arial"
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    data = [
        ("Member 1", "Frontend & UI", "*.html, js/data.js, css/style.css", "Async/Await Fetch, In-Memory Filtering, DOM Templates, Toasts"),
        ("Member 2", "Backend & APIs", "app.py (Routes & Controllers)", "REST Architecture, JSON Validation, PyMySQL, Error Rollback"),
        ("Member 3", "Database & Schema", "schema.sql, seed.py, MySQL", "3NF Normalization, Foreign Key Integrity, ENUMs, INNER JOINs"),
        ("Member 4", "Auth & Security", "app.py (Decorators, Werkzeug)", "scrypt Hashing, Session Cookies, RBAC Decorators, IDOR Protection")
    ]

    for row_idx, row_data in enumerate(data, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            cell = tbl.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.name = "Arial"
            r.font.size = Pt(9.5)
            r.font.color.rgb = DARK

    doc.save(filename)
    print(f"[SUCCESS] Word document saved to: {filename}")

if __name__ == "__main__":
    docx_path = os.path.abspath("CampusVoice_Project_Presentation_and_Viva_Guide.docx")
    create_word_document(docx_path)
