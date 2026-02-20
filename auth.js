// Notification System
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

    handleLogin(e) {
        e.preventDefault();
        this.loginError.textContent = '';

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            this.loginError.textContent = 'Please fill in all fields';
            notificationManager.warning('Please enter both username and password', 'Field Required');
            return;
        }

        const user = storageManager.getUserByUsername(username);

        if (!user) {
            this.loginError.textContent = 'Username not found';
            notificationManager.error('Username not found', 'Login Failed');
            return;
        }

        if (!storageManager.verifyPassword(password, user.password)) {
            this.loginError.textContent = 'Invalid password';
            notificationManager.error('Invalid password', 'Login Failed');
            return;
        }

        // Login successful
        storageManager.setCurrentUser(user.id);
        notificationManager.success(`Welcome back, ${username}!`, 'Logged In');
        this.showApp();
        this.loginForm.reset();
        this.setupPlayer();
    }

    handleRegister(e) {
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

        // Create user
        const newUser = {
            id: storageManager.generateId(),
            username: username,
            email: email,
            password: storageManager.hashPassword(password),
            createdAt: new Date().toISOString(),
            tracks: [],
            likedTracks: [],
            playlists: [],
            preferences: {
                volume: 70,
                loopEnabled: false
            },
            profile: {
                displayName: username,
                bio: 'Welcome to xiecchuot player!',
                avatar: '👤',
                socialMedia: {
                    twitter: '',
                    instagram: '',
                    youtube: ''
                }
            },
            downloadedTracks: [],
            followers: [],
            following: []
        };

        storageManager.addUser(newUser);
        storageManager.setCurrentUser(newUser.id);
        notificationManager.success(`Welcome, ${username}!`, 'Account Created');

        this.showApp();
        this.registerForm.reset();
        this.setupPlayer();
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
