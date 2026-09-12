/**
 * js/dashboard.js
 * College Complaint Management System
 * Powers the student dashboard metrics, KPI calculation, and recent complaints list
 * via asynchronous REST API calls to Flask & MySQL.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await fetchCurrentUser();
  if (!user) return;

  // Set personalized greeting
  const greetingElem = document.getElementById('student-greeting-name');
  if (greetingElem) {
    greetingElem.innerText = user.name || 'Student';
  }

  await loadStudentDashboardData();
});

/**
 * Fetch complaints and statistics for the authenticated student from backend.
 */
async function loadStudentDashboardData() {
  // Fetch stats directly from backend
  const stats = await getStudentStats();

  const totalElem = document.getElementById('stat-total');
  const pendingElem = document.getElementById('stat-pending');
  const inProgressElem = document.getElementById('stat-in-progress');
  const resolvedElem = document.getElementById('stat-resolved');

  if (totalElem) totalElem.innerText = stats.total;
  if (pendingElem) pendingElem.innerText = stats.pending;
  if (inProgressElem) inProgressElem.innerText = stats.inProgress;
  if (resolvedElem) resolvedElem.innerText = stats.resolved;

  // Fetch student complaints list
  const complaints = await getComplaints();

  // Render top 5 recent complaints
  renderRecentComplaints(complaints.slice(0, 5));
}

/**
 * Render the recent complaints table rows.
 * @param {Array<Object>} complaints
 */
function renderRecentComplaints(complaints) {
  const tableBody = document.getElementById('recent-complaints-body');
  const emptyState = document.getElementById('empty-recent-state');

  if (!tableBody) return;

  if (!complaints || complaints.length === 0) {
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
