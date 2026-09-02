/**
 * js/login.js
 * College Complaint Management System
 * Handles authentication, form validation, quick demo credential buttons,
 * and role-based redirects.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorAlert = document.getElementById('login-error');
  const btnDemoStudent = document.getElementById('btn-demo-student');
  const btnDemoAdmin = document.getElementById('btn-demo-admin');

  // Quick-fill buttons for instant demo login
  if (btnDemoStudent) {
    btnDemoStudent.addEventListener('click', () => {
      emailInput.value = DEMO_ACCOUNTS.student.email;
      passwordInput.value = DEMO_ACCOUNTS.student.password;
      clearError();
      performLogin(DEMO_ACCOUNTS.student.email, DEMO_ACCOUNTS.student.password);
    });
  }

  if (btnDemoAdmin) {
    btnDemoAdmin.addEventListener('click', () => {
      emailInput.value = DEMO_ACCOUNTS.admin.email;
      passwordInput.value = DEMO_ACCOUNTS.admin.password;
      clearError();
      performLogin(DEMO_ACCOUNTS.admin.email, DEMO_ACCOUNTS.admin.password);
    });
  }

  // Handle standard form submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearError();

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) {
        showError('Please enter both email and password.');
        return;
      }

      performLogin(email, password);
    });
  }

  /**
   * Validate credentials against demo accounts and redirect.
   */
  function performLogin(email, password) {
    let matchedUser = null;

    if (email.toLowerCase() === DEMO_ACCOUNTS.student.email.toLowerCase() && password === DEMO_ACCOUNTS.student.password) {
      matchedUser = {
        email: DEMO_ACCOUNTS.student.email,
        name: DEMO_ACCOUNTS.student.name,
        role: 'student'
      };
    } else if (email.toLowerCase() === DEMO_ACCOUNTS.admin.email.toLowerCase() && password === DEMO_ACCOUNTS.admin.password) {
      matchedUser = {
        email: DEMO_ACCOUNTS.admin.email,
        name: DEMO_ACCOUNTS.admin.name,
        role: 'admin'
      };
    }

    if (matchedUser) {
      setCurrentUser(matchedUser);
      showToast(`Welcome back, ${matchedUser.name}!`, 'success');

      // Small delay for smooth UI transition
      setTimeout(() => {
        if (matchedUser.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      }, 400);
    } else {
      showError('Invalid credentials. Please use the demo accounts or quick-fill buttons below.');
    }
  }

  function showError(msg) {
    if (errorAlert) {
      errorAlert.innerText = msg;
      errorAlert.style.display = 'block';
    } else {
      alert(msg);
    }
  }

  function clearError() {
    if (errorAlert) {
      errorAlert.innerText = '';
      errorAlert.style.display = 'none';
    }
  }
});
