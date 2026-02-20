# 🎵 xiecchuot Music Player

A modern music player application with **device-locked accounts** and online storage. Users can create accounts that are bound to a specific device - accounts can only be accessed from the device where they were registered.

## ✨ Features

🎵 **Music Player**
- Play, pause, skip tracks
- Volume control & loop settings
- Playlist management
- Like/favorite songs

🔐 **Device-Locked Accounts**
- Accounts securely bound to registration device
- No account sharing across devices
- Unique device fingerprinting
- Online account storage

💾 **User Data**
- Playlists
- Liked tracks
- User preferences
- Profile customization

---

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ ([Download](https://nodejs.org/))
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/xiecchuot-music-player.git
   cd xiecchuot-music-player
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start the backend server**
   ```bash
   npm start
   ```
   
   Server runs on: `http://localhost:3000`

5. **Open the application**
   - Open `index.html` in your browser
   - Or use a local server:
   ```bash
   npx http-server
   ```

---

## 🔐 Device Locking Explained

### How It Works

1. **Registration**
   - User creates account on Device A
   - Browser generates unique device fingerprint
   - Account is locked to Device A only

2. **Login on Same Device** ✅
   - Device fingerprint matches
   - Login succeeds

3. **Login on Different Device** ❌
   - Device fingerprint doesn't match
   - Login rejected with error message

### Testing Device Lock

**Same Device (Should work)**
```
1. Register "testuser" on Computer 1
2. Logout and login again
3. ✅ Success
```

**Different Device (Currently fails, as intended)**
```
1. Register "testuser" on Computer 1
2. Try login on Computer 2
3. ❌ Error: "This account can only be accessed from: Windows - Chrome"
```

**Simulate New Device (Same Computer)**
```
1. Open DevTools (F12)
2. Console tab
3. Run: deviceManager.resetDevice()
4. Refresh page
5. Try to login as existing user → ❌ Fails (new device detected)
```

---

## 📁 Project Structure

```
xiecchuot-music-player/
├── server.js              # Express backend server
├── device.js              # Device fingerprinting
├── auth.js                # Authentication & device locking
├── storage.js             # Storage management
├── player.js              # Music player logic
├── index.html             # Main UI
├── style.css              # Styling
├── package.json           # Dependencies
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
├── LICENSE                # MIT License
├── README.md              # This file
└── SETUP_GUIDE.md         # Detailed setup guide
```

---

## 🛠️ Available Scripts

### `npm start`
Starts the backend server on port 3000

### `npm run dev`
Starts server with auto-reload (requires nodemon)

---

## 🔌 API Endpoints

All endpoints return JSON responses.

### `POST /api/register`
Create new account with device binding
```javascript
Request body:
{
  "username": "string",
  "email": "string",
  "password": "string (min 6 chars)",
  "deviceId": "string",
  "deviceName": "string"
}

Response: { success: true, user: {...} }
```

### `POST /api/login`
Login with device verification
```javascript
Request body:
{
  "username": "string",
  "password": "string",
  "deviceId": "string",
  "deviceName": "string"
}

Response: 
- Success: { success: true, user: {...} }
- Wrong device: { success: false, deviceUnauthorized: true, allowedDevice: "..." }
```

### `GET /api/user/:userId`
Get user profile data

### `PUT /api/user/:userId`
Update user data (profile, preferences, playlists)

---

## 📊 Database

User data is stored in `users_db.json` (auto-created on first run).

**User Schema:**
```javascript
{
  id: "unique-id",
  username: "string",
  email: "string",
  password: "bcrypt-hash",
  createdAt: "ISO-8601",
  registeredDevice: {
    deviceId: "string",
    deviceName: "string",
    registeredAt: "ISO-8601"
  },
  allowedDevices: ["deviceId"],
  tracks: [],
  likedTracks: [],
  playlists: [],
  preferences: { volume: 70, loopEnabled: false },
  profile: { displayName: "string", bio: "string", avatar: "emoji" }
}
```

---

## 🔒 Security

✅ **Password Hashing** - bcryptjs with 10 rounds
✅ **Device Verification** - Backend validates device on every login
✅ **No Plaintext Storage** - Passwords never stored in code
✅ **Environment Variables** - Sensitive config in .env
✅ **CORS Enabled** - API accessible from frontend

---

## 🛑 Known Limitations

- Single database file (suitable for testing/small deployments)
- No email verification system
- No password reset functionality
- Device ID persists in localStorage (can be reset via console)

---

## 🚀 Deployment

### To Production

1. **Update .env**
   ```bash
   NODE_ENV=production
   PORT=3000
   ```

2. **Use a real database** (MongoDB, PostgreSQL, etc.)
   - Update `server.js` to connect to cloud database
   - Replace file-based JSON storage

3. **Enable HTTPS**
   - Use reverse proxy (Nginx, Apache)
   - SSL certificate (Let's Encrypt)

4. **Deploy to hosting**
   - Heroku, AWS, DigitalOcean, etc.
   - Keep `.env` variables secret

---

## 🐛 Troubleshooting

### "Could not connect to server"
- Verify backend is running: `npm start`
- Check port 3000 is not blocked
- Ensure `http://localhost:3000` is accessible

### "Device Unauthorized" on login
- This is expected if trying to login on different device
- Account is device-locked for security

### Password issues
- Ensure `bcryptjs` installed: `npm install bcryptjs`
- Check Node.js version compatibility

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

## 🎉 Acknowledgments

Built with:
- [Express.js](https://expressjs.com/) - Web framework
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) - Password hashing
- [CORS](https://github.com/expressjs/cors) - Cross-origin requests

---

**Happy listening! 🎵**
