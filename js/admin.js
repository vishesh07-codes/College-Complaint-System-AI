/**
 * js/admin.js
 * College Complaint Management System
 * Admin Control Panel: Campus-wide stats, advanced multi-filtering,
 * all-complaints management table, and status update modal via Flask & MySQL backend.
 */

let allAdminComplaints = [];
let activeModalComplaintId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await fetchCurrentUser();
  if (!user || user.role !== 'admin') return;

  const adminNameElem = document.getElementById('admin-greeting-name');
  if (adminNameElem) {
    adminNameElem.innerText = user.name || 'Administrator';
  }

  populateCategoryFilter();
  setupFilterListeners();
  setupModalEvents();
  await loadAdminData();
});

/**
 * Load all complaints and stats from Flask API and update dashboard.
 */
async function loadAdminData() {
  await renderAdminStats();
  await renderAdminTable();
}

/**
 * Fetch and render campus-wide KPIs.
 */
async function renderAdminStats() {
  const stats = await getAdminStats();

  setText('admin-stat-total', stats.total);
  setText('admin-stat-pending', stats.pending);
  setText('admin-stat-progress', stats.inProgress);
  setText('admin-stat-resolved', stats.resolved);
  setText('admin-stat-urgent', stats.urgent);
}

/**
 * Populate category filter dropdown dynamically.
 */
function populateCategoryFilter() {
  const select = document.getElementById('admin-filter-category');
  if (!select) return;

  // Clear existing except the first option
  select.innerHTML = '<option value="">All Categories</option>';

  COMPLAINT_CATEGORIES.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

/**
 * Setup listeners for search input and dropdown filters.
 */
function setupFilterListeners() {
  const searchInput = document.getElementById('admin-search-input');
  const catSelect = document.getElementById('admin-filter-category');
  const statusSelect = document.getElementById('admin-filter-status');
  const prioritySelect = document.getElementById('admin-filter-priority');
  const clearBtn = document.getElementById('btn-admin-clear-filters');

  let debounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(renderAdminTable, 250);
    });
  }

  if (catSelect) catSelect.addEventListener('change', renderAdminTable);
  if (statusSelect) statusSelect.addEventListener('change', renderAdminTable);
  if (prioritySelect) prioritySelect.addEventListener('change', renderAdminTable);

  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (searchInput) searchInput.value = '';
      if (catSelect) catSelect.value = '';
      if (statusSelect) statusSelect.value = '';
      if (prioritySelect) prioritySelect.value = '';
      await renderAdminTable();
    });
  }
}

/**
 * Filter and render complaints in the admin table.
 */
async function renderAdminTable() {
  const searchInput = document.getElementById('admin-search-input');
  const catSelect = document.getElementById('admin-filter-category');
  const statusSelect = document.getElementById('admin-filter-status');
  const prioritySelect = document.getElementById('admin-filter-priority');

  const filters = {
    search: searchInput ? searchInput.value.trim() : '',
    category: catSelect ? catSelect.value : '',
    status: statusSelect ? statusSelect.value : '',
    priority: prioritySelect ? prioritySelect.value : ''
  };

  allAdminComplaints = await getAdminComplaints(filters);

  const countBadge = document.getElementById('admin-count-badge');
  if (countBadge) {
    countBadge.innerText = `Showing ${allAdminComplaints.length} tickets`;
  }

  const tbody = document.getElementById('admin-table-body');
  const emptyState = document.getElementById('admin-empty-state');

  if (!tbody) return;

  if (allAdminComplaints.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  tbody.innerHTML = allAdminComplaints.map(c => `
    <tr>
      <td><span class="table-code">${escapeHtml(c.id)}</span></td>
      <td>
        <strong>${escapeHtml(c.studentName)}</strong>
        <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(c.department || 'General')}</div>
      </td>
      <td>
        <strong style="color: var(--primary-900);">${escapeHtml(c.title)}</strong>
        <div style="font-size: 0.78rem; color: var(--text-muted);">📍 ${escapeHtml(c.location || 'Campus')}</div>
      </td>
      <td>${escapeHtml(c.category)}</td>
      <td>${getPriorityBadgeHTML(c.priority)}</td>
      <td>${getStatusBadgeHTML(c.status)}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button class="btn btn-sm btn-primary" onclick="openUpdateStatusModal('${escapeHtml(c.id)}')">
            Update
          </button>
          <a href="complaint-details.html?id=${encodeURIComponent(c.id)}" class="btn btn-sm btn-outline">
            Details
          </a>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * Status Update Modal setup and controls.
 */
function setupModalEvents() {
  const backdrop = document.getElementById('status-modal-backdrop');
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  const saveBtn = document.getElementById('modal-save-btn');

  const closeModal = () => {
    if (backdrop) backdrop.classList.remove('active');
    activeModalComplaintId = null;
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  if (backdrop) {
    backdrop.onclick = (e) => {
      if (e.target === backdrop) closeModal();
    };
  }

  if (saveBtn) {
    saveBtn.onclick = async () => {
      if (!activeModalComplaintId) return;

      const statusSelect = document.getElementById('modal-status-select');
      const responseTextarea = document.getElementById('modal-response-textarea');

      const newStatus = statusSelect ? statusSelect.value : 'In Progress';
      const newResponse = responseTextarea ? responseTextarea.value.trim() : '';

      saveBtn.disabled = true;
      saveBtn.innerText = 'Saving...';

      try {
        await updateComplaintStatus(activeModalComplaintId, {
          status: newStatus,
          admin_response: newResponse
        });

        showToast(`Complaint ${activeModalComplaintId} updated to "${newStatus}"!`, 'success');
        closeModal();
        await loadAdminData(); // Refresh table and KPIs
      } catch (err) {
        console.error('Update error:', err);
        showToast(err.message || 'Failed to update complaint status.', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = 'Save Changes →';
      }
    };
  }
}

/**
 * Open the status update modal for a specific complaint.
 * @param {string} complaintId
 */
window.openUpdateStatusModal = function(complaintId) {
  const complaint = allAdminComplaints.find(c => c.id === complaintId);
  if (!complaint) {
    showToast('Complaint record not found.', 'error');
    return;
  }

  activeModalComplaintId = complaint.id;

  setText('modal-complaint-id', complaint.id);
  setText('modal-complaint-title', complaint.title);

  const statusSelect = document.getElementById('modal-status-select');
  const responseTextarea = document.getElementById('modal-response-textarea');

  if (statusSelect) statusSelect.value = complaint.status;
  if (responseTextarea) responseTextarea.value = complaint.adminResponse || '';

  const backdrop = document.getElementById('status-modal-backdrop');
  if (backdrop) backdrop.classList.add('active');
};

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}
