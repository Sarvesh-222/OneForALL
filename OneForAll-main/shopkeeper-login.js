// ══════════════════════════════════════════════════
// FRESHMART SHOPKEEPER — LOGIN CONTROLLER
// ══════════════════════════════════════════════════

const LOGIN_API_BASE_URL = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : window.location.origin;

const VALID_CREDENTIALS = [
    { username: 'admin', password: 'admin' },
    { username: 'ramesh@freshmart.in', password: 'ramesh123' },
    { username: 'shopkeeper', password: 'shop123' }
];

const SESSION_KEY = 'freshmart_session';

// ─── Toast Notifications ───
function showToast(msg, type='') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fa-solid fa-${type==='success'?'check-circle':type==='danger'?'times-circle':'info-circle'}"></i> ${msg}`;
    
    let tc = document.getElementById('toast-container');
    if (!tc) {
        tc = document.createElement('div');
        tc.id = 'toast-container';
        tc.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:10000; display:flex; flex-direction:column; gap:10px;';
        document.body.appendChild(tc);
    }
    tc.appendChild(t);
    setTimeout(() => t.remove(), 3100);
}

// ─── Check if already logged in ───
function checkExistingSession() {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
        try {
            const data = JSON.parse(session);
            if (data.loggedIn && data.remember) {
                // Skip login screen
                showDashboard(true);
                return;
            }
        } catch(e) {}
    }
    
    // Also check sessionStorage for current-session-only login
    const tempSession = sessionStorage.getItem(SESSION_KEY);
    if (tempSession) {
        try {
            const data = JSON.parse(tempSession);
            if (data.loggedIn) {
                showDashboard(true);
                return;
            }
        } catch(e) {}
    }
    
    // Show login screen — auto-focus the email field
    setTimeout(() => {
        const emailField = document.getElementById('loginEmail');
        if (emailField) emailField.focus();
    }, 800);
}

