-- ==========================================================
-- College Complaint Management System — MySQL Schema
-- Normalized database design with strict foreign keys
-- ==========================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS college_complaints;
USE college_complaints;

-- 1. Users Table (Stores authentication & profile credentials)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Complaints Table (Normalized: references users.id without redundant student_name/student_email)
-- Normal foreign key without ON DELETE CASCADE to preserve complaint history
CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id VARCHAR(20) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    location VARCHAR(200),
    description TEXT NOT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
    status ENUM('Pending', 'In Progress', 'Resolved', 'Rejected') NOT NULL DEFAULT 'Pending',
    admin_response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
