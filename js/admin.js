/**
 * js/admin.js
 * College Complaint Management System
 * Admin Control Panel: Campus-wide stats, advanced multi-filtering,
 * all-complaints management table, and status update modal.
 */

let allAdminComplaints = [];
let activeModalComplaintId = null;

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') return;

  const adminNameElem = document.getElementById('admin-greeting-name');
  if (adminNameElem) {
    adminNameElem.innerText = user.name || 'Administrator';
  }

  loadAdminData();
  populateCategoryFilter();
  setupFilterListeners();
  setupModalEvents();

  const resetBtn = document.getElementById('btn-reset-demo-data');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all data back to the original demo complaints? Any new complaints you filed will be reset.')) {
        resetComplaintsData();
        showToast('All complaints reset to initial demo seeds.', 'info');
        loadAdminData();
      }
    });
  }
});

/**
 * Load all complaints from localStorage and update stats & table.
 */
function loadAdminData() {
  allAdminComplaints = getComplaints();
  renderAdminStats();
  renderAdminTable();
}

/**
 * Compute and render campus-wide KPIs.
 */
function renderAdminStats() {
  const total = allAdminComplaints.length;
  const pending = allAdminComplaints.filter(c => c.status === 'Pending').length;
  const inProgress = allAdminComplaints.filter(c => c.status === 'In Progress').length;
  const resolved = allAdminComplaints.filter(c => c.status === 'Resolved').length;
  const urgent = allAdminComplaints.filter(c => c.priority === 'Urgent' || c.priority === 'High').length;

  setText('admin-stat-total', total);
  setText('admin-stat-pending', pending);
  setText('admin-stat-progress', inProgress);
  setText('admin-stat-resolved', resolved);
  setText('admin-stat-urgent', urgent);
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

  if (searchInput) searchInput.addEventListener('input', renderAdminTable);
  if (catSelect) catSelect.addEventListener('change', renderAdminTable);
  if (statusSelect) statusSelect.addEventListener('change', renderAdminTable);
  if (prioritySelect) prioritySelect.addEventListener('change', renderAdminTable);

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (catSelect) catSelect.value = '';
      if (statusSelect) statusSelect.value = '';
      if (prioritySelect) prioritySelect.value = '';
      renderAdminTable();
    });
  }
}

/**
 * Filter and render complaints in the admin table.
 */
function renderAdminTable() {
  const searchInput = document.getElementById('admin-search-input');
  const catSelect = document.getElementById('admin-filter-category');
  const statusSelect = document.getElementById('admin-filter-status');
  const prioritySelect = document.getElementById('admin-filter-priority');

  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const cat = catSelect ? catSelect.value : '';
  const status = statusSelect ? statusSelect.value : '';
  const priority = prioritySelect ? prioritySelect.value : '';

  const filtered = allAdminComplaints.filter(c => {
    const matchesQuery = !query ||
      c.id.toLowerCase().includes(query) ||
      c.title.toLowerCase().includes(query) ||
      c.studentName.toLowerCase().includes(query) ||
      (c.location && c.location.toLowerCase().includes(query)) ||
      (c.department && c.department.toLowerCase().includes(query));

    const matchesCat = !cat || c.category === cat;
    const matchesStatus = !status || c.status === status;
    const matchesPriority = !priority || c.priority === priority;

    return matchesQuery && matchesCat && matchesStatus && matchesPriority;
  });

  const countBadge = document.getElementById('admin-count-badge');
  if (countBadge) {
    countBadge.innerText = `Showing ${filtered.length} of ${allAdminComplaints.length} tickets`;
  }

  const tbody = document.getElementById('admin-table-body');
  const emptyState = document.getElementById('admin-empty-state');

  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  tbody.innerHTML = filtered.map(c => `
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

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!activeModalComplaintId) return;

      const statusSelect = document.getElementById('modal-status-select');
      const responseTextarea = document.getElementById('modal-response-textarea');

      const newStatus = statusSelect ? statusSelect.value : 'In Progress';
      const newResponse = responseTextarea ? responseTextarea.value.trim() : '';

      const updated = updateComplaint(activeModalComplaintId, {
        status: newStatus,
        adminResponse: newResponse
      });

      if (updated) {
        showToast(`Complaint ${activeModalComplaintId} updated to "${newStatus}"!`, 'success');
        closeModal();
        loadAdminData(); // Refresh table and KPIs
      } else {
        showToast('Failed to update complaint status.', 'error');
      }
    });
  }
}

/**
 * Open the status update modal for a specific complaint.
 * @param {string} complaintId
 */
window.openUpdateStatusModal = function(complaintId) {
  const complaint = getComplaintById(complaintId);
  if (!complaint) {
    showToast('Complaint not found.', 'error');
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
