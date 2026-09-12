/**
 * js/complaint-details.js
 * College Complaint Management System
 * Fetches and displays individual complaint details and lifecycle progression timeline.
 * (Admin status updates are exclusively handled by admin.js via PUT /api/admin/complaints/<id>/status).
 */

let currentComplaintId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentComplaintId = urlParams.get('id');

  if (!currentComplaintId) {
    showErrorState('No complaint ID was provided in the URL.');
    return;
  }

  await loadComplaintDetails();
});

/**
 * Load complaint from Flask backend and populate details.
 */
async function loadComplaintDetails() {
  const complaint = await getComplaintById(currentComplaintId);

  if (!complaint) {
    showErrorState(`Complaint with ID "${escapeHtml(currentComplaintId)}" was not found or you are not authorized to view it.`);
    return;
  }

  // Populate Header & Badges
  setText('detail-id', complaint.id);
  setText('detail-title', complaint.title);
  setHTML('detail-status-badge', getStatusBadgeHTML(complaint.status));
  setHTML('detail-priority-badge', getPriorityBadgeHTML(complaint.priority));

  // Populate Metadata
  setText('detail-student-name', complaint.studentName);
  setText('detail-student-email', complaint.studentEmail);
  setText('detail-department', complaint.department || 'General');
  setText('detail-category', complaint.category);
  setText('detail-location', complaint.location || 'Campus');
  setText('detail-created-at', formatDate(complaint.createdAt));
  setText('detail-updated-at', formatDate(complaint.updatedAt));

  // Populate Description
  setText('detail-description', complaint.description);

  // Populate Admin Response
  const responseBox = document.getElementById('admin-response-content');
  const responseEmpty = document.getElementById('admin-response-empty');
  if (complaint.adminResponse && complaint.adminResponse.trim().length > 0) {
    if (responseBox) {
      responseBox.innerText = complaint.adminResponse;
      responseBox.style.display = 'block';
    }
    if (responseEmpty) responseEmpty.style.display = 'none';
  } else {
    if (responseBox) responseBox.style.display = 'none';
    if (responseEmpty) responseEmpty.style.display = 'block';
  }

  // Render Status Lifecycle Timeline
  renderTimeline(complaint);
}

/**
 * Visual step timeline showing lifecycle progression.
 */
function renderTimeline(complaint) {
  const timelineContainer = document.getElementById('status-timeline');
  if (!timelineContainer) return;

  const status = complaint.status;

  let step2Class = '';
  let step3Class = '';
  let step3Title = 'Resolution';
  let step3Desc = 'Final review and grievance closure.';

  if (status === 'Pending') {
    step2Class = 'active';
    step3Class = '';
  } else if (status === 'In Progress') {
    step2Class = 'completed';
    step3Class = 'active';
  } else if (status === 'Resolved') {
    step2Class = 'completed';
    step3Class = 'resolved';
    step3Title = 'Grievance Resolved';
    step3Desc = 'Action taken and issue successfully resolved.';
  } else if (status === 'Rejected') {
    step2Class = 'completed';
    step3Class = 'rejected';
    step3Title = 'Complaint Closed / Rejected';
    step3Desc = 'Complaint reviewed and rejected by administration.';
  }

  timelineContainer.innerHTML = `
    <div class="timeline-step completed">
      <div class="timeline-dot"></div>
      <div class="timeline-title">Grievance Submitted</div>
      <div class="timeline-date">${formatDate(complaint.createdAt)}</div>
      <div class="timeline-desc">Ticket logged by student and queued for review.</div>
    </div>

    <div class="timeline-step ${step2Class}">
      <div class="timeline-dot"></div>
      <div class="timeline-title">Under Review &amp; Investigation</div>
      <div class="timeline-date">${status !== 'Pending' ? formatDate(complaint.updatedAt) : 'Pending assignment'}</div>
      <div class="timeline-desc">Assigned to department authority for on-site inspection or action.</div>
    </div>

    <div class="timeline-step ${step3Class}">
      <div class="timeline-dot"></div>
      <div class="timeline-title">${step3Title}</div>
      <div class="timeline-date">${status === 'Resolved' || status === 'Rejected' ? formatDate(complaint.updatedAt) : 'Awaiting completion'}</div>
      <div class="timeline-desc">${step3Desc}</div>
    </div>
  `;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text || '—';
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html || '';
}

function showErrorState(msg) {
  const main = document.getElementById('complaint-details-container');
  const errorBox = document.getElementById('complaint-not-found');
  const errorMsg = document.getElementById('not-found-message');

  if (main) main.style.display = 'none';
  if (errorBox) {
    errorBox.style.display = 'block';
    if (errorMsg) errorMsg.innerText = msg;
  }
}
