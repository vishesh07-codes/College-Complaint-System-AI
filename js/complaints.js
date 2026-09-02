/**
 * js/complaints.js
 * College Complaint Management System
 * Powers the student's My Complaints page: search, multi-filter, and dynamic rendering.
 */

let studentComplaints = [];

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (!user) return;

  loadStudentComplaints();
  populateCategoryFilter();
  setupFilterListeners();
  renderComplaintsTable();
});

/**
 * Fetch complaints belonging to current student.
 */
function loadStudentComplaints() {
  const user = getCurrentUser();
  const all = getComplaints();
  studentComplaints = all.filter(c => c.studentEmail.toLowerCase() === user.email.toLowerCase());
}

/**
 * Dynamically populate category dropdown options.
 */
function populateCategoryFilter() {
  const select = document.getElementById('filter-category');
  if (!select) return;

  COMPLAINT_CATEGORIES.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

/**
 * Attach listeners to search and filter inputs.
 */
function setupFilterListeners() {
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('filter-category');
  const statusSelect = document.getElementById('filter-status');
  const prioritySelect = document.getElementById('filter-priority');
  const resetBtn = document.getElementById('btn-reset-filters');

  if (searchInput) searchInput.addEventListener('input', renderComplaintsTable);
  if (categorySelect) categorySelect.addEventListener('change', renderComplaintsTable);
  if (statusSelect) statusSelect.addEventListener('change', renderComplaintsTable);
  if (prioritySelect) prioritySelect.addEventListener('change', renderComplaintsTable);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (categorySelect) categorySelect.value = '';
      if (statusSelect) statusSelect.value = '';
      if (prioritySelect) prioritySelect.value = '';
      renderComplaintsTable();
    });
  }
}

/**
 * Filter and render the complaints based on active filter settings.
 */
function renderComplaintsTable() {
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('filter-category');
  const statusSelect = document.getElementById('filter-status');
  const prioritySelect = document.getElementById('filter-priority');

  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const selectedCat = categorySelect ? categorySelect.value : '';
  const selectedStatus = statusSelect ? statusSelect.value : '';
  const selectedPriority = prioritySelect ? prioritySelect.value : '';

  // Filter complaints
  const filtered = studentComplaints.filter(c => {
    // Search query matches ID, Title, Location or Description
    const matchesQuery = !query || 
      c.id.toLowerCase().includes(query) ||
      c.title.toLowerCase().includes(query) ||
      (c.location && c.location.toLowerCase().includes(query)) ||
      c.description.toLowerCase().includes(query);

    // Category filter
    const matchesCat = !selectedCat || c.category === selectedCat;

    // Status filter
    const matchesStatus = !selectedStatus || c.status === selectedStatus;

    // Priority filter
    const matchesPriority = !selectedPriority || c.priority === selectedPriority;

    return matchesQuery && matchesCat && matchesStatus && matchesPriority;
  });

  // Update counts
  const countElem = document.getElementById('complaint-count-badge');
  if (countElem) {
    countElem.innerText = `Showing ${filtered.length} of ${studentComplaints.length}`;
  }

  // Render table rows
  const tableBody = document.getElementById('complaints-table-body');
  const emptyState = document.getElementById('empty-complaints-state');

  if (!tableBody) return;

  if (filtered.length === 0) {
    tableBody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  tableBody.innerHTML = filtered.map(c => `
    <tr>
      <td><span class="table-code">${escapeHtml(c.id)}</span></td>
      <td>
        <strong style="color: var(--primary-900);">${escapeHtml(c.title)}</strong>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
          📍 ${escapeHtml(c.location || 'Campus')}
        </div>
      </td>
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
