/**
 * js/complaints.js
 * College Complaint Management System
 * Powers the student's My Complaints page: live search, multi-filter, and dynamic rendering
 * querying the Flask & MySQL backend.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await fetchCurrentUser();
  if (!user) return;

  populateCategoryFilter();
  setupFilterListeners();
  await loadAndRenderComplaints();
});

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

  let debounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadAndRenderComplaints, 250);
    });
  }

  if (categorySelect) categorySelect.addEventListener('change', loadAndRenderComplaints);
  if (statusSelect) statusSelect.addEventListener('change', loadAndRenderComplaints);
  if (prioritySelect) prioritySelect.addEventListener('change', loadAndRenderComplaints);

  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (searchInput) searchInput.value = '';
      if (categorySelect) categorySelect.value = '';
      if (statusSelect) statusSelect.value = '';
      if (prioritySelect) prioritySelect.value = '';
      await loadAndRenderComplaints();
    });
  }
}

/**
 * Filter and render complaints from the backend.
 */
async function loadAndRenderComplaints() {
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('filter-category');
  const statusSelect = document.getElementById('filter-status');
  const prioritySelect = document.getElementById('filter-priority');

  const filters = {
    search: searchInput ? searchInput.value.trim() : '',
    category: categorySelect ? categorySelect.value : '',
    status: statusSelect ? statusSelect.value : '',
    priority: prioritySelect ? prioritySelect.value : ''
  };

  const complaints = await getComplaints(filters);

  // Update counts
  const countElem = document.getElementById('complaint-count-badge');
  if (countElem) {
    countElem.innerText = `Showing ${complaints.length} tickets`;
  }

  // Render table rows
  const tableBody = document.getElementById('complaints-table-body');
  const emptyState = document.getElementById('empty-complaints-state');

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
