#!/usr/bin/env python3
"""
app.py
College Complaint Management System — Flask Backend
Full-stack REST API with MySQL persistence, Flask session authentication,
strict role-based authorization, and static/HTML routing.
"""

import os
import sys
import re
from datetime import datetime
from functools import wraps
import pymysql
from dotenv import load_dotenv
from flask import (
    Flask, request, jsonify, session, send_from_directory,
    redirect, abort
)
from werkzeug.security import generate_password_hash, check_password_hash

# Load environment configuration
load_dotenv()

# MySQL Database Credentials
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', '3306'))
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'college_complaints')
SECRET_KEY = os.getenv('SECRET_KEY', 'campusvoice_flask_secret_key_2026_secure')
PORT = int(os.getenv('PORT', '5000'))

# Base directory for serving static assets and HTML files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=None)
app.secret_key = SECRET_KEY
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'


def get_db():
    """
    Establish a connection strictly to the MySQL database.
    If MySQL connection fails, raises an error.
    """
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        return conn
    except Exception as e:
        print(f"[DATABASE ERROR] Failed to connect to MySQL: {e}", file=sys.stderr)
        raise ConnectionError(
            f"MySQL connection failed to {DB_HOST}:{DB_PORT}/{DB_NAME}. "
            "Please ensure MySQL is actively running and credentials in .env are correct."
        )


def check_mysql_connection_on_startup():
    """Verify MySQL connectivity at startup and exit cleanly if unreachable."""
    try:
        conn = get_db()
        conn.close()
        print(f"[OK] Successfully connected to MySQL database '{DB_NAME}' at {DB_HOST}:{DB_PORT}.")
    except Exception as e:
        print("\n" + "=" * 70, file=sys.stderr)
        print("[FATAL ERROR] Unable to start server: MySQL database is unavailable.", file=sys.stderr)
        print(f"Details: {e}", file=sys.stderr)
        print("Please verify that your MySQL server is running and .env settings are correct.", file=sys.stderr)
        print("=" * 70 + "\n", file=sys.stderr)


# ============================================================================
# AUTHENTICATION & AUTHORIZATION DECORATORS
# ============================================================================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            return jsonify({'error': 'Authentication required. Please log in.'}), 401
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            return jsonify({'error': 'Authentication required. Please log in.'}), 401
        if session.get('role') != 'admin':
            return jsonify({'error': 'Forbidden: Administrator privileges required.'}), 403
        return f(*args, **kwargs)
    return decorated_function


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def format_complaint(row):
    """
    Format database row to match the JSON structure expected by the frontend.
    """
    if not row:
        return None

    created_at = row.get('created_at')
    updated_at = row.get('updated_at')

    if isinstance(created_at, datetime):
        created_at = created_at.strftime('%Y-%m-%dT%H:%M:%S.000Z')
    if isinstance(updated_at, datetime):
        updated_at = updated_at.strftime('%Y-%m-%dT%H:%M:%S.000Z')

    return {
        'id': row.get('complaint_id'),
        'studentName': row.get('student_name', 'Student'),
        'studentEmail': row.get('student_email', ''),
        'title': row.get('title', ''),
        'category': row.get('category', ''),
        'department': row.get('department') or 'General',
        'location': row.get('location') or 'Campus',
        'priority': row.get('priority', 'Medium'),
        'status': row.get('status', 'Pending'),
        'description': row.get('description', ''),
        'adminResponse': row.get('admin_response') or '',
        'createdAt': created_at,
        'updatedAt': updated_at
    }


def generate_next_complaint_id(cursor):
    """
    Generate sequential complaint ID formatted as CMP-100X.
    """
    cursor.execute("""
        SELECT MAX(CAST(SUBSTRING(complaint_id, 5) AS UNSIGNED)) AS max_id 
        FROM complaints 
        WHERE complaint_id LIKE 'CMP-%'
    """)
    result = cursor.fetchone()
    max_num = result['max_id'] if (result and result['max_id']) else 1000
    return f"CMP-{max_num + 1}"


