#!/usr/bin/env python3
"""
seed.py
Database initialization and development seeding script for College Complaint Management System.
Connects strictly to MySQL, executes schema.sql, and seeds development users with Werkzeug-hashed passwords.
"""

import os
import sys
import pymysql
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

# Load environment variables
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "college_complaints")


def get_server_connection():
    """Connect to MySQL server without selecting database."""
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
        )
        return conn
    except Exception as e:
        print(
            f"\n[FATAL ERROR] Failed to connect to MySQL server at {DB_HOST}:{DB_PORT}."
        )
        print(f"Error details: {e}")
        print("\nPlease ensure that:")
        print(" 1. MySQL Server is installed and actively running.")
        print(
            " 2. The credentials in .env (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD) are correct.\n"
        )
        sys.exit(1)


def get_db_connection():
    """Connect directly to the specific application database."""
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
        )
        return conn
    except Exception as e:
        print(
            f"\n[FATAL ERROR] Failed to connect to database '{DB_NAME}' on MySQL server."
        )
        print(f"Error details: {e}")
        sys.exit(1)


def init_database():
    """Execute schema.sql to create database and tables."""
    print(f"[*] Connecting to MySQL server at {DB_HOST}:{DB_PORT}...")
    conn = get_server_connection()
    cursor = conn.cursor()

    schema_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")
    if not os.path.exists(schema_file):
        print(f"[ERROR] schema.sql not found at {schema_file}")
        sys.exit(1)

    print(f"[*] Executing {schema_file}...")
    with open(schema_file, "r", encoding="utf-8") as f:
        sql_commands = f.read()

    # Split by statements
    for statement in sql_commands.split(";"):
        stmt = statement.strip()
        if stmt:
            cursor.execute(stmt)

    conn.commit()
    cursor.close()
    conn.close()
    print(f"[OK] Database '{DB_NAME}' and tables created successfully.")


