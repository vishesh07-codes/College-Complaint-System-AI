/**
 * js/data.js
 * College Complaint Management System
 * Asynchronous Data Access Layer connecting directly to the Python Flask & MySQL Backend.
 * (Replaces client-side localStorage with secure REST API calls).
 */

// Standard complaint categories specified in the project requirements
const COMPLAINT_CATEGORIES = [
  'Academic',
  'Infrastructure',
  'Hostel',
  'Library',
  'Transport',
  'Canteen',
  'IT/Internet',
  'Administration',
  'Cleanliness',
  'Other'
];

// Status lifecycle definition
const COMPLAINT_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

// Priority levels
const COMPLAINT_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

/**
 * Fetch complaints belonging to the currently authenticated student.
 * Supports query parameters for category, status, priority, and search.
 * @param {Object} filters - { category, status, priority, search }
 * @returns {Promise<Array<Object>>}
 */
async function getComplaints(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.search) params.append('search', filters.search);

  const url = `/api/complaints${params.toString() ? '?' + params.toString() : ''}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (res.status === 401) {
      window.location.href = 'login.html';
      return [];
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Failed to fetch complaints:', err.error || res.statusText);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('Network error fetching complaints:', error);
    return [];
  }
}

/**
 * Fetch all campus complaints for Administrators.
 * @param {Object} filters - { category, status, priority, search }
 * @returns {Promise<Array<Object>>}
 */
async function getAdminComplaints(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.search) params.append('search', filters.search);

  const url = `/api/admin/complaints${params.toString() ? '?' + params.toString() : ''}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (res.status === 401) {
      window.location.href = 'login.html';
      return [];
    }
    if (res.status === 403) {
      alert('Access Denied: You must be an Administrator to view this page.');
      window.location.href = 'dashboard.html';
      return [];
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Failed to fetch admin complaints:', err.error || res.statusText);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('Network error fetching admin complaints:', error);
    return [];
  }
}

/**
 * Retrieve details for a single complaint by its public ID (e.g. "CMP-1001").
 * @param {string} complaintId
 * @returns {Promise<Object|null>}
 */
async function getComplaintById(complaintId) {
  if (!complaintId) return null;

  try {
    const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (res.status === 401) {
      window.location.href = 'login.html';
      return null;
    }
    if (res.status === 403) {
      alert('Forbidden: You are not authorized to view this ticket.');
      window.location.href = 'complaints.html';
      return null;
    }
    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(`Error loading complaint ${complaintId}:`, error);
    return null;
  }
}

/**
 * Submit a new complaint to MySQL via Flask backend.
 * @param {Object} data - Form data
 * @returns {Promise<Object>} Created complaint record
 */
async function addComplaint(data) {
  const payload = {
    title: data.title ? data.title.trim() : '',
    category: data.category,
    department: data.department || 'General',
    location: data.location ? data.location.trim() : 'Campus',
    priority: data.priority || 'Medium',
    description: data.description ? data.description.trim() : ''
  };

  const res = await fetch('/api/complaints', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to submit complaint.');
  }

  return await res.json();
}

/**
 * Update complaint status and official remarks (Admin Only).
 * @param {string} complaintId
 * @param {Object} updateData - { status, admin_response }
 * @returns {Promise<Object>}
 */
async function updateComplaintStatus(complaintId, updateData) {
  const payload = {
    status: updateData.status,
    admin_response: updateData.admin_response !== undefined ? updateData.admin_response : (updateData.adminResponse || '')
  };

  const res = await fetch(`/api/admin/complaints/${encodeURIComponent(complaintId)}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update complaint status.');
  }

  return await res.json();
}

/**
 * Retrieve KPI counters for authenticated student.
 * @returns {Promise<Object>} { total, pending, inProgress, resolved }
 */
async function getStudentStats() {
  try {
    const res = await fetch('/api/stats/student', {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Failed to load student stats', e);
  }
  return { total: 0, pending: 0, inProgress: 0, resolved: 0 };
}

/**
 * Retrieve campus-wide KPI counters for administrator.
 * @returns {Promise<Object>} { total, pending, inProgress, resolved, urgent }
 */
async function getAdminStats() {
  try {
    const res = await fetch('/api/admin/stats', {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Failed to load admin stats', e);
  }
  return { total: 0, pending: 0, inProgress: 0, resolved: 0, urgent: 0 };
}