// ─── Handle Login ───
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe').checked;
    const loginBtn = document.getElementById('loginBtn');
    const errorEl = document.getElementById('loginError');
    const errorTextEl = document.getElementById('loginErrorText');
    
    errorEl.classList.remove('visible');
    loginBtn.classList.add('loading');

    try {
        const response = await fetch(`${LOGIN_API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || 'Invalid email or password');
        }

        const sessionData = { loggedIn: true, username: email, remember, token: data.access_token, timestamp: Date.now() };
        if (remember) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        }

        loginBtn.classList.remove('loading');
        showDashboard(false);
    } catch (error) {
        loginBtn.classList.remove('loading');
        errorTextEl.textContent = error.message || 'Invalid email or password. Please try again.';
        errorEl.classList.add('visible');
        document.getElementById('loginEmail').style.borderColor = '#e74c3c';
        document.getElementById('loginPassword').style.borderColor = '#e74c3c';
        setTimeout(() => {
            document.getElementById('loginEmail').style.borderColor = '';
            document.getElementById('loginPassword').style.borderColor = '';
        }, 1500);
    }
}

// ─── Show Dashboard ───
function showDashboard(instant) {
    const loginScreen = document.getElementById('loginScreen');
    
    if (instant) {
        // Instant transition for returning users
        loginScreen.style.display = 'none';
        document.body.classList.remove('dashboard-hidden');
    } else {
        // Smooth animated transition
        loginScreen.classList.add('hidden');
        document.body.classList.remove('dashboard-hidden');
        
        setTimeout(() => {
            loginScreen.style.display = 'none';
        }, 600);
    }
    
    // Initialize the dashboard (loads data, starts order simulation)
    if (typeof init === 'function') {
        init();
    }
}

// ─── Toggle Password Visibility ───
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('loginPassword');
    const toggleIcon = document.getElementById('passwordToggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// ─── Logout (can be called from dashboard) ───
function logout() {
    closeProfileMenu();
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
}

// ══════════════════════════════════════════════════
// PROFILE DROPDOWN MENU
// ══════════════════════════════════════════════════

function toggleProfileMenu(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('open');
    
    // Update the displayed email from session
    updateProfileDropdownInfo();
}

function closeProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) dropdown.classList.remove('open');
}

function updateProfileDropdownInfo() {
    const shopName = localStorage.getItem('freshmart_shop_name') || 'Ramesh Kirana';
    const nameEl = document.getElementById('profileShopName');
    if (nameEl) nameEl.textContent = shopName;
    
    // Get username from session
    let username = 'admin';
    try {
        const s = JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || '{}');
        if (s.username) username = s.username;
    } catch(e) {}
    const emailEl = document.getElementById('profileEmail');
    if (emailEl) emailEl.textContent = username;
}

// Close dropdown when clicking anywhere else
document.addEventListener('click', (e) => {
    const wrap = document.getElementById('profileDropdownWrap');
    if (wrap && !wrap.contains(e.target)) {
        closeProfileMenu();
    }
});

// ══════════════════════════════════════════════════
// CHANGE SHOP NAME MODAL
// ══════════════════════════════════════════════════

function openShopNameModal() {
    closeProfileMenu();
    const currentName = localStorage.getItem('freshmart_shop_name') || 'Ramesh Kirana';
    document.getElementById('newShopName').value = currentName;
    document.getElementById('shopNameModal').classList.add('active');
    setTimeout(() => document.getElementById('newShopName').focus(), 200);
}

function closeShopNameModal(event) {
    if (event) event.preventDefault();
    document.getElementById('shopNameModal').classList.remove('active');
}

function saveShopName() {
    const newName = document.getElementById('newShopName').value.trim();
    if (!newName) {
        showToast('Please enter a shop name', 'danger');
        return;
    }
    
    localStorage.setItem('freshmart_shop_name', newName);
    
    // Update navbar store badge
    const badge = document.querySelector('.store-badge');
    if (badge) badge.innerHTML = `<i class="fa-solid fa-store"></i> ${newName}`;
    
    // Update profile dropdown
    const nameEl = document.getElementById('profileShopName');
    if (nameEl) nameEl.textContent = newName;
    
    // Update profile avatar letter
    const initial = newName.charAt(0).toUpperCase();
    document.querySelectorAll('.profile-pic, .profile-dropdown-avatar').forEach(el => {
        el.textContent = initial;
    });
    
    closeShopNameModal();
    showToast(`Shop name updated to "${newName}"`, 'success');
}

// ══════════════════════════════════════════════════
// CHANGE CREDENTIALS MODAL
// ══════════════════════════════════════════════════

function openCredentialsModal() {
    closeProfileMenu();
    document.getElementById('newLoginId').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('credentialsModal').classList.add('active');
    setTimeout(() => document.getElementById('newLoginId').focus(), 200);
}

function closeCredentialsModal(event) {
    if (event) event.preventDefault();
    document.getElementById('credentialsModal').classList.remove('active');
}

function saveCredentials() {
    const newId = document.getElementById('newLoginId').value.trim();
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    
    if (!newId && !newPass) {
        showToast('Please fill in at least one field', 'danger');
        return;
    }
    
    if (newPass && newPass !== confirmPass) {
        showToast('Passwords do not match', 'danger');
        return;
    }
    
    if (newPass && newPass.length < 3) {
        showToast('Password must be at least 3 characters', 'danger');
        return;
    }
    
    // Update credentials in the VALID_CREDENTIALS array (runtime only)
    // In production, this would be an API call
    if (newId) {
        VALID_CREDENTIALS[0].username = newId.toLowerCase();
    }
    if (newPass) {
        VALID_CREDENTIALS[0].password = newPass;
    }
    
    // Save to localStorage for persistence across reloads
    const savedCreds = { username: VALID_CREDENTIALS[0].username, password: VALID_CREDENTIALS[0].password };
    localStorage.setItem('freshmart_credentials', JSON.stringify(savedCreds));
    
    // Update session with new username
    const sessionData = JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || '{}');
    if (newId) sessionData.username = newId.toLowerCase();
    if (sessionData.remember) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    }
    
    // Update dropdown email display
    updateProfileDropdownInfo();
    
    closeCredentialsModal();
    showToast('Credentials updated successfully!', 'success');
}

// ─── Load saved shop name & credentials on startup ───
function loadSavedSettings() {
    // Load shop name
    const savedName = localStorage.getItem('freshmart_shop_name');
    if (savedName) {
        const badge = document.querySelector('.store-badge');
        if (badge) badge.innerHTML = `<i class="fa-solid fa-store"></i> ${savedName}`;
        
        const initial = savedName.charAt(0).toUpperCase();
        document.querySelectorAll('.profile-pic, .profile-dropdown-avatar').forEach(el => {
            el.textContent = initial;
        });
    }
    
    // Load saved credentials
    const savedCreds = localStorage.getItem('freshmart_credentials');
    if (savedCreds) {
        try {
            const creds = JSON.parse(savedCreds);
            VALID_CREDENTIALS[0].username = creds.username;
            VALID_CREDENTIALS[0].password = creds.password;
        } catch(e) {}
    }
}

// ══════════════════════════════════════════════════
// REGISTRATION MODAL
// ══════════════════════════════════════════════════

function openRegisterModal() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'flex';
    
    // Clear form fields
    document.getElementById('registerForm').reset();
    document.getElementById('registerError').style.display = 'none';
    
    setTimeout(() => {
        document.getElementById('registerName').focus();
    }, 100);
}

function closeRegisterModal() {
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    
    // Clear form
    document.getElementById('registerForm').reset();
    document.getElementById('registerError').style.display = 'none';
}

async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const registerBtn = document.getElementById('registerBtn');
    const errorEl = document.getElementById('registerError');
    const errorTextEl = document.getElementById('registerErrorText');
    
    // Validation
    if (!name || !email || !phone || !password) {
        errorTextEl.textContent = 'Please fill in all fields';
        errorEl.style.display = 'flex';
        return;
    }
    
    if (password !== confirmPassword) {
        errorTextEl.textContent = 'Passwords do not match';
        errorEl.style.display = 'flex';
        return;
    }
    
    if (password.length < 6) {
        errorTextEl.textContent = 'Password must be at least 6 characters';
        errorEl.style.display = 'flex';
        return;
    }
    
    if (phone.length < 10) {
        errorTextEl.textContent = 'Phone number must be at least 10 digits';
        errorEl.style.display = 'flex';
        return;
    }
    
    errorEl.style.display = 'none';
    registerBtn.classList.add('loading');
    
    try {
        // Call backend registration endpoint
        const response = await fetch(`${LOGIN_API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shop_id: 1,  // Default shop_id
                phone: phone,
                email: email,
                name: name,
                password: password,
                role: 'shopkeeper'
            })
        });
        
        const data = await response.json();
        
        if (!response.ok || data.error) {
            throw new Error(data.error || data.detail || 'Registration failed');
        }
        
        registerBtn.classList.remove('loading');
        
        // Show success message
        showToast(`Account created successfully! Welcome to FreshMart, ${name}! 🎉`, 'success');
        
        // Auto-login with new credentials
        setTimeout(() => {
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPassword').value = password;
            document.getElementById('rememberMe').checked = false;
            
            closeRegisterModal();
            
            // Trigger login
            setTimeout(() => {
                document.getElementById('loginForm').requestSubmit();
            }, 300);
        }, 800);
        
    } catch (error) {
        registerBtn.classList.remove('loading');
        errorTextEl.textContent = error.message || 'Registration failed. Please try again.';
        errorEl.style.display = 'flex';
        console.error('Registration error:', error);
    }
}