# ============================================================================
# AUTHENTICATION API ENDPOINTS
# ============================================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    role = data.get('role', 'student').strip().lower()

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required.'}), 400

    if role not in ['student', 'admin']:
        role = 'student'

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return jsonify({'error': 'An account with this email already exists.'}), 409

            hashed_password = generate_password_hash(password)
            cursor.execute(
                "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
                (name, email, hashed_password, role)
            )
            user_id = cursor.lastrowid

        return jsonify({
            'success': True,
            'message': 'Account created successfully.',
            'user': {'id': user_id, 'name': name, 'email': email, 'role': role}
        }), 201
    except ConnectionError as ce:
        return jsonify({'error': str(ce)}), 500
    except Exception as e:
        return jsonify({'error': f'Failed to register user: {str(e)}'}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({'error': 'Please provide both email and password.'}), 400

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()

        if not user or not check_password_hash(user['password'], password):
            return jsonify({'error': 'Invalid email or password.'}), 401

        # Establish server-side session
        session['user_id'] = user['id']
        session['email'] = user['email']
        session['name'] = user['name']
        session['role'] = user['role']

        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'role': user['role']
            }
        }), 200
    except ConnectionError as ce:
        return jsonify({'error': str(ce)}), 500
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully.'}), 200


@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'authenticated': False, 'user': None}), 401

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name, email, role, created_at FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()

        if not user:
            session.clear()
            return jsonify({'authenticated': False, 'user': None}), 401

        return jsonify({
            'authenticated': True,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'role': user['role']
            }
        }), 200
    except ConnectionError as ce:
        return jsonify({'error': str(ce)}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# COMPLAINTS API ENDPOINTS (STUDENT ACCESSIBLE)
# ============================================================================

@app.route('/api/complaints', methods=['GET'])
@login_required
def get_complaints():
    """
    Fetch complaints for the authenticated student.
    Strictly filters by session['user_id'].
    Supports query parameters: category, status, priority, search.
    """
    user_id = session.get('user_id')
    category = request.args.get('category', '').strip()
    status = request.args.get('status', '').strip()
    priority = request.args.get('priority', '').strip()
    search = request.args.get('search', '').strip().lower()

    sql = """
        SELECT c.*, u.name AS student_name, u.email AS student_email
        FROM complaints c
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = %s
    """
    params = [user_id]

    if category:
        sql += " AND c.category = %s"
        params.append(category)

    if status:
        sql += " AND c.status = %s"
        params.append(status)

    if priority:
        sql += " AND c.priority = %s"
        params.append(priority)

    if search:
        sql += """ AND (
            LOWER(c.complaint_id) LIKE %s 
            OR LOWER(c.title) LIKE %s 
            OR LOWER(c.location) LIKE %s 
            OR LOWER(c.description) LIKE %s
        )"""
        search_pattern = f"%{search}%"
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

    sql += " ORDER BY c.id DESC"

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(sql, params)
            rows = cursor.fetchall()

        complaints = [format_complaint(r) for r in rows]
        return jsonify(complaints), 200
    except ConnectionError as ce:
        return jsonify({'error': str(ce)}), 500
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve complaints: {str(e)}'}), 500


@app.route('/api/complaints/<complaint_id>', methods=['GET'])
@login_required
def get_complaint_by_id(complaint_id):
    """
    Retrieve single complaint details.
    Enforces authorization:
      - Students can only view their own complaints.
      - Administrators can view any complaint.
    """
    user_id = session.get('user_id')
    role = session.get('role')

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT c.*, u.name AS student_name, u.email AS student_email
                FROM complaints c
                JOIN users u ON c.user_id = u.id
                WHERE c.complaint_id = %s
            """, (complaint_id,))
            row = cursor.fetchone()

        if not row:
            return jsonify({'error': f"Complaint with ID '{complaint_id}' was not found."}), 404

        # Enforce student boundary
        if role != 'admin' and row['user_id'] != user_id:
            return jsonify({'error': 'Forbidden: You are not authorized to view this complaint.'}), 403

        return jsonify(format_complaint(row)), 200
    except ConnectionError as ce:
        return jsonify({'error': str(ce)}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/complaints', methods=['POST'])
@login_required
def create_complaint():
    """
    Submit a new complaint.
    User ID is strictly derived from session['user_id'].
    Generates a unique complaint_id in format CMP-100X.
    """
    user_id = session.get('user_id')
    data = request.get_json(silent=True) or {}

    title = data.get('title', '').strip()
    category = data.get('category', '').strip()
    description = data.get('description', '').strip()
    department = data.get('department', '').strip() or 'General'
    location = data.get('location', '').strip() or 'Campus'
    priority = data.get('priority', 'Medium').strip()

    # Validation
    if not title or len(title) < 5:
        return jsonify({'error': 'Title is required and must be at least 5 characters.'}), 400
    if not category:
        return jsonify({'error': 'A valid complaint category is required.'}), 400
    if not description or len(description) < 15:
        return jsonify({'error': 'Description is required and must be at least 15 characters.'}), 400

    if priority not in ['Low', 'Medium', 'High', 'Urgent']:
        priority = 'Medium'

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            complaint_id = generate_next_complaint_id(cursor)
            cursor.execute("""
                INSERT INTO complaints (
                    complaint_id, user_id, title, category, department, location,
                    description, priority, status, admin_response, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Pending', '', NOW(), NOW())
            """, (
                complaint_id, user_id, title, category, department, location,
                description, priority
            ))

            # Retrieve newly inserted record with user details
            cursor.execute("""
                SELECT c.*, u.name AS student_name, u.email AS student_email
                FROM complaints c
                JOIN users u ON c.user_id = u.id
                WHERE c.complaint_id = %s
            """, (complaint_id,))
            new_record = cursor.fetchone()

        return jsonify(format_complaint(new_record)), 201
    except ConnectionError as ce:
        return jsonify({'error': str(ce)}), 500
    except Exception as e:
        return jsonify({'error': f'Failed to create complaint: {str(e)}'}), 500


@app.route('/api/stats/student', methods=['GET'])
@login_required
def get_student_stats():
    """
    Calculate and return KPI counts for the authenticated student.
    """
    user_id = session.get('user_id')
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    COUNT(*) AS total,
                    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
                    SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress,
                    SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved
                FROM complaints
                WHERE user_id = %s
            """, (user_id,))
            stats = cursor.fetchone()

        return jsonify({
            'total': stats['total'] or 0,
            'pending': stats['pending'] or 0,
            'inProgress': stats['in_progress'] or 0,
            'resolved': stats['resolved'] or 0
        }), 200
    except ConnectionError as ce:
        return jsonify({'error': str(ce)}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# ADMIN-ONLY API ENDPOINTS (role == 'admin' enforced)
# ============================================================================

@app.route('/api/admin/complaints', methods=['GET'])
@admin_required
def admin_get_all_complaints():
    """
    Retrieve all campus complaints across all students with filters.
    """
    category = request.args.get('category', '').strip()
    status = request.args.get('status', '').strip()
    priority = request.args.get('priority', '').strip()
    search = request.args.get('search', '').strip().lower()

    sql = """
        SELECT c.*, u.name AS student_name, u.email AS student_email
        FROM complaints c
        JOIN users u ON c.user_id = u.id
        WHERE 1=1
    """
    params = []

    if category:
        sql += " AND c.category = %s"
        params.append(category)

    if status:
        sql += " AND c.status = %s"
        params.append(status)

    if priority:
        sql += " AND c.priority = %s"
        params.append(priority)

    if search:
        sql += """ AND (
            LOWER(c.complaint_id) LIKE %s 
            OR LOWER(c.title) LIKE %s 
            OR LOWER(u.name) LIKE %s 
            OR LOWER(c.location) LIKE %s 
            OR LOWER(c.department) LIKE %s
        )"""
        p = f"%{search}%"
        params.extend([p, p, p, p, p])

    sql += " ORDER BY c.id DESC"

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(sql, params)
            rows = cursor.fetchall()

        complaints = [format_complaint(r) for r in rows]
        return jsonify(complaints), 200
    except ConnectionError as ce:
        return jsonify({'error': str(ce)}), 500
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve admin complaints: {str(e)}'}), 500


@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def admin_get_stats():
    """
    Campus-wide KPI metrics for administrators.
    """
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    COUNT(*) AS total,
                    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
                    SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress,
                    SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved,
                    SUM(CASE WHEN priority IN ('Urgent', 'High') THEN 1 ELSE 0 END) AS urgent
                FROM complaints
            """)
            stats = cursor.fetchone()

        return jsonify({
            'total': stats['total'] or 0,
            'pending': stats['pending'] or 0,
            'inProgress': stats['in_progress'] or 0,
            'resolved': stats['resolved'] or 0,
            'urgent': stats['urgent'] or 0
        }), 200
    except ConnectionError as ce:
        return jsonify({'error': str(ce)}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/complaints/<complaint_id>/status', methods=['PUT'])
@admin_required
def admin_update_complaint_status(complaint_id):
    """
    Specific, secured endpoint to update a complaint's lifecycle status and admin response.
    """
    data = request.get_json(silent=True) or {}
    new_status = data.get('status', '').strip()
    admin_response = data.get('admin_response', data.get('adminResponse', '')).strip()

    valid_statuses = ['Pending', 'In Progress', 'Resolved', 'Rejected']
    if new_status not in valid_statuses:
        return jsonify({'error': f"Invalid status '{new_status}'. Allowed: {valid_statuses}"}), 400

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM complaints WHERE complaint_id = %s", (complaint_id,))
            if not cursor.fetchone():
                return jsonify({'error': f"Complaint with ID '{complaint_id}' was not found."}), 404

            cursor.execute("""
                UPDATE complaints 
                SET status = %s, admin_response = %s, updated_at = NOW() 
                WHERE complaint_id = %s
            """, (new_status, admin_response, complaint_id))

            cursor.execute("""
                SELECT c.*, u.name AS student_name, u.email AS student_email
                FROM complaints c
                JOIN users u ON c.user_id = u.id
                WHERE c.complaint_id = %s
            """, (complaint_id,))
            updated_record = cursor.fetchone()

        return jsonify({
            'success': True,
            'message': f"Complaint {complaint_id} status updated to '{new_status}'.",
            'complaint': format_complaint(updated_record)
        }), 200
    except ConnectionError as ce:
        return jsonify({'error': str(ce)}), 500
    except Exception as e:
        return jsonify({'error': f'Failed to update complaint status: {str(e)}'}), 500


# ============================================================================
# HTML & STATIC ASSETS ROUTING (Server-side role guards)
# ============================================================================

@app.route('/')
def root():
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/<path:filename>')
def serve_static_or_page(filename):
    # Prevent path traversal
    safe_path = os.path.normpath(os.path.join(BASE_DIR, filename))
    if not safe_path.startswith(BASE_DIR):
        abort(403)

    base_file = os.path.basename(filename).lower()

    # Server-side route guards for HTML pages
    user_id = session.get('user_id')
    role = session.get('role')

    # 1. Admin page protection
    if base_file == 'admin.html':
        if not user_id:
            return redirect('/login.html')
        if role != 'admin':
            return redirect('/dashboard.html')

    # 2. Student protected pages
    if base_file in ['dashboard.html', 'submit.html', 'complaints.html', 'complaint-details.html']:
        if not user_id:
            return redirect('/login.html')

    # 3. Login page redirect if already authenticated
    if base_file == 'login.html' and user_id:
        if role == 'admin':
            return redirect('/admin.html')
        else:
            return redirect('/dashboard.html')

    # If file exists on disk, send it
    if os.path.isfile(safe_path):
        return send_from_directory(os.path.dirname(safe_path), os.path.basename(safe_path))

    abort(404)


# ============================================================================
# MAIN ENTRYPOINT
# ============================================================================

if __name__ == '__main__':
    print("=" * 60)
    print(" College Complaint Management System — Flask Backend")
    print(" Database: MySQL only (Strict Mode)")
    print("=" * 60)
    check_mysql_connection_on_startup()
    print(f"[*] Starting Flask server on http://localhost:{PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=True)
