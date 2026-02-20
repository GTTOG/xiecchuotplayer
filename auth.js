// Notification System
// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : `${window.location.protocol}//${window.location.host}`;

class NotificationManager {
    constructor(containerId = 'notificationContainer') {
        this.container = document.getElementById(containerId);
        this.notifications = [];
    }

    show(message, type = 'info', duration = 3000, title = null) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠'
        };

        const titleMap = {
            success: 'Success',
            error: 'Error',
            info: 'Info',
            warning: 'Warning'
        };

        const notificationTitle = title || titleMap[type] || 'Notification';
        const icon = icons[type] || '•';

        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-title">${notificationTitle}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">×</button>
        `;

        this.container.appendChild(notification);
        this.notifications.push(notification);

        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.remove(notification));

        if (duration > 0) {
            setTimeout(() => this.remove(notification), duration);
        }

        return notification;
    }

    remove(notification) {
        notification.classList.add('removing');
        setTimeout(() => {
            notification.remove();
            this.notifications = this.notifications.filter(n => n !== notification);
        }, 300);
    }

    success(message, title = 'Success', duration = 3000) {
        return this.show(message, 'success', duration, title);
    }

    error(message, title = 'Error', duration = 4000) {
        return this.show(message, 'error', duration, title);
    }

    info(message, title = 'Info', duration = 3000) {
        return this.show(message, 'info', duration, title);
    }

    warning(message, title = 'Warning', duration = 3500) {
        return this.show(message, 'warning', duration, title);
    }
}

// Initialize notification manager globally
const notificationManager = new NotificationManager();

// Authentication System

class AuthManager {
    constructor() {
        this.authModal = document.getElementById('authModal');
        this.appContainer = document.getElementById('appContainer');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.loginError = document.getElementById('loginError');
        this.registerError = document.getElementById('registerError');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.auth-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Form submissions
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));

        // Logout buttons
        document.getElementById('logoutSidebar').addEventListener('click', () => this.handleLogout());
    }

    switchTab(tab) {
        // Hide all tabs
        document.querySelectorAll('.auth-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.auth-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        const tabContent = document.getElementById(tab + 'Tab');
        const tabBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (tabContent) tabContent.classList.add('active');
        if (tabBtn) tabBtn.classList.add('active');

        // Clear error messages
        this.loginError.textContent = '';
        this.registerError.textContent = '';
    }

    async handleLogin(e) {
        e.preventDefault();
        this.loginError.textContent = '';

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            this.loginError.textContent = 'Please fill in all fields';
            notificationManager.warning('Please enter both username and password', 'Field Required');
            return;
        }

        // Get device info
        const deviceId = deviceManager.getDeviceId();
        const deviceName = deviceManager.getDeviceName();

        try {
            // Send login request to backend
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, deviceId, deviceName })
            });

            const data = await response.json();

            if (!data.success) {
                if (data.deviceUnauthorized) {
                    this.loginError.textContent = 'Device not authorized. Account can only be accessed from: ' + data.allowedDevice;
                    notificationManager.error(
                        `This account can only be accessed from: ${data.allowedDevice}`,
                        'Device Unauthorized'
                    );
                } else {
                    this.loginError.textContent = data.message;
                    notificationManager.error(data.message, 'Login Failed');
                }
                return;
            }

            // Login successful - save user info locally
            storageManager.setCurrentUser(data.user);
            notificationManager.success(`Welcome back, ${username}!`, 'Logged In');
            this.showApp();
            this.loginForm.reset();
            this.setupPlayer();
        } catch (error) {
            console.error('Login error:', error);
            this.loginError.textContent = 'Connection error. Please try again.';
            notificationManager.error('Could not connect to server', 'Connection Error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        this.registerError.textContent = '';

        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('registerConfirm').value;

        // Validate username
        const usernameValidation = storageManager.validateUsername(username);
        if (!usernameValidation.valid) {
            this.registerError.textContent = usernameValidation.message;
            notificationManager.warning(usernameValidation.message, 'Invalid Username');
            return;
        }

        // Validate email
        const emailValidation = storageManager.validateEmail(email);
        if (!emailValidation.valid) {
            this.registerError.textContent = emailValidation.message;
            notificationManager.warning(emailValidation.message, 'Invalid Email');
            return;
        }

        // Validate password
        const passwordValidation = storageManager.validatePassword(password);
        if (!passwordValidation.valid) {
            this.registerError.textContent = passwordValidation.message;
            notificationManager.warning(passwordValidation.message, 'Weak Password');
            return;
        }

        // Check password match
        if (password !== confirm) {
            this.registerError.textContent = 'Passwords do not match';
            notificationManager.error('Passwords do not match', 'Mismatch');
            return;
        }

        // Get device info
        const deviceId = deviceManager.getDeviceId();
        const deviceName = deviceManager.getDeviceName();

        try {
            // Send register request to backend
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, deviceId, deviceName })
            });

            const data = await response.json();

            if (!data.success) {
                this.registerError.textContent = data.message;
                notificationManager.warning(data.message, 'Registration Failed');
                return;
            }

            // Registration successful - auto login
            storageManager.setCurrentUser(data.user);
            notificationManager.success(`Welcome, ${username}! Account created with device lock.`, 'Account Created');

            this.showApp();
            this.registerForm.reset();
            this.setupPlayer();
        } catch (error) {
            console.error('Register error:', error);
            this.registerError.textContent = 'Connection error. Please try again.';
            notificationManager.error('Could not connect to server', 'Connection Error');
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            const username = storageManager.getCurrentUser()?.username || 'User';
            storageManager.clearCurrentUser();
            notificationManager.info(`See you soon, ${username}!`, 'Logged Out', 2000);
            setTimeout(() => {
                this.showAuthModal();
                this.loginForm.reset();
                this.registerForm.reset();
                this.loginError.textContent = '';
                this.registerError.textContent = '';
            }, 500);
        }
    }

    showAuthModal() {
        this.authModal.classList.add('active');
        this.appContainer.classList.add('hidden');
    }

    showApp() {
        this.authModal.classList.remove('active');
        this.appContainer.classList.remove('hidden');

        const currentUser = storageManager.getCurrentUser();
        if (currentUser) {
            document.getElementById('sidebarUsername').textContent = currentUser.username;
            document.getElementById('headerUsername').textContent = `${currentUser.username}`;
        }
    }

    checkAuthStatus() {
        const currentUser = storageManager.getCurrentUser();
        if (currentUser) {
            this.showApp();
            setTimeout(() => this.setupPlayer(), 100);
        } else {
            this.showAuthModal();
        }
    }

    setupPlayer() {
        // This will be called by player.js
    }
}

// Initialize auth manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
