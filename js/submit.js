/**
 * js/submit.js
 * College Complaint Management System
 * Validates and handles complaint submissions with inline error messages.
 */

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  const form = document.getElementById('complaint-form');
  const studentNameInput = document.getElementById('studentName');
  const studentEmailInput = document.getElementById('studentEmail');

  // Pre-fill user details if logged in
  if (user) {
    if (studentNameInput) studentNameInput.value = user.name || '';
    if (studentEmailInput) studentEmailInput.value = user.email || '';
  }

  if (form) {
    form.addEventListener('submit', handleComplaintSubmit);
  }
});

/**
 * Validates fields and saves complaint to localStorage.
 */
function handleComplaintSubmit(e) {
  e.preventDefault();

  // Clear previous errors
  clearValidationErrors();

  const titleInput = document.getElementById('title');
  const categoryInput = document.getElementById('category');
  const descriptionInput = document.getElementById('description');
  const departmentInput = document.getElementById('department');
  const locationInput = document.getElementById('location');
  const priorityInput = document.getElementById('priority');
  const studentNameInput = document.getElementById('studentName');
  const studentEmailInput = document.getElementById('studentEmail');

  const title = titleInput ? titleInput.value.trim() : '';
  const category = categoryInput ? categoryInput.value.trim() : '';
  const description = descriptionInput ? descriptionInput.value.trim() : '';
  const department = departmentInput ? departmentInput.value.trim() : '';
  const location = locationInput ? locationInput.value.trim() : '';
  const priority = priorityInput ? priorityInput.value.trim() : 'Medium';

  let hasErrors = false;

  // Validation: Title required (min 5 chars)
  if (!title) {
    setFieldError(titleInput, 'title-error', 'Please enter a clear complaint title.');
    hasErrors = true;
  } else if (title.length < 5) {
    setFieldError(titleInput, 'title-error', 'Title must be at least 5 characters long.');
    hasErrors = true;
  }

  // Validation: Category required
  if (!category) {
    setFieldError(categoryInput, 'category-error', 'Please select a valid complaint category.');
    hasErrors = true;
  }

  // Validation: Description required (min 15 chars)
  if (!description) {
    setFieldError(descriptionInput, 'description-error', 'Please describe the problem in detail.');
    hasErrors = true;
  } else if (description.length < 15) {
    setFieldError(descriptionInput, 'description-error', 'Description is too brief. Please provide at least 15 characters.');
    hasErrors = true;
  }

  if (hasErrors) {
    showToast('Please fix the highlighted errors before submitting.', 'error');
    return;
  }

  // Get student details
  const user = getCurrentUser() || {};
  const studentName = (studentNameInput && studentNameInput.value.trim()) || user.name || 'Student';
  const studentEmail = (studentEmailInput && studentEmailInput.value.trim()) || user.email || 'student@college.com';

  // Save new complaint
  const newComplaint = addComplaint({
    studentName,
    studentEmail,
    title,
    category,
    department,
    location,
    priority,
    description
  });

  // Success handling
  const successBox = document.getElementById('submit-success-banner');
  const newIdSpan = document.getElementById('new-complaint-id');
  const viewLink = document.getElementById('new-complaint-link');

  if (successBox && newIdSpan && viewLink) {
    newIdSpan.innerText = newComplaint.id;
    viewLink.href = `complaint-details.html?id=${encodeURIComponent(newComplaint.id)}`;
    successBox.style.display = 'block';
    form.reset();
    if (studentNameInput) studentNameInput.value = studentName;
    if (studentEmailInput) studentEmailInput.value = studentEmail;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    showToast(`Complaint ${newComplaint.id} submitted successfully!`, 'success');
    setTimeout(() => {
      window.location.href = `complaint-details.html?id=${encodeURIComponent(newComplaint.id)}`;
    }, 800);
  }
}

/**
 * Display inline validation error message and highlight border.
 */
function setFieldError(inputElem, errorElemId, message) {
  if (inputElem) {
    inputElem.classList.add('input-error');
  }
  const errorElem = document.getElementById(errorElemId);
  if (errorElem) {
    errorElem.innerText = message;
    errorElem.style.display = 'block';
  }
}

/**
 * Reset all inline error messages and border highlights.
 */
function clearValidationErrors() {
  const errorElements = document.querySelectorAll('.form-error');
  errorElements.forEach(el => {
    el.innerText = '';
    el.style.display = 'none';
  });

  const inputs = document.querySelectorAll('.input-error');
  inputs.forEach(input => {
    input.classList.remove('input-error');
  });
}