// ─── Initialize on load ───
document.addEventListener('DOMContentLoaded', () => {
    loadSavedSettings();
    checkExistingSession();
});

// Expose helpers for inline handlers used by the login page.
window.handleLogin = handleLogin;
window.togglePasswordVisibility = togglePasswordVisibility;
window.logout = logout;
window.toggleProfileMenu = toggleProfileMenu;
window.closeProfileMenu = closeProfileMenu;
window.updateProfileDropdownInfo = updateProfileDropdownInfo;
window.openShopNameModal = openShopNameModal;
window.closeShopNameModal = closeShopNameModal;
window.saveShopName = saveShopName;
window.openCredentialsModal = openCredentialsModal;
window.closeCredentialsModal = closeCredentialsModal;
window.saveCredentials = saveCredentials;
window.showDashboard = showDashboard;
window.checkExistingSession = checkExistingSession;
window.loadSavedSettings = loadSavedSettings;
window.openRegisterModal = openRegisterModal;
window.closeRegisterModal = closeRegisterModal;
window.handleRegister = handleRegister;

// ─── Handle Enter key on login form ───
document.addEventListener('keydown', (e) => {
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen && !loginScreen.classList.contains('hidden') && loginScreen.style.display !== 'none') {
        if (e.key === 'Enter') {
            const form = document.getElementById('loginForm');
            if (form) form.requestSubmit();
        }
    }
});
