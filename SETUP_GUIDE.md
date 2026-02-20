# 🎵 Device-Locked Music Player - Setup Guide

## Overview
This system implements **device-locked accounts** where:
- Users can only create an account on ONE device
- That account can only be logged into from that SAME device
- Attempting to login on a different device will be rejected automatically
- All user data is stored on an **online database** (backend server)

## Architecture

### Frontend (Browser)
- `device.js` - Generates unique device fingerprint
- `auth.js` - Handles login/register with device validation
- `index.html` - UI with script references
- `storage.js` - Local storage for offline caching (optional)

### Backend (Node.js)
- `server.js` - Express server handling all user data and device verification
- `users_db.json` - Online database storing all accounts and device bindings

---

## Installation & Setup

### Step 1: Install Node.js
Download from https://nodejs.org/ (Latest LTS version recommended)

### Step 2: Install Dependencies
Navigate to the project folder in terminal and run:
```bash
npm install
```

### Step 3: Start the Backend Server
```bash
npm start
```

You should see:
```
🎵 Device-Locked Server running on http://localhost:3000
📁 Database: C:\path\to\users_db.json
```

### Step 4: Open Frontend
Open `index.html` in a browser. The app should connect to your backend automatically.

---

## How Device Locking Works

### Registration Flow
1. User fills out registration form (username, email, password)
2. Browser generates a unique **device fingerprint** using:
   - Browser user agent
   - Screen resolution
   - OS type
   - Timezone
   - CPU cores
   - Random token
3. Backend creates account and stores the device ID in `allowedDevices` array
4. User is now locked to THIS device

### Login Flow
1. User enters username and password
2. Device fingerprint is sent with login request
3. Backend checks if device ID matches `allowedDevices` array
4. ✅ **Device matches** → Login succeeds
5. ❌ **Device doesn't match** → Login rejected with message showing authorized device name

---

## Testing Device Locking

### Test 1: Same Device Login (Should work)
```
1. Register account "testuser" on Device A (Computer 1)
2. Logout
3. Login with "testuser" on Device A (same computer, same browser)
4. ✅ Success
```

### Test 2: Different Device Login (Should fail)
```
1. Register account "testuser" on Device A (Computer 1)
2. On Device B (Different computer or browser)
3. Try to login with "testuser"
4. ❌ Error: "This account can only be accessed from: Windows - Chrome"
```

### Test 3: Reset Device (To Test on Same Computer)
If you want to simulate a different device on the same computer:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run: `deviceManager.resetDevice()`
4. Refresh page
5. Now try to login - it will be treated as a NEW device ❌

---

## Database Structure

### users_db.json
```json
{
  "users": [
    {
      "id": "abc123def456",
      "username": "testuser",
      "email": "test@example.com",
      "password": "$2a$10$...",  // bcrypt hash
      "createdAt": "2024-02-20T10:30:00.000Z",
      "registeredDevice": {
        "deviceId": "1a2b3c4d5e6f",
        "deviceName": "Windows - Chrome",
        "registeredAt": "2024-02-20T10:30:00.000Z"
      },
      "allowedDevices": ["1a2b3c4d5e6f"],  // Only this device can login
      "tracks": [],
      "likedTracks": [],
      "playlists": [],
      "preferences": { "volume": 70, "loopEnabled": false },
      "profile": { ... },
      "downloadedTracks": [],
      "followers": [],
      "following": []
    }
  ]
}
```

---

## API Endpoints

### POST /api/register
Register new account with device binding
```javascript
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "deviceId": "1a2b3c4d5e6f",
  "deviceName": "Windows - Chrome"
}
```

### POST /api/login
Login with device verification
```javascript
{
  "username": "testuser",
  "password": "password123",
  "deviceId": "1a2b3c4d5e6f",
  "deviceName": "Windows - Chrome"
}
```
Response if device unauthorized:
```javascript
{
  "success": false,
  "message": "This account can only be accessed from the device where it was registered",
  "allowedDevice": "Windows - Chrome",
  "deviceUnauthorized": true
}
```

### GET /api/user/:userId
Get user data

### PUT /api/user/:userId
Update user data (except password/device settings)

### POST /api/request-device-access (Optional)
For future: Allow user to authorize additional devices with password confirmation

---

## Security Features

✅ **Device Fingerprinting** - Each device gets a unique ID
✅ **Password Hashing** - Uses bcrypt with 10 rounds (industry standard)
✅ **Device Authorization Check** - Backend validates device before login
✅ **Account Isolation** - Each account is locked to registration device
✅ **Online Storage** - No local-only storage means data persists across sessions

---

## Troubleshooting

### "Could not connect to server"
- Ensure backend server is running (`npm start`)
- Check that `http://localhost:3000` is accessible
- Verify port 3000 is not blocked by firewall

### "Device Unauthorized" Error
- Account is on a different device
- This is EXPECTED behavior - accounts are device-locked
- To test on same computer: Run `deviceManager.resetDevice()` in console to get new device ID

### Password Hashing Not Working
- Ensure `bcryptjs` is installed: `npm install bcryptjs`
- Check server console for errors

---

## Future Enhancements

1. **Multi-device Support** - Allow admin to authorize new devices
2. **Device Management** - Let users see/manage authorized devices
3. **Email Verification** - Verify email during registration
4. **Recovery Codes** - Generate backup codes during registration
5. **API Key Auth** - For mobile app support
6. **Cloud Sync** - Sync tracks and playlists across devices

---

## Files Overview

| File | Purpose |
|------|---------|
| `server.js` | Backend Express server |
| `device.js` | Device fingerprinting & identification |
| `auth.js` | Authentication with device locking |
| `storage.js` | Local storage (optional for offline use) |
| `index.html` | Frontend UI |
| `player.js` | Music player functionality |
| `package.json` | Node.js dependencies |
| `users_db.json` | Online database (auto-created) |

---

## Support
For issues or questions, check the browser console (F12) for error messages.
