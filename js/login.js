/**
 * js/login.js
 * College Complaint Management System
 * Handles authentication via Flask /api/auth/login, user registration via
 * /api/auth/register, tab switching, quick demo credentials, and role-based redirects.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Tabs
  const tabLogin = document.getElementById('tab-btn-login');
  const tabRegister = document.getElementById('tab-btn-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const cardTitle = document.querySelector('.card-title');
  const cardSubtitle = document.querySelector('.card-subtitle');

  // Login inputs
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorAlert = document.getElementById('login-error');
  const successAlert = document.getElementById('login-success');

  // Register inputs
  const regNameInput = document.getElementById('reg-name');
  const regEmailInput = document.getElementById('reg-email');
  const regPasswordInput = document.getElementById('reg-password');

  // Demo buttons
  const btnDemoStudent = document.getElementById('btn-demo-student');
  const btnDemoAdmin = document.getElementById('btn-demo-admin');

  // -------------------------------------------------------------------
  // Tab Switching
  // -------------------------------------------------------------------
  if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => {
      clearAlerts();
      tabLogin.style.background = '#ffffff';
      tabLogin.style.color = 'var(--primary-800)';
      tabLogin.style.fontWeight = '700';
      tabLogin.style.boxShadow = 'var(--shadow-sm)';

      tabRegister.style.background = 'transparent';
      tabRegister.style.color = 'var(--text-muted)';
      tabRegister.style.fontWeight = '600';
      tabRegister.style.boxShadow = 'none';

      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      if (cardTitle) cardTitle.innerText = 'Sign In to Portal';
      if (cardSubtitle) cardSubtitle.innerText = 'Access your student grievance dashboard or admin control panel.';
    });

    tabRegister.addEventListener('click', () => {
      clearAlerts();
      tabRegister.style.background = '#ffffff';
      tabRegister.style.color = 'var(--primary-800)';
      tabRegister.style.fontWeight = '700';
      tabRegister.style.boxShadow = 'var(--shadow-sm)';

      tabLogin.style.background = 'transparent';
      tabLogin.style.color = 'var(--text-muted)';
      tabLogin.style.fontWeight = '600';
      tabLogin.style.boxShadow = 'none';

      registerForm.style.display = 'block';
      loginForm.style.display = 'none';
      if (cardTitle) cardTitle.innerText = 'Create Student Account';
      if (cardSubtitle) cardSubtitle.innerText = 'Register with your college email to submit and track grievances.';
    });

    // Auto-switch to register tab if requested via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'register' && tabRegister) {
      tabRegister.click();
    }
  }

  // -------------------------------------------------------------------
  // Quick-fill buttons for instant demo login
  // -------------------------------------------------------------------
  if (btnDemoStudent) {
    btnDemoStudent.addEventListener('click', () => {
      if (tabLogin) tabLogin.click();
      emailInput.value = 'student@college.com';
      passwordInput.value = '12345';
      clearAlerts();
      performLogin('student@college.com', '12345');
    });
  }

  if (btnDemoAdmin) {
    btnDemoAdmin.addEventListener('click', () => {
      if (tabLogin) tabLogin.click();
      emailInput.value = 'admin@college.com';
      passwordInput.value = 'admin123';
      clearAlerts();
      performLogin('admin@college.com', 'admin123');
    });
  }

  // -------------------------------------------------------------------
  // Handle Login Form Submission
  // -------------------------------------------------------------------
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearAlerts();

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) {
        showError('Please enter both email and password.');
        return;
      }

      performLogin(email, password);
    });
  }

  // -------------------------------------------------------------------
  // Handle Register Form Submission
  // -------------------------------------------------------------------
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlerts();

      const name = regNameInput.value.trim();
      const email = regEmailInput.value.trim();
      const password = regPasswordInput.value.trim();

      if (!name || !email || !password) {
        showError('Please fill in all registration fields.');
        return;
      }

      if (password.length < 5) {
        showError('Password must be at least 5 characters long.');
        return;
      }

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Creating Account...';
      }

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ name, email, password, role: 'student' })
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
          showSuccess('Account created successfully! Signing you in...');
          // Automatically log the newly registered user in
          setTimeout(() => {
            performLogin(email, password);
          }, 800);
        } else {
          showError(data.error || 'Failed to create account. Please try a different email.');
        }
      } catch (err) {
        console.error('Registration error:', err);
        showError('Failed to connect to server. Please ensure backend is running.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Create Student Account →';
        }
      }
    });
  }

  /**
   * Send credentials to Flask authentication endpoint.
   */
  async function performLogin(email, password) {
    clearAlerts();

    const submitBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Signing In...';
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        const user = data.user;
        showToast(`Welcome back, ${user.name}!`, 'success');

        setTimeout(() => {
          if (user.role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        }, 400);
      } else {
        showError(data.error || 'Invalid credentials. Please check your email and password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      showError('Unable to connect to authentication server. Please ensure backend is running.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Sign In →';
      }
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

  function showSuccess(msg) {
    if (successAlert) {
      successAlert.innerText = msg;
      successAlert.style.display = 'block';
    } else {
      showToast(msg, 'success');
    }
  }

  function clearAlerts() {
    if (errorAlert) {
      errorAlert.innerText = '';
      errorAlert.style.display = 'none';
    }
    if (successAlert) {
      successAlert.innerText = '';
      successAlert.style.display = 'none';
    }
  }
});
