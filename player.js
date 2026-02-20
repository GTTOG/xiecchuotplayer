// Music Player - Spotify Style

class MusicPlayer {
    constructor() {
        this.currentUser = storageManager.getCurrentUser();
        if (!this.currentUser) return;

        // DOM Elements
        this.audioPlayer = document.getElementById('audioPlayer');
        this.fileInput = document.getElementById('fileInput');
        this.currentTrackDisplay = document.getElementById('currentTrack');
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.loopBtn = document.getElementById('loopBtn');
        this.likeBtn = document.getElementById('likeBtn');
        this.progressBar = document.getElementById('progressBar');
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.durationDisplay = document.getElementById('duration');
        this.volumeSlider = document.getElementById('volumeSlider');

        // View Elements
        this.views = {
            home: document.getElementById('homeView'),
            playlist: document.getElementById('playlistView'),
            liked: document.getElementById('likedView'),
            search: document.getElementById('searchView'),
            browse: document.getElementById('browseView'),
            profile: document.getElementById('profileView')
        };

        this.navItems = document.querySelectorAll('.nav-item');
        this.pageTitle = document.getElementById('pageTitle');

        // Initialize
        this.tracks = [];
        this.currentTrackIndex = -1;
        this.isPlaying = false;
        this.currentView = 'home';

        this.init();
    }

    init() {
        this.loadUserTracks();
        this.setupEventListeners();
        this.loadPreferences();
        this.renderHomePage();
    }

    loadUserTracks() {
        this.tracks = storageManager.getTracks(this.currentUser.id) || [];
    }

