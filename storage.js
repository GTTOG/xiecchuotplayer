// Storage Management System with Blob Support

class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'musicPlayerDB';
        this.DB_NAME = 'MusicPlayerDB';
        this.DB_VERSION = 1;
        this.STORE_NAME = 'tracks';
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            const initialData = {
                users: [],
                currentUser: null
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData));
        }
    }

    // User Management
    addUser(user) {
        const data = this.getData();
        data.users.push(user);
        this.saveData(data);
        return user;
    }

    getUserByUsername(username) {
        const data = this.getData();
        return data.users.find(u => u.username === username);
    }

    getUserByEmail(email) {
        const data = this.getData();
        return data.users.find(u => u.email === email);
    }

    getUserById(userId) {
        const data = this.getData();
        return data.users.find(u => u.id === userId);
    }

    updateUser(userId, updates) {
        const data = this.getData();
        const userIndex = data.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            data.users[userIndex] = { ...data.users[userIndex], ...updates };
            this.saveData(data);
            return data.users[userIndex];
        }
        return null;
    }

    // Authentication
    setCurrentUser(userId) {
        const data = this.getData();
        data.currentUser = userId;
        this.saveData(data);
    }

    getCurrentUser() {
        const data = this.getData();
        if (data.currentUser) {
            return this.getUserById(data.currentUser);
        }
        return null;
    }

    clearCurrentUser() {
        const data = this.getData();
        data.currentUser = null;
        this.saveData(data);
    }

    // Track Management (using IndexedDB for file storage)
    async saveTrackFile(userId, file) {
        try {
            const fileData = await this.fileToBase64(file);
            const trackId = this.generateId();
            
            const track = {
                id: trackId,
                name: file.name,
                fileName: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
                addedAt: new Date().toISOString(),
                duration: 0
            };

            // Save metadata in localStorage
            const user = this.getUserById(userId);
            if (user) {
                if (!user.tracks) user.tracks = [];
                user.tracks.push(track);
                this.updateUser(userId, { tracks: user.tracks });

                // Save file data in sessionStorage (limited space) or use a file blob map
                if (!window.trackBlobMap) window.trackBlobMap = {};
                window.trackBlobMap[trackId] = fileData;

                return track;
            }
            return null;
        } catch (error) {
            console.error('Error saving track file:', error);
            return null;
        }
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    getTrackBlob(trackId) {
        if (!window.trackBlobMap) window.trackBlobMap = {};
        return window.trackBlobMap[trackId] || null;
    }

    // Playlist Management
    getTracks(userId) {
        const user = this.getUserById(userId);
        return user ? user.tracks || [] : [];
    }

    saveTracks(userId, tracks) {
        const user = this.getUserById(userId);
        if (user) {
            user.tracks = tracks;
            this.updateUser(userId, { tracks: user.tracks });
            return true;
        }
        return false;
    }

    removeTrack(userId, trackId) {
        const user = this.getUserById(userId);
        if (user && user.tracks) {
            user.tracks = user.tracks.filter(t => t.id !== trackId);
            this.updateUser(userId, { tracks: user.tracks });
            
            // Clean up blob
            if (window.trackBlobMap) {
                delete window.trackBlobMap[trackId];
            }
            return true;
        }
        return false;
    }

    clearTracks(userId) {
        const user = this.getUserById(userId);
        if (user) {
            const trackIds = (user.tracks || []).map(t => t.id);
            trackIds.forEach(id => {
                if (window.trackBlobMap) {
                    delete window.trackBlobMap[id];
                }
            });
            user.tracks = [];
            this.updateUser(userId, { tracks: [] });
            return true;
        }
        return false;
    }

    // Liked Tracks
    getLikedTracks(userId) {
        const user = this.getUserById(userId);
        return user ? user.likedTracks || [] : [];
    }

    toggleLikeTrack(userId, trackId) {
        const user = this.getUserById(userId);
        if (user) {
            if (!user.likedTracks) user.likedTracks = [];
            const index = user.likedTracks.indexOf(trackId);
            if (index > -1) {
                user.likedTracks.splice(index, 1);
            } else {
                user.likedTracks.push(trackId);
            }
            this.updateUser(userId, { likedTracks: user.likedTracks });
            return user.likedTracks.includes(trackId);
        }
        return false;
    }

    isTrackLiked(userId, trackId) {
        const user = this.getUserById(userId);
        return user && user.likedTracks ? user.likedTracks.includes(trackId) : false;
    }

    // Preferences
    getPreferences(userId) {
        const user = this.getUserById(userId);
        return user ? user.preferences : { volume: 70, loopEnabled: false };
    }

    updatePreferences(userId, preferences) {
        const user = this.getUserById(userId);
        if (user) {
            user.preferences = { ...user.preferences, ...preferences };
            this.updateUser(userId, { preferences: user.preferences });
            return user.preferences;
        }
        return null;
    }

    // Utility Methods
    generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    validateUsername(username) {
        if (username.length < 3) {
            return { valid: false, message: 'Username must be at least 3 characters' };
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
        }
        if (this.getUserByUsername(username)) {
            return { valid: false, message: 'Username already exists' };
        }
        return { valid: true };
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, message: 'Please enter a valid email' };
        }
        if (this.getUserByEmail(email)) {
            return { valid: false, message: 'Email already registered' };
        }
        return { valid: true };
    }

    validatePassword(password) {
        if (password.length < 6) {
            return { valid: false, message: 'Password must be at least 6 characters' };
        }
        return { valid: true };
    }

    // Data Persistence
    getData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : { users: [], currentUser: null };
        } catch (error) {
            console.error('Error reading storage:', error);
            return { users: [], currentUser: null };
        }
    }

    saveData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving storage:', error);
        }
    }

    getAllUsers() {
        const data = this.getData();
        return data.users;
    }

    deleteUser(userId) {
        const data = this.getData();
        const user = data.users.find(u => u.id === userId);
        if (user && user.tracks) {
            user.tracks.forEach(track => {
                if (window.trackBlobMap) {
                    delete window.trackBlobMap[track.id];
                }
            });
        }
        data.users = data.users.filter(u => u.id !== userId);
        if (data.currentUser === userId) {
            data.currentUser = null;
        }
        this.saveData(data);
    }

    // Playlist Management
    createPlaylist(userId, name, isPublic = false) {
        const user = this.getUserById(userId);
        if (user) {
            if (!user.playlists) user.playlists = [];
            const playlist = {
                id: this.generateId(),
                name: name,
                isPublic: isPublic,
                tracks: [],
                createdAt: new Date().toISOString(),
                description: ''
            };
            user.playlists.push(playlist);
            this.updateUser(userId, { playlists: user.playlists });
            return playlist;
        }
        return null;
    }

    getPlaylists(userId) {
        const user = this.getUserById(userId);
        return user ? user.playlists || [] : [];
    }

    getPlaylistById(userId, playlistId) {
        const user = this.getUserById(userId);
        if (user && user.playlists) {
            return user.playlists.find(p => p.id === playlistId);
        }
        return null;
    }

    updatePlaylist(userId, playlistId, updates) {
        const user = this.getUserById(userId);
        if (user && user.playlists) {
            const playlist = user.playlists.find(p => p.id === playlistId);
            if (playlist) {
                Object.assign(playlist, updates);
                this.updateUser(userId, { playlists: user.playlists });
                return playlist;
            }
        }
        return null;
    }

    deletePlaylist(userId, playlistId) {
        const user = this.getUserById(userId);
        if (user && user.playlists) {
            user.playlists = user.playlists.filter(p => p.id !== playlistId);
            this.updateUser(userId, { playlists: user.playlists });
            return true;
        }
        return false;
    }

    addTrackToPlaylist(userId, playlistId, track) {
        const user = this.getUserById(userId);
        if (user && user.playlists) {
            const playlist = user.playlists.find(p => p.id === playlistId);
            if (playlist) {
                if (!playlist.tracks) playlist.tracks = [];
                playlist.tracks.push(track);
                this.updateUser(userId, { playlists: user.playlists });
                return true;
            }
        }
        return false;
    }

    removeTrackFromPlaylist(userId, playlistId, trackId) {
        const user = this.getUserById(userId);
        if (user && user.playlists) {
            const playlist = user.playlists.find(p => p.id === playlistId);
            if (playlist && playlist.tracks) {
                playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
                this.updateUser(userId, { playlists: user.playlists });
                return true;
            }
        }
        return false;
    }

    // Profile Management
    updateProfile(userId, profileData) {
        const user = this.getUserById(userId);
        if (user) {
            user.profile = { ...user.profile, ...profileData };
            user.password = profileData.password || user.password;
            this.updateUser(userId, { profile: user.profile, password: user.password });
            return user.profile;
        }
        return null;
    }

    getProfile(userId) {
        const user = this.getUserById(userId);
        return user ? user.profile : null;
    }

    // Public Profile Search
    searchUsers(query) {
        const data = this.getData();
        return data.users.filter(u => 
            u.username.toLowerCase().includes(query.toLowerCase()) ||
            (u.profile && u.profile.displayName && u.profile.displayName.toLowerCase().includes(query.toLowerCase()))
        );
    }

    getPublicPlaylists(userId) {
        const user = this.getUserById(userId);
        if (user && user.playlists) {
            return user.playlists.filter(p => p.isPublic);
        }
        return [];
    }

    getAllPublicPlaylists() {
        const data = this.getData();
        const publicPlaylists = [];
        data.users.forEach(user => {
            if (user.playlists) {
                user.playlists.filter(p => p.isPublic).forEach(p => {
                    publicPlaylists.push({
                        ...p,
                        ownerUsername: user.username,
                        ownerProfile: user.profile,
                        ownerId: user.id
                    });
                });
            }
        });
        return publicPlaylists;
    }

    downloadTrack(userId, trackId, sourceUserId) {
        const user = this.getUserById(userId);
        if (user) {
            if (!user.downloadedTracks) user.downloadedTracks = [];
            user.downloadedTracks.push({
                trackId: trackId,
                sourceUserId: sourceUserId,
                downloadedAt: new Date().toISOString()
            });
            this.updateUser(userId, { downloadedTracks: user.downloadedTracks });
            return true;
        }
        return false;
    }

    getDownloadedTracks(userId) {
        const user = this.getUserById(userId);
        return user ? user.downloadedTracks || [] : [];
    }

    // Follow System
    followUser(userId, targetUserId) {
        const user = this.getUserById(userId);
        const targetUser = this.getUserById(targetUserId);
        if (user && targetUser) {
            if (!user.following) user.following = [];
            if (!targetUser.followers) targetUser.followers = [];
            
            if (!user.following.includes(targetUserId)) {
                user.following.push(targetUserId);
                targetUser.followers.push(userId);
                this.updateUser(userId, { following: user.following });
                this.updateUser(targetUserId, { followers: targetUser.followers });
                return true;
            }
        }
        return false;
    }

    unfollowUser(userId, targetUserId) {
        const user = this.getUserById(userId);
        const targetUser = this.getUserById(targetUserId);
        if (user && targetUser) {
            user.following = (user.following || []).filter(id => id !== targetUserId);
            targetUser.followers = (targetUser.followers || []).filter(id => id !== userId);
            this.updateUser(userId, { following: user.following });
            this.updateUser(targetUserId, { followers: targetUser.followers });
            return true;
        }
        return false;
    }

    isFollowing(userId, targetUserId) {
        const user = this.getUserById(userId);
        return user && user.following ? user.following.includes(targetUserId) : false;
    }

    getFollowers(userId) {
        const user = this.getUserById(userId);
        if (user && user.followers) {
            return user.followers.map(id => this.getUserById(id)).filter(u => u);
        }
        return [];
    }

    getFollowing(userId) {
        const user = this.getUserById(userId);
        if (user && user.following) {
            return user.following.map(id => this.getUserById(id)).filter(u => u);
        }
        return [];
    }
}

// Initialize global storage manager
const storageManager = new StorageManager();
