/**
 * js/main.js
 * College Complaint Management System
 * Global session authentication checks, server-side auth verification,
 * navigation, toast alerts, and UI helper utilities.
 */

// In-memory active user session cached from /api/auth/me
let activeUser = null;

/**
 * Fetch authenticated user from backend session.
 * @returns {Promise<Object|null>} { id, email, name, role }
 */
async function fetchCurrentUser() {
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      activeUser = data.user;
      return activeUser;
    }
  } catch (err) {
    console.error('Error verifying user session:', err);
  }
  activeUser = null;
  return null;
}

/**
 * Synchronously get in-memory cached user (if already fetched).
 * @returns {Object|null}
 */
function getCurrentUser() {
  return activeUser;
}

/**
 * Log out active user from Flask session and redirect to login page.
 */
async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    console.error('Logout error:', e);
  }
  activeUser = null;
  window.location.href = 'login.html';
}

/**
 * Enforce role protection on sensitive pages via Flask backend session.
 */
async function enforceAuthGuard() {
  const path = (window.location.pathname || '').replace(/\\/g, '/');
  const page = path.substring(path.lastIndexOf('/') + 1).toLowerCase() || 'index.html';

  const user = await fetchCurrentUser();

  const protectedStudentPages = ['dashboard.html', 'submit.html', 'complaints.html', 'complaint-details.html'];
  const adminPages = ['admin.html'];

  if (adminPages.includes(page)) {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    if (user.role !== 'admin') {
      alert('Access Denied: You must be an Administrator to view this page.');
      window.location.href = 'dashboard.html';
      return;
    }
  } else if (protectedStudentPages.includes(page)) {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
  } else if (page === 'login.html') {
    if (user) {
      if (user.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    }
  }

  // Once auth is verified, update the navbar UI
  setupNavbar();
}

/**
 * Setup mobile navbar toggle, user badge, and active links.
 */
function setupNavbar() {
  const user = getCurrentUser();
  const userBadgeElem = document.getElementById('nav-user-info');
  const logoutBtn = document.getElementById('nav-logout-btn');
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  const path = (window.location.pathname || '').replace(/\\/g, '/');
  const currentPage = path.substring(path.lastIndexOf('/') + 1).toLowerCase() || 'index.html';

  // Mobile menu toggle
  if (menuToggle && navLinks) {
    menuToggle.onclick = () => {
      navLinks.classList.toggle('nav-open');
    };
  }

  // Display user information in navbar if container exists
  if (userBadgeElem) {
    if (user) {
      userBadgeElem.innerHTML = `
        <span class="user-greeting">Hi, <strong>${escapeHtml(user.name)}</strong></span>
        <span class="badge ${user.role === 'admin' ? 'badge-admin' : 'badge-student'}">${user.role.toUpperCase()}</span>
      `;
    } else {
      userBadgeElem.innerHTML = '';
    }
  }

  // Show admin shortcut in navigation for admin users
  if (user && user.role === 'admin' && navLinks) {
    const hasAdminLink = Array.from(navLinks.querySelectorAll('a')).some(a => (a.getAttribute('href') || '').includes('admin.html'));
    if (!hasAdminLink) {
      const adminA = document.createElement('a');
      adminA.href = 'admin.html';
      adminA.className = 'nav-link' + (currentPage === 'admin.html' ? ' active' : '');
      adminA.textContent = 'Admin Portal';
      navLinks.prepend(adminA);
    }
  }

  // Attach logout handler
  if (logoutBtn) {
    if (user) {
      logoutBtn.style.display = 'inline-flex';
      logoutBtn.onclick = (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to log out?')) {
          logout();
        }
      };
    } else {
      logoutBtn.style.display = 'none';
    }
  }

  // Highlight active link
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (href === currentPage) {
      link.classList.add('active');
    }
  });
}

/**
 * Return styled HTML badge for complaint status.
 * Pending = orange, In Progress = blue, Resolved = green, Rejected = red.
 * @param {string} status
 * @returns {string} HTML markup
 */
function getStatusBadgeHTML(status) {
  const s = (status || 'Pending').trim();
  let badgeClass = 'badge-pending';
  let icon = '⏳';

  if (s === 'In Progress') {
    badgeClass = 'badge-in-progress';
    icon = '🔄';
  } else if (s === 'Resolved') {
    badgeClass = 'badge-resolved';
    icon = '✅';
  } else if (s === 'Rejected') {
    badgeClass = 'badge-rejected';
    icon = '❌';
  }

  return `<span class="badge ${badgeClass}">${icon} ${escapeHtml(s)}</span>`;
}

/**
 * Return styled HTML badge for complaint priority.
 * @param {string} priority
 * @returns {string} HTML markup
 */
function getPriorityBadgeHTML(priority) {
  const p = (priority || 'Medium').trim();
  let badgeClass = 'priority-medium';

  if (p === 'Urgent') {
    badgeClass = 'priority-urgent';
  } else if (p === 'High') {
    badgeClass = 'priority-high';
  } else if (p === 'Low') {
    badgeClass = 'priority-low';
  }

  return `<span class="priority-badge ${badgeClass}">${escapeHtml(p)}</span>`;
}

/**
 * Helper to escape HTML characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format ISO date string into readable user format.
 * @param {string} isoString
 * @returns {string} e.g. "Aug 31, 2026, 02:15 PM"
 */
function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
}

/**
 * Display a temporary floating toast alert.
 * @param {string} message
 * @param {string} type 'success' | 'error' | 'info'
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fade');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Execute auth check and setup on page load
document.addEventListener('DOMContentLoaded', () => {
  enforceAuthGuard();
});
