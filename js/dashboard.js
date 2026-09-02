/**
 * js/dashboard.js
 * College Complaint Management System
 * Powers the student dashboard metrics, KPI calculation, and recent complaints list.
 */

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (!user) return;

  // Set personalized greeting
  const greetingElem = document.getElementById('student-greeting-name');
  if (greetingElem) {
    greetingElem.innerText = user.name || 'Student';
  }

  loadStudentDashboardData();
});

/**
 * Filter complaints relevant to the logged-in student,
 * compute stats, and render recent items.
 */
function loadStudentDashboardData() {
  const user = getCurrentUser();
  const allComplaints = getComplaints();

  // Filter complaints submitted by this student's email
  // If email matches or for demo purposes if student@college.com matches
  const studentComplaints = allComplaints.filter(c => {
    return c.studentEmail.toLowerCase() === user.email.toLowerCase();
  });

  // Calculate statistics
  const total = studentComplaints.length;
  const pending = studentComplaints.filter(c => c.status === 'Pending').length;
  const inProgress = studentComplaints.filter(c => c.status === 'In Progress').length;
  const resolved = studentComplaints.filter(c => c.status === 'Resolved').length;

  // Update KPI counters
  const totalElem = document.getElementById('stat-total');
  const pendingElem = document.getElementById('stat-pending');
  const inProgressElem = document.getElementById('stat-in-progress');
  const resolvedElem = document.getElementById('stat-resolved');

  if (totalElem) totalElem.innerText = total;
  if (pendingElem) pendingElem.innerText = pending;
  if (inProgressElem) inProgressElem.innerText = inProgress;
  if (resolvedElem) resolvedElem.innerText = resolved;

  // Render recent complaints table (top 5)
  renderRecentComplaints(studentComplaints.slice(0, 5));
}

/**
 * Render the recent complaints table rows.
 * @param {Array<Object>} complaints
 */
function renderRecentComplaints(complaints) {
  const tableBody = document.getElementById('recent-complaints-body');
  const emptyState = document.getElementById('empty-recent-state');

  if (!tableBody) return;

  if (complaints.length === 0) {
    tableBody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  tableBody.innerHTML = complaints.map(c => `
    <tr>
      <td><span class="table-code">${escapeHtml(c.id)}</span></td>
      <td><strong>${escapeHtml(c.title)}</strong></td>
      <td>${escapeHtml(c.category)}</td>
      <td>${getPriorityBadgeHTML(c.priority)}</td>
      <td>${getStatusBadgeHTML(c.status)}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td>
        <a href="complaint-details.html?id=${encodeURIComponent(c.id)}" class="btn btn-sm btn-outline">
          View &rarr;
        </a>
      </td>
    </tr>
  `).join('');
}