    setupEventListeners() {
        // File upload
        this.fileInput.addEventListener('change', () => this.handleFileUpload());
        
        // Player controls
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.prevTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.loopBtn.addEventListener('click', () => this.toggleLoop());
        this.likeBtn.addEventListener('click', () => this.toggleLike());

        // Audio events
        this.audioPlayer.addEventListener('ended', () => this.handleTrackEnd());
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateDuration());
        this.progressBar.addEventListener('input', (e) => this.seek(e.target.value));
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));

        // Navigation
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => this.switchView(e.target.closest('.nav-item').dataset.view));
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
            
            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                const isClickInsideSidebar = sidebar.contains(e.target);
                const isToggleBtn = sidebarToggle.contains(e.target);
                if (!isClickInsideSidebar && !isToggleBtn && sidebar.classList.contains('mobile-open')) {
                    sidebar.classList.remove('mobile-open');
                }
            });
        }

        // Drag and drop
        const uploadLabel = document.querySelector('.upload-label');
        if (uploadLabel) {
            uploadLabel.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadLabel.style.background = 'rgba(29, 185, 84, 0.2)';
            });
            uploadLabel.addEventListener('dragleave', () => {
                uploadLabel.style.background = '';
            });
            uploadLabel.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadLabel.style.background = '';
                this.fileInput.files = e.dataTransfer.files;
                this.handleFileUpload();
            });
        }
    }

    async handleFileUpload() {
        const files = this.fileInput.files;
        if (files.length === 0) return;

        let successCount = 0;
        let failCount = 0;

        for (let file of files) {
            if (!this.isValidAudioFile(file.name)) {
                notificationManager.error(`${file.name} is not a valid audio file`, 'Invalid File');
                failCount++;
                continue;
            }

            const track = await storageManager.saveTrackFile(this.currentUser.id, file);
            if (track) {
                this.tracks.push(track);
                successCount++;
            }
        }

        storageManager.saveTracks(this.currentUser.id, this.tracks);
        this.fileInput.value = '';
        
        if (successCount > 0) {
            notificationManager.success(`${successCount} song${successCount > 1 ? 's' : ''} uploaded successfully!`, 'Upload Complete');
        }
        
        this.renderHomePage();
        this.renderPlaylistView();
    }

    isValidAudioFile(filename) {
        const validExtensions = ['.mp3', '.mp4', '.wav', '.ogg', '.m4a', '.flac'];
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return validExtensions.includes(ext);
    }

    switchView(view) {
        // Update nav
        this.navItems.forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Update page title
        const titles = { 
            home: 'Home', 
            playlist: 'My Playlist', 
            liked: 'Liked Songs',
            search: 'Search',
            browse: 'Browse Public Playlists',
            profile: 'My Profile'
        };
        this.pageTitle.textContent = titles[view];

        // Hide all views
        Object.values(this.views).forEach(v => v.classList.remove('active'));
        const viewElement = document.getElementById(view + 'View');
        if (viewElement) {
            viewElement.classList.add('active');
        }

        this.currentView = view;

        // Render view
        if (view === 'playlist') this.renderPlaylistView();
        if (view === 'liked') this.renderLikedView();
        if (view === 'home') this.renderHomePage();
        if (view === 'search') this.renderSearchView();
        if (view === 'browse') this.renderBrowseView();
        if (view === 'profile') this.renderProfileView();
    }

    renderHomePage() {
        const recentTracks = document.getElementById('recentTracks');
        const totalSongs = document.getElementById('totalSongs');
        const totalDuration = document.getElementById('totalDuration');

        totalSongs.textContent = this.tracks.length;
        
        let totalDur = 0;
        const recent = [...this.tracks].reverse().slice(0, 5);
        
        recentTracks.innerHTML = recent.map((track, idx) => 
            this.createTrackElement(track, this.tracks.indexOf(track))
        ).join('');

        totalDuration.textContent = this.formatDuration(totalDur);

        // Add click listeners to recent tracks
        recentTracks.querySelectorAll('.track-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('track-action-btn')) {
                    const idx = parseInt(item.dataset.index);
                    this.playTrack(idx);
                }
            });
        });
    }

    renderPlaylistView() {
        const playlistTracks = document.getElementById('playlistTracks');
        const playlistCount = document.getElementById('playlistCount');

        playlistCount.textContent = `${this.tracks.length} ${this.tracks.length === 1 ? 'track' : 'tracks'}`;

        if (this.tracks.length === 0) {
            playlistTracks.innerHTML = '<div class="empty-message">No songs uploaded yet. Upload some music to get started!</div>';
            return;
        }

        playlistTracks.innerHTML = this.tracks.map((track, idx) => 
            this.createTrackElement(track, idx)
        ).join('');

        // Add event listeners
        playlistTracks.querySelectorAll('.track-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('track-action-btn')) {
                    const idx = parseInt(item.dataset.index);
                    this.playTrack(idx);
                }
            });
        });

        playlistTracks.querySelectorAll('.track-like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLikeAtIndex(parseInt(btn.dataset.index));
                this.renderPlaylistView();
            });
        });

        playlistTracks.querySelectorAll('.track-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeTrack(parseInt(btn.dataset.index));
            });
        });
    }

    renderLikedView() {
        const likedTracks = document.getElementById('likedTracks');
        const likedCount = document.getElementById('likedCount');

        const liked = this.tracks.filter(t => 
            storageManager.isTrackLiked(this.currentUser.id, t.id)
        );

        likedCount.textContent = `${liked.length} ${liked.length === 1 ? 'track' : 'tracks'}`;

        if (liked.length === 0) {
            likedTracks.innerHTML = '<div class="empty-message">No liked songs yet. Like some tracks to see them here!</div>';
            return;
        }

        likedTracks.innerHTML = liked.map((track) => {
            const idx = this.tracks.indexOf(track);
            return this.createTrackElement(track, idx, true);
        }).join('');

        likedTracks.querySelectorAll('.track-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('track-action-btn')) {
                    const idx = parseInt(item.dataset.index);
                    this.playTrack(idx);
                }
            });
        });

        likedTracks.querySelectorAll('.track-like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLikeAtIndex(parseInt(btn.dataset.index));
                this.renderLikedView();
            });
        });
    }

    createTrackElement(track, idx, isFromLiked = false) {
        const isActive = this.currentTrackIndex === idx;
        const isLiked = storageManager.isTrackLiked(this.currentUser.id, track.id);
        const trackNum = idx + 1;

        return `
            <div class="track-item ${isActive ? 'active' : ''}" data-index="${idx}">
                <span class="track-number">${trackNum}</span>
                <div class="track-info">
                    <div class="track-name">${track.name}</div>
                    <div class="track-artist">xiecchuot player</div>
                </div>
                <div class="track-actions">
                    <button class="track-action-btn track-like-btn ${isLiked ? 'liked' : ''}" data-index="${idx}" title="Like">
                        ${isLiked ? '❤️' : '🤍'}
                    </button>
                    <button class="track-action-btn track-remove-btn" data-index="${idx}" title="Remove">
                        🗑️
                    </button>
                </div>
                <span class="track-duration">0:00</span>
            </div>
        `;
    }

    playTrack(idx) {
        if (idx < 0 || idx >= this.tracks.length) return;

        this.currentTrackIndex = idx;
        const track = this.tracks[idx];
        const fileData = storageManager.getTrackBlob(track.id);

        if (fileData) {
            const blob = new Blob([fileData], { type: track.type });
            const url = URL.createObjectURL(blob);
            this.audioPlayer.src = url;
            this.currentTrackDisplay.textContent = track.name;
            this.updateTrackDisplay();
            this.play();
        }
    }

    togglePlay() {
        if (this.tracks.length === 0) {
            alert('Please upload some songs first');
            return;
        }

        if (this.currentTrackIndex === -1) {
            this.playTrack(0);
        } else if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        this.audioPlayer.play();
        this.isPlaying = true;
        this.playBtn.textContent = '⏸';
        this.updateTrackDisplay();
    }

    pause() {
        this.audioPlayer.pause();
        this.isPlaying = false;
        this.playBtn.textContent = '▶';
    }

    nextTrack() {
        if (this.tracks.length === 0) return;
        let idx = this.currentTrackIndex + 1;
        if (idx >= this.tracks.length) {
            if (this.loopBtn.classList.contains('active')) {
                idx = 0;
            } else {
                this.pause();
                return;
            }
        }
        this.playTrack(idx);
    }

    prevTrack() {
        if (this.tracks.length === 0) return;
        let idx = this.currentTrackIndex - 1;
        if (idx < 0) idx = 0;
        this.playTrack(idx);
    }

    toggleLoop() {
        this.loopBtn.classList.toggle('active');
        const loopEnabled = this.loopBtn.classList.contains('active');
        storageManager.updatePreferences(this.currentUser.id, { loopEnabled });
    }

    toggleLike() {
        if (this.currentTrackIndex === -1) return;
        this.toggleLikeAtIndex(this.currentTrackIndex);
    }

    toggleLikeAtIndex(idx) {
        const track = this.tracks[idx];
        const isNowLiked = storageManager.toggleLikeTrack(this.currentUser.id, track.id);
        this.likeBtn.textContent = isNowLiked ? '❤️' : '🤍';
        if (this.currentView === 'playlist') this.renderPlaylistView();
        if (this.currentView === 'liked') this.renderLikedView();
    }

    handleTrackEnd() {
        if (this.loopBtn.classList.contains('active')) {
            this.nextTrack();
        } else {
            if (this.currentTrackIndex < this.tracks.length - 1) {
                this.nextTrack();
            } else {
                this.pause();
            }
        }
    }

    updateTrackDisplay() {
        // Update active track in all views
        document.querySelectorAll('.track-item').forEach(item => {
            item.classList.remove('active');
        });
        const active = document.querySelector(`[data-index="${this.currentTrackIndex}"]`);
        if (active) active.classList.add('active');

        // Update like button
        if (this.currentTrackIndex !== -1) {
            const track = this.tracks[this.currentTrackIndex];
            const isLiked = storageManager.isTrackLiked(this.currentUser.id, track.id);
            this.likeBtn.textContent = isLiked ? '❤️' : '🤍';
        }
    }

    seek(value) {
        if (this.audioPlayer.duration) {
            this.audioPlayer.currentTime = (value / 100) * this.audioPlayer.duration;
        }
    }

    updateProgress() {
        if (this.audioPlayer.duration) {
            const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
            this.progressBar.value = progress;
            this.currentTimeDisplay.textContent = this.formatTime(this.audioPlayer.currentTime);
        }
    }

    updateDuration() {
        this.durationDisplay.textContent = this.formatTime(this.audioPlayer.duration);
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    }

    setVolume(value) {
        this.audioPlayer.volume = value / 100;
        storageManager.updatePreferences(this.currentUser.id, { volume: parseInt(value) });
    }

    loadPreferences() {
        const prefs = storageManager.getPreferences(this.currentUser.id);
        this.volumeSlider.value = prefs.volume || 70;
        this.audioPlayer.volume = prefs.volume / 100 || 0.7;

        if (prefs.loopEnabled) {
            this.loopBtn.classList.add('active');
        }
    }

    removeTrack(idx) {
        if (confirm('Remove this track?')) {
            const track = this.tracks[idx];
            this.tracks.splice(idx, 1);
            storageManager.removeTrack(this.currentUser.id, track.id);
            
            if (this.currentTrackIndex === idx) {
                this.pause();
                this.currentTrackIndex = -1;
            }

            this.renderPlaylistView();
            this.renderHomePage();
        }
    }

    // SEARCH VIEW
    renderSearchView() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const searchResults = document.getElementById('searchResults');

        if (!searchBtn.hasEventListener) {
            searchBtn.addEventListener('click', () => this.performSearch());
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
            searchBtn.hasEventListener = true;
        }

        // Show recommendations on initial load
        this.showSearchRecommendations();
    }

    showSearchRecommendations() {
        const searchResults = document.getElementById('searchResults');
        const allUsers = storageManager.getAllUsers().filter(u => u.id !== this.currentUser.id);
        
        // Get recommended users (limit to 5)
        const recommendedUsers = allUsers.slice(0, 5);
        
        // Get recommended songs from all users (limit to 5)
        const allTracks = [];
        allUsers.forEach(user => {
            if (user.tracks && user.tracks.length > 0) {
                user.tracks.forEach(track => {
                    allTracks.push({...track, uploadedBy: user.username, uploadedById: user.id});
                });
            }
        });
        const recommendedTracks = allTracks.slice(0, 5);

        let html = '<div class="search-recommendations">';
        
        // Recommended Users Section
        if (recommendedUsers.length > 0) {
            html += '<div class="recommendation-section"><h3>Recommended Users</h3>';
            html += '<div class="recommendations-list">' + recommendedUsers.map(user => `
                <div class="search-result-item" onclick="window.musicPlayer.showUserProfile('${user.id}')">
                    <div class="result-user">
                        <div class="result-avatar">${user.profile?.avatar || '👤'}</div>
                        <div class="result-info">
                            <div class="result-name">${user.profile?.displayName || user.username}</div>
                            <div class="result-username">@${user.username}</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                ${user.tracks?.length || 0} songs • ${user.followers?.length || 0} followers
                            </div>
                        </div>
                        <button class="result-action" onclick="event.stopPropagation(); window.musicPlayer.toggleFollowUser('${user.id}')">
                            ${storageManager.isFollowing(this.currentUser.id, user.id) ? 'Unfollow' : 'Follow'}
                        </button>
                    </div>
                </div>
            `).join('') + '</div></div>';
        }

        // Recommended Songs Section
        if (recommendedTracks.length > 0) {
            html += '<div class="recommendation-section"><h3>Recommended Songs</h3>';
            html += '<div class="recommendations-list">' + recommendedTracks.map(track => `
                <div class="search-result-item" onclick="window.musicPlayer.playTrackFromSearch('${track.id}', '${track.uploadedById}')">
                    <div class="result-track">
                        <div class="result-track-icon">🎵</div>
                        <div class="result-info">
                            <div class="result-name">${track.name || 'Unknown'}</div>
                            <div class="result-username">by ${track.uploadedBy}</div>
                        </div>
                        <button class="result-action" onclick="event.stopPropagation(); window.musicPlayer.playTrackFromSearch('${track.id}', '${track.uploadedById}')">
                            ▶ Play
                        </button>
                    </div>
                </div>
            `).join('') + '</div></div>';
        }

        html += '</div>';
        searchResults.innerHTML = html;
    }

    playTrackFromSearch(trackId, userId) {
        const user = storageManager.getAllUsers().find(u => u.id === userId);
        if (!user || !user.tracks) return;
        
        const track = user.tracks.find(t => t.id === trackId);
        if (!track) return;

        // Load and play the track
        const blob = window.trackBlobMap?.[track.id];
        if (blob) {
            this.audioPlayer.src = URL.createObjectURL(blob);
            this.currentTrackDisplay.textContent = track.name || 'Unknown';
            this.audioPlayer.play();
            this.isPlaying = true;
            this.playBtn.textContent = '⏸';
        }
    }

    performSearch() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput.value.trim();
        if (!query) return;

        const users = storageManager.searchUsers(query);
        const searchResults = document.getElementById('searchResults');

        if (users.length === 0) {
            searchResults.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No users found</p>';
            return;
        }

        searchResults.innerHTML = users.filter(u => u.id !== this.currentUser.id).map(user => `
            <div class="search-result-item" onclick="window.musicPlayer.showUserProfile('${user.id}')">
                <div class="result-user">
                    <div class="result-avatar">${user.profile?.avatar || '👤'}</div>
                    <div class="result-info">
                        <div class="result-name">${user.profile?.displayName || user.username}</div>
                        <div class="result-username">@${user.username}</div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                            ${user.tracks?.length || 0} songs • ${user.followers?.length || 0} followers
                        </div>
                    </div>
                    <button class="result-action" onclick="event.stopPropagation(); window.musicPlayer.toggleFollowUser('${user.id}')">
                        ${storageManager.isFollowing(this.currentUser.id, user.id) ? 'Unfollow' : 'Follow'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    // BROWSE VIEW
    renderBrowseView() {
        const browseResults = document.getElementById('browseResults');
        const publicPlaylists = storageManager.getAllPublicPlaylists();

        if (publicPlaylists.length === 0) {
            browseResults.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">No public playlists yet</p>';
            return;
        }

        browseResults.innerHTML = publicPlaylists.map(playlist => `
            <div class="playlist-card" onclick="window.musicPlayer.showPlaylistDetails('${playlist.ownerId}', '${playlist.id}')">
                <div class="playlist-cover">🎵</div>
                <div class="playlist-name">${playlist.name}</div>
                <div class="playlist-owner">by ${playlist.ownerProfile?.displayName || playlist.ownerUsername}</div>
                <div class="playlist-info">${playlist.tracks?.length || 0} songs</div>
            </div>
        `).join('');
    }

    // PROFILE VIEW
    renderProfileView() {
        const user = this.currentUser;
        const profile = user.profile || {};

        document.getElementById('profileAvatar').textContent = profile.avatar || '👤';
        document.getElementById('profileDisplayName').textContent = profile.displayName || user.username;
        document.getElementById('profileUsername').textContent = '@' + user.username;
        document.getElementById('profileBio').textContent = profile.bio || 'No bio yet';
        document.getElementById('profileSongsCount').textContent = user.tracks?.length || 0;
        document.getElementById('profileFollowersCount').textContent = user.followers?.length || 0;
        document.getElementById('profileFollowingCount').textContent = user.following?.length || 0;

        const socialLinks = document.getElementById('socialLinks');
        const social = profile.socialMedia || {};
        let socialHTML = '';
        
        if (social.twitter) socialHTML += `<a href="https://twitter.com/${social.twitter}" target="_blank" class="social-link">𝕏 ${social.twitter}</a>`;
        if (social.instagram) socialHTML += `<a href="https://instagram.com/${social.instagram}" target="_blank" class="social-link">📷 ${social.instagram}</a>`;
        if (social.youtube) socialHTML += `<a href="https://youtube.com/@${social.youtube}" target="_blank" class="social-link">▶️ ${social.youtube}</a>`;
        
        socialLinks.innerHTML = socialHTML || '<p style="color: var(--text-secondary);">No social links added</p>';

        const editBtn = document.getElementById('editProfileBtn');
        if (!editBtn.hasListener) {
            editBtn.addEventListener('click', () => this.showProfileEditModal());
            editBtn.hasListener = true;
        }
    }

    showProfileEditModal() {
        const profile = this.currentUser.profile || {};
        const social = profile.socialMedia || {};

        document.getElementById('editDisplayName').value = profile.displayName || '';
        document.getElementById('editBio').value = profile.bio || '';
        document.getElementById('editAvatar').value = profile.avatar || '👤';
        document.getElementById('editTwitter').value = social.twitter || '';
        document.getElementById('editInstagram').value = social.instagram || '';
        document.getElementById('editYoutube').value = social.youtube || '';
        document.getElementById('editPassword').value = '';

        const modal = document.getElementById('profileModal');
        const closeBtn = document.getElementById('closeProfileModal');
        const cancelBtn = document.getElementById('cancelProfileEdit');
        const form = document.getElementById('profileForm');

        const showModal = () => {
            modal.style.display = 'flex';
            modal.classList.add('active');
        };

        const hideModal = () => {
            modal.style.display = 'none';
            modal.classList.remove('active');
        };

        closeBtn.onclick = hideModal;
        cancelBtn.onclick = hideModal;

        form.onsubmit = (e) => {
            e.preventDefault();
            const newProfile = {
                displayName: document.getElementById('editDisplayName').value,
                bio: document.getElementById('editBio').value,
                avatar: document.getElementById('editAvatar').value || '👤',
                socialMedia: {
                    twitter: document.getElementById('editTwitter').value,
                    instagram: document.getElementById('editInstagram').value,
                    youtube: document.getElementById('editYoutube').value
                }
            };

            const newPassword = document.getElementById('editPassword').value;
            if (newPassword && newPassword.length >= 6) {
                newProfile.password = storageManager.hashPassword(newPassword);
            }

            storageManager.updateProfile(this.currentUser.id, newProfile);
            this.currentUser = storageManager.getCurrentUser();
            alert('Profile updated successfully!');
            hideModal();
            this.renderProfileView();
        };

        showModal();
    }

    // USER PROFILE MODAL
    showUserProfile(userId) {
        const user = storageManager.getUserById(userId);
        if (!user) return;

        const profile = user.profile || {};
        const modal = document.getElementById('userProfileModal');
        const closeBtn = document.getElementById('closeUserProfileModal');

        document.getElementById('upAvatar').textContent = profile.avatar || '👤';
        document.getElementById('upDisplayName').textContent = profile.displayName || user.username;
        document.getElementById('upUsername').textContent = '@' + user.username;
        document.getElementById('upBio').textContent = profile.bio || 'No bio';
        document.getElementById('upSongsCount').textContent = user.tracks?.length || 0;
        document.getElementById('upFollowersCount').textContent = user.followers?.length || 0;

        const social = profile.socialMedia || {};
        const socialLinks = document.getElementById('upSocialLinks');
        let socialHTML = '';
        
        if (social.twitter) socialHTML += `<a href="https://twitter.com/${social.twitter}" target="_blank">𝕏 ${social.twitter}</a>`;
        if (social.instagram) socialHTML += `<a href="https://instagram.com/${social.instagram}" target="_blank">📷 ${social.instagram}</a>`;
        if (social.youtube) socialHTML += `<a href="https://youtube.com/@${social.youtube}" target="_blank">▶️ ${social.youtube}</a>`;
        
        socialLinks.innerHTML = socialHTML;

        const followBtn = document.getElementById('followBtn');
        const isFollowing = storageManager.isFollowing(this.currentUser.id, userId);
        followBtn.textContent = isFollowing ? 'Unfollow' : 'Follow';
        followBtn.onclick = () => this.toggleFollowUser(userId);

        const playlists = storageManager.getPublicPlaylists(userId);
        const playlistsContainer = document.getElementById('userPublicPlaylists');
        playlistsContainer.innerHTML = playlists.map(p => `
            <div class="user-playlist-item" onclick="window.musicPlayer.showPlaylistDetails('${userId}', '${p.id}')">
                <div class="user-playlist-name">${p.name}</div>
                <div class="user-playlist-tracks">${p.tracks?.length || 0} songs</div>
            </div>
        `).join('');

        closeBtn.onclick = () => {
            modal.style.display = 'none';
            modal.classList.remove('active');
        };

        modal.style.display = 'flex';
        modal.classList.add('active');
    }

    toggleFollowUser(userId) {
        const isFollowing = storageManager.isFollowing(this.currentUser.id, userId);
        if (isFollowing) {
            storageManager.unfollowUser(this.currentUser.id, userId);
        } else {
            storageManager.followUser(this.currentUser.id, userId);
        }
        
        const followBtn = document.getElementById('followBtn');
        if (followBtn) {
            followBtn.textContent = storageManager.isFollowing(this.currentUser.id, userId) ? 'Unfollow' : 'Follow';
        }
    }

    // PLAYLIST DETAILS
    showPlaylistDetails(ownerId, playlistId) {
        const owner = storageManager.getUserById(ownerId);
        const playlist = storageManager.getPlaylistById(ownerId, playlistId);

        if (!owner || !playlist) return;

        const tracks = playlist.tracks || [];
        let html = `
            <div style="margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                    <div style="font-size: 48px;">🎵</div>
                    <div>
                        <h2>${playlist.name}</h2>
                        <p style="color: var(--text-secondary);">by ${owner.profile?.displayName || owner.username}</p>
                        <p style="color: var(--text-subdued); font-size: 12px;">${tracks.length} songs</p>
                    </div>
                </div>
        `;

        if (playlist.description) {
            html += `<p style="color: var(--text-secondary); margin-bottom: 12px;">${playlist.description}</p>`;
        }

        html += `</div><div style="max-height: 400px; overflow-y: auto;">`;

        if (tracks.length === 0) {
            html += '<p style="color: var(--text-secondary);">No tracks in this playlist</p>';
        } else {
            html += tracks.map((track, idx) => {
                const hasVideo = track.type && track.type.includes('video');
                const downloaded = storageManager.getDownloadedTracks(this.currentUser.id)
                    .some(dt => dt.trackId === track.id && dt.sourceUserId === ownerId);
                
                return `
                    <div class="track-item" style="cursor: pointer; padding: 12px; margin-bottom: 8px; background: var(--bg-tertiary); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <div class="track-name">${track.name}${hasVideo ? ' 🎥' : ''}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">${owner.profile?.displayName || owner.username}</div>
                        </div>
                        <button class="download-btn ${downloaded ? 'downloaded' : ''}" onclick="event.stopPropagation(); window.musicPlayer.downloadTrack('${ownerId}', '${track.id}', '${owner.username}')">
                            ${downloaded ? '✓ Downloaded' : 'Download'}
                        </button>
                        ${hasVideo ? `<button style="margin-left: 8px; padding: 6px 12px; background: var(--primary); color: var(--bg-main); border: none; border-radius: 4px; cursor: pointer;" onclick="event.stopPropagation(); window.musicPlayer.playVideo('${ownerId}', '${track.id}')">▶️ Video</button>` : ''}
                    </div>
                `;
            }).join('');
        }

        html += '</div>';

        const container = document.createElement('div');
        container.innerHTML = html;
        
        alert('Playlist: ' + playlist.name + '\n\nOpen the browser console to see playlist details.');
        console.log('Playlist Details:', { owner, playlist, tracks });
    }

    // DOWNLOAD TRACK
    downloadTrack(sourceUserId, trackId, sourceUsername) {
        const sourceUser = storageManager.getUserById(sourceUserId);
        const track = sourceUser?.tracks?.find(t => t.id === trackId);

        if (!track) {
            alert('Track not found');
            return;
        }

        const fileData = storageManager.getTrackBlob(trackId);
        if (!fileData) {
            alert('File data not found');
            return;
        }

        // Create a copy for current user
        const newTrack = { ...track, id: storageManager.generateId() };
        window.trackBlobMap[newTrack.id] = fileData;

        this.tracks.push(newTrack);
        storageManager.saveTracks(this.currentUser.id, this.tracks);
        storageManager.downloadTrack(this.currentUser.id, trackId, sourceUserId);

        alert(`Downloaded "${track.name}" from ${sourceUsername}!`);
        this.renderPlaylistView();
    }

    // VIDEO PLAYER
    playVideo(sourceUserId, trackId) {
        const sourceUser = storageManager.getUserById(sourceUserId);
        const track = sourceUser?.tracks?.find(t => t.id === trackId);

        if (!track || !track.type.includes('video')) {
            alert('This is not a video file');
            return;
        }

        const fileData = storageManager.getTrackBlob(trackId);
        if (!fileData) {
            alert('File not found');
            return;
        }

        const blob = new Blob([fileData], { type: track.type });
        const url = URL.createObjectURL(blob);

        const videoPlayer = document.getElementById('videoPlayer');
        const videoTitle = document.getElementById('videoTitle');
        const modal = document.getElementById('videoModal');
        const closeBtn = document.getElementById('closeVideoModal');

        videoTitle.textContent = track.name;
        videoPlayer.src = url;
        
        modal.style.display = 'flex';
        modal.classList.add('active');

        closeBtn.onclick = () => {
            modal.style.display = 'none';
            modal.classList.remove('active');
            videoPlayer.pause();
            URL.revokeObjectURL(url);
        };
    }
}

// Initialize player
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (storageManager.getCurrentUser()) {
            window.musicPlayer = new MusicPlayer();
        }
    }, 200);
});
