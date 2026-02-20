// Backend Server - Device-Locked Account System
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(express.json());
app.use(cors());

// Database file path
const dbPath = path.join(__dirname, 'users_db.json');

// Initialize database
function initializeDatabase() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ users: [] }, null, 2));
    }
}

// Read database
function readDatabase() {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading database:', error);
        return { users: [] };
    }
}

// Write database
function writeDatabase(data) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing database:', error);
        return false;
    }
}

// Hash password
async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

// Verify password
async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// GET - Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// POST - Register new account
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, deviceId, deviceName } = req.body;

        // Validation
        if (!username || !email || !password || !deviceId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const db = readDatabase();

        // Check if username exists
        const existingUser = db.users.find(u => u.username === username);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        // Check if email exists
        const existingEmail = db.users.find(u => u.email === email);
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create new user with device binding
        const newUser = {
            id: generateId(),
            username: username,
            email: email,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            registeredDevice: {
                deviceId: deviceId,
                deviceName: deviceName || 'Unknown Device',
                registeredAt: new Date().toISOString()
            },
            allowedDevices: [deviceId], // Only this device can login initially
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

        db.users.push(newUser);
        writeDatabase(db);

        res.json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST - Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, deviceId, deviceName } = req.body;

        // Validation
        if (!username || !password || !deviceId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const db = readDatabase();
        const user = db.users.find(u => u.username === username);

        // Check if user exists
        if (!user) {
            return res.status(401).json({ success: false, message: 'Username not found' });
        }

        // Verify password
        const passwordValid = await verifyPassword(password, user.password);
        if (!passwordValid) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // Check device binding - CRITICAL: Only allow registered device
        if (!user.allowedDevices || !user.allowedDevices.includes(deviceId)) {
            return res.status(403).json({
                success: false,
                message: 'This account can only be accessed from the device where it was registered',
                allowedDevice: user.registeredDevice.deviceName,
                deviceUnauthorized: true
            });
        }

        // Login successful
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profile: user.profile,
                preferences: user.preferences
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST - Request device authorization (optional feature for future)
app.post('/api/request-device-access', async (req, res) => {
    try {
        const { userId, password, newDeviceId, newDeviceName } = req.body;

        if (!userId || !password || !newDeviceId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const db = readDatabase();
        const user = db.users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const passwordValid = await verifyPassword(password, user.password);
        if (!passwordValid) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // Add device to allowed list (optional)
        if (!user.allowedDevices.includes(newDeviceId)) {
            user.allowedDevices.push(newDeviceId);
            writeDatabase(db);
        }

        res.json({
            success: true,
            message: 'Device access granted'
        });
    } catch (error) {
        console.error('Request device access error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET - Get user data
app.get('/api/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const db = readDatabase();
        const user = db.users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Don't send password
        const { password, ...userWithoutPassword } = user;
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT - Update user data
app.put('/api/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        const db = readDatabase();
        const userIndex = db.users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Don't allow password or device updates via this endpoint
        delete updates.password;
        delete updates.allowedDevices;
        delete updates.registeredDevice;

        db.users[userIndex] = { ...db.users[userIndex], ...updates };
        writeDatabase(db);

        const { password, ...userWithoutPassword } = db.users[userIndex];
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Initialize and start server
initializeDatabase();
app.listen(PORT, () => {
    console.log(`🎵 Device-Locked Server running on http://localhost:${PORT}`);
    console.log(`📁 Database: ${dbPath}`);
    console.log(`⚙️  Environment: ${NODE_ENV}`);
    console.log(`✅ Server ready for requests\n`);
});