def seed_data():
    """Insert development seed users and complaints."""
    conn = get_db_connection()
    cursor = conn.cursor()

    print("[*] Seeding development users with Werkzeug password hashing...")
    demo_users = [
        {
            "name": "Vishesh Singhal",
            "email": "student@college.com",
            "password": generate_password_hash("12345"),
            "role": "student",
        },
        {
            "name": "Dr. H.G. Garg (Dean)",
            "email": "admin@college.com",
            "password": generate_password_hash("admin123"),
            "role": "admin",
        },
        {
            "name": "Priya Patel",
            "email": "priya.patel@college.com",
            "password": generate_password_hash("student123"),
            "role": "student",
        },
        {
            "name": "Rohan Verma",
            "email": "rohan.verma@college.com",
            "password": generate_password_hash("student123"),
            "role": "student",
        },
        {
            "name": "Ananya Gupta",
            "email": "ananya.gupta@college.com",
            "password": generate_password_hash("student123"),
            "role": "student",
        },
    ]

    user_id_map = {}
    for u in demo_users:
        cursor.execute("SELECT id FROM users WHERE email = %s", (u["email"],))
        existing = cursor.fetchone()
        if existing:
            user_id_map[u["email"]] = existing["id"]
            # Yeh line add karein taaki existing user ka naam update ho sake:
            cursor.execute(
                "UPDATE users SET name = %s WHERE email = %s", (u["name"], u["email"])
            )
            print(f"  * Updated user: {u['email']} -> {u['name']}")
        else:
            cursor.execute(
                "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
                (u["name"], u["email"], u["password"], u["role"]),
            )
            user_id_map[u["email"]] = cursor.lastrowid
            print(f"  + Created user: {u['email']} (role: {u['role']})")

    conn.commit()

    print("[*] Seeding sample complaints (normalized, using user_id)...")
    seed_complaints = [
        {
            "complaint_id": "CMP-1001",
            "user_email": "student@college.com",
            "title": "Wi-Fi connection drops in Hostel Block B",
            "category": "IT/Internet",
            "department": "Computer Science",
            "location": "Hostel Block B, 3rd Floor Rooms 301-310",
            "priority": "High",
            "status": "Pending",
            "description": "The Wi-Fi access point on the third floor of Hostel Block B disconnects every 10 minutes. Students are unable to access online study materials and submission portals.",
            "admin_response": "",
            "created_at": "2026-08-30 10:30:00",
            "updated_at": "2026-08-30 10:30:00",
        },
        {
            "complaint_id": "CMP-1002",
            "user_email": "priya.patel@college.com",
            "title": "Ceiling Projector Lamp Blown in Lecture Hall 304",
            "category": "Academic",
            "department": "Mechanical Engineering",
            "location": "Main Academic Block, Room 304",
            "priority": "Medium",
            "status": "In Progress",
            "description": "The multimedia projector in Hall 304 has a burnt out bulb. Morning lectures for semester 5 students are facing disruptions due to lack of presentation slides.",
            "admin_response": "Work order #ENG-489 assigned to audio-visual maintenance team. Bulb replacement scheduled for today afternoon.",
            "created_at": "2026-08-29 14:15:00",
            "updated_at": "2026-08-31 09:45:00",
        },
        {
            "complaint_id": "CMP-1003",
            "user_email": "student@college.com",
            "title": "Drinking water dispenser leakage in Main Canteen",
            "category": "Canteen",
            "department": "Civil Engineering",
            "location": "Campus Canteen Ground Floor near Counter 2",
            "priority": "Low",
            "status": "Resolved",
            "description": "The RO drinking water dispenser tap is loose and leaking drinking water constantly across the floor, making the tile floor slippery and wasting purified water.",
            "admin_response": "Plumber visited on Aug 30 and installed a brand-new valve faucet. Drain line inspected and cleared.",
            "created_at": "2026-08-28 09:00:00",
            "updated_at": "2026-08-30 16:00:00",
        },
        {
            "complaint_id": "CMP-1004",
            "user_email": "ananya.gupta@college.com",
            "title": "Central Library Reference Hall AC not cooling",
            "category": "Library",
            "department": "Electronics Engineering",
            "location": "Central Library, 1st Floor Quiet Study Zone",
            "priority": "High",
            "status": "In Progress",
            "description": "Central air-conditioning unit 2 in the quiet study section is blowing warm air. High humidity and heat make it impossible to sit and study for competitive exams.",
            "admin_response": "HVAC technician inspected the compressor. Refrigerant gas refill ordered from vendor. Will be functional within 24 hours.",
            "created_at": "2026-08-31 11:20:00",
            "updated_at": "2026-09-01 12:10:00",
        },
        {
            "complaint_id": "CMP-1005",
            "user_email": "student@college.com",
            "title": "College Bus Route 12 arriving 45 mins late repeatedly",
            "category": "Transport",
            "department": "Information Technology",
            "location": "North City Route (Stops: Metro Gate 4, Green Park)",
            "priority": "Medium",
            "status": "Pending",
            "description": "Bus #12 driver consistently starts late from the depot, resulting in 40+ students reaching morning 9:00 AM labs late and receiving absence marks.",
            "admin_response": "",
            "created_at": "2026-09-01 18:40:00",
            "updated_at": "2026-09-01 18:40:00",
        },
    ]

    for c in seed_complaints:
        cursor.execute(
            "SELECT id FROM complaints WHERE complaint_id = %s", (c["complaint_id"],)
        )
        if not cursor.fetchone():
            user_id = user_id_map.get(c["user_email"])
            cursor.execute(
                """
                INSERT INTO complaints (
                    complaint_id, user_id, title, category, department, location,
                    description, priority, status, admin_response, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
                (
                    c["complaint_id"],
                    user_id,
                    c["title"],
                    c["category"],
                    c["department"],
                    c["location"],
                    c["description"],
                    c["priority"],
                    c["status"],
                    c["admin_response"],
                    c["created_at"],
                    c["updated_at"],
                ),
            )
            print(
                f"  + Seeded complaint: {c['complaint_id']} - {c['title']} (user_id: {user_id})"
            )

    conn.commit()
    cursor.close()
    conn.close()
    print("[SUCCESS] Database seeding completed successfully!\n")


if __name__ == "__main__":
    init_database()
    seed_data()
