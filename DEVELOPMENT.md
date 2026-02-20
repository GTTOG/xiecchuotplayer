# Development & Deployment Guide

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
```bash
cp .env.example .env
```

### 3. Start Server
```bash
npm start
```

Server will run on: `http://localhost:3000`

### 4. Open Frontend
Open `index.html` in your browser.

---

## Testing Locally

### Test Device Lock Feature

**Test 1: Register and Login on Same Device**
```
1. npm start
2. Open index.html
3. Register new account
4. Logout
5. Login with same account
6. ✅ Should succeed
```

**Test 2: Simulate Different Device (Same Computer)**
```
1. Open DevTools (F12)
2. Go to Console tab
3. Type: deviceManager.resetDevice()
4. Refresh page
5. Try to login
6. ❌ Should fail with "Device Unauthorized" error
```

**Test 3: Reset Database**
```
1. Delete users_db.json
2. Restart server (npm start)
3. users_db.json will be recreated
```

---

## Code Quality Checklist

Before committing:

- [ ] No hardcoded URLs (use environment variables)
- [ ] No passwords/API keys in code
- [ ] `.gitignore` prevents sensitive files from uploading
- [ ] `node_modules/` and `users_db.json` not committed
- [ ] All dependencies in `package.json`
- [ ] Code comments on complex logic
- [ ] Error messages are user-friendly

---

## Git Workflow

### First Time Setup
```bash
git init
git add .
git commit -m "Initial commit: Device-locked music player"
git remote add origin https://github.com/yourusername/xiecchuot-music-player.git
git push -u origin main
```

### Regular Commits
```bash
git add .
git commit -m "Clear commit message explaining changes"
git push origin main
```

---

## Deployment to Production

### Option 1: Heroku (Easiest)

1. **Create Heroku account** at https://heroku.com

2. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

3. **Login & Deploy**
   ```bash
   heroku login
   heroku create your-app-name
   git push heroku main
   ```

4. **View logs**
   ```bash
   heroku logs --tail
   ```

### Option 2: DigitalOcean (Affordable)

1. Create Droplet with Ubuntu 20.04
2. SSH into server
3. Install Node.js
4. Clone your repository
5. Install dependencies: `npm install`
6. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "xiecchuot"
   pm2 startup
   ```
7. Use Nginx as reverse proxy

### Option 3: AWS (Scalable)

1. Use AWS Elastic Beanstalk or EC2
2. Configure security groups
3. Set environment variables in `.env`
4. Use RDS for database (if upgrading from JSON)

---

## Important: Database Upgrade for Production

The current `users_db.json` approach is fine for testing, but for production, you should use a real database:

**Recommended upgrades:**
1. **MongoDB** - NoSQL, document-based
2. **PostgreSQL** - Relational, robust
3. **Firebase** - Cloud-hosted, managed

This requires updating `server.js` database functions to use database API instead of file I/O.

---

## Environment Variables

Keep these values in `.env` (never commit to Git):
```
PORT=3000
NODE_ENV=production
DATABASE_URL=<your-database-url>  # When upgrading from JSON
```

---

## Security Checklist

- [ ] No console.log() with sensitive data
- [ ] Password hashing enabled (bcryptjs)
- [ ] Device verification on every login
- [ ] CORS configured properly
- [ ] Rate limiting (optional: add express-rate-limit)
- [ ] Input validation on all fields
- [ ] HTTPS enabled in production

---

## Monitoring & Troubleshooting

### Check Server Status
```bash
curl http://localhost:3000/api/health
```

### View Database
```javascript
// In Node.js console:
const fs = require('fs');
const db = JSON.parse(fs.readFileSync('users_db.json'));
console.log(db.users);
```

### Monitor Performance
```bash
# Using PM2 (production)
pm2 monit
```

---

## Upgrading Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all
npm update

# Update specific package
npm install package-name@latest
```

---

## Rollback Procedure

If deployment fails:

```bash
git log --oneline              # See commits
git revert <commit-hash>       # Undo specific commit
git push origin main           # Deploy rollback
```

---

## Support & Debugging

### Common Issues

**1. CORS Error in Browser Console**
```
Error: Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution:** Ensure server is running and CORS is enabled in server.js

**2. Cannot connect to server**
```
Error: Could not connect to server
```
**Solution:** Check server is running (`npm start`) and PORT is correct

**3. Device Unauthorized**
```
Error: This account can only be accessed from Windows - Chrome
```
**Solution:** This is expected if on different device. Use `deviceManager.resetDevice()` to test.

---

## Next Steps

1. ✅ Set up GitHub repository
2. ✅ Push code to GitHub
3. Deploy to production (Heroku/AWS/DigitalOcean)
4. Set up CI/CD pipeline (GitHub Actions)
5. Add user email verification
6. Implement password reset flow
7. Add 2FA authentication
8. Scale database when needed

---

**🎉 Good luck with your deployment!**
