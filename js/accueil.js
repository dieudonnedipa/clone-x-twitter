document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://localhost:4000/api';
    
    const currentUserId = String(localStorage.getItem('twitterCloneUserId'));
    if (!currentUserId) {
        alert("Vous n'êtes pas connecté. Redirection vers la page de connexion.");
        window.location.href = 'index.html';
        return;
    }

    const feedContainer = document.getElementById('feed');
    const composeForm = document.getElementById('compose-form');
    const composeTextarea = document.getElementById('composeTextarea');
    const composeSubmitBtn = document.getElementById('composeSubmit');
    const composeAvatar = document.getElementById('compose-avatar');
    const menuAvatar = document.getElementById('menu-avatar');
    const menuUserName = document.getElementById('menu-user-name');
    const menuUserUsername = document.getElementById('menu-user-username');
    const profileLink = document.getElementById('profile-link');
    const userProfileMenu = document.getElementById('user-profile-menu');
    const logoutBtn = document.getElementById('logoutBtn');
    const whoToFollowList = document.getElementById('who-to-follow-list');

    let usersMap = new Map();

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return Math.floor(seconds) + " s";
        let interval = seconds / 60;
        if (interval < 60) return Math.floor(interval) + " min";
        interval = seconds / 3600;
        if (interval < 24) return Math.floor(interval) + " h";
        interval = seconds / 86400;
        if (interval < 30) return Math.floor(interval) + " j";
        interval = seconds / 2592000;
        if (interval < 12) return Math.floor(interval) + " mois";
        return Math.floor(seconds / 31536000) + " a";
    };

    const formatViews = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace(/\.0$/, '') + ' M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + ' k';
        }
        return num;
    };

    const createTweetElement = (tweet, author) => {
        const tweetElement = document.createElement('div');
        tweetElement.classList.add('tweet');
        tweetElement.setAttribute('data-tweet-id', tweet.id);
        const authorLink = `profile-user-x.html?id=${author.id}`;

        const isLikedByCurrentUser = tweet.likedBy.includes(currentUserId);
        const likedClass = isLikedByCurrentUser ? 'liked' : '';
        const likeCount = tweet.likedBy.length;
        
        tweetElement.innerHTML = `
            <a href="${authorLink}"><div class="tweet-avatar" style="background-image: url('${author.profilePicture}')"></div></a>
            <div class="tweet-body">
                <div class="tweet-header">
                    <a href="${authorLink}" class="tweet-author">${author.name}</a>
                    <span class="tweet-username">@${author.username}</span>
                    <span class="tweet-username">·</span>
                    <span class="tweet-time">${formatTimeAgo(tweet.createdAt)}</span>
                    ${tweet.userId == currentUserId ? `<button class="delete-btn" data-tweet-id="${tweet.id}" title="Supprimer le tweet">×</button>` : ''}
                </div>
                <div class="tweet-text">${tweet.content}</div>
                ${(tweet.media && tweet.media.length > 0) ? `<div class="tweet-media"><img src="${tweet.media[0].url}" class="tweet-image"></div>` : ''}
                <div class="tweet-actions">
                    <button class="tweet-action reply-btn" data-tweet-id="${tweet.id}"><svg viewBox="0 0 24 24"><path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828c0 .108.044.286.12.403.142.225.384.347.632.347.138 0 .277-.038.402-.118.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.795-7.8-7.795zm-1.486 16.245v-3.844c-3.25-.18-5.782-2.634-5.782-5.94 0-3.193 2.552-5.743 5.743-5.743h4.146c3.193 0 5.743 2.55 5.743 5.743s-2.55 5.743-5.743 5.743h-2.12z"/></svg><span>${(tweet.replies || []).length}</span></button>
                    <button class="tweet-action retweet-btn" data-tweet-id="${tweet.id}"><svg viewBox="0 0 24 24"><path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294-.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zM.23 8.33c.292.293.767.293 1.06 0l2.22-2.22V16.35c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-5.85c-1.24 0-2.25-1.01-2.25-2.25V5.86l2.22 2.22c.293.293.768.293 1.06 0s.294-.768 0-1.06l-3.5-3.5c-.145-.147-.337.22-.53-.22s.383-.072.53-.22l-3.5 3.5c-.294.292-.294-.767 0-1.06z"/></svg><span>${tweet.retweets || 0}</span></button>
                    <button class="tweet-action like-btn ${likedClass}" data-tweet-id="${tweet.id}"><svg viewBox="0 0 24 24"><path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.45 13.11-10.037 13.157H12zM7.354 4.225c-2.08 0-3.903 1.988-3.903 4.255 0 5.74 6.036 11.52 8.55 11.766 2.512-.246 8.548-6.025 8.548-11.766 0-2.267-1.823-4.255-3.902-4.255-2.528 0-3.94 2.936-3.952 2.96-.23.562-1.156.562-1.387 0-.014-.023-1.425-2.96-3.954-2.96z"></path></svg><span class="like-count">${likeCount}</span></button>
                    <button class="tweet-action views-btn" data-tweet-id="${tweet.id}"><svg viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0V13.5h2V21h-2z"/></svg><span>${formatViews(tweet.views || 0)}</span></button>
                    <button class="tweet-action bookmark-btn" data-tweet-id="${tweet.id}">
                        <svg viewBox="0 0 24 24"><path d="M4 3h16c.55 0 1 .45 1 1v16.5l-8.5-3.5-8.5 3.5V4c0-.55.45-1 1-1zm2 2v12.22l6.5-2.7 6.5 2.7V5H6z"/></svg>
                    </button>
                    <button class="tweet-action share-btn" data-tweet-id="${tweet.id}">
                        <svg viewBox="0 0 24 24"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15v4c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-4H1v4c0 2.21 1.79 4 4 4h14c2.21 0 4-1.79 4-4v-4h-2z"/></svg>
                    </button>
                </div>
            </div>`;
        return tweetElement;
    };
    
    const renderWhoToFollow = (allUsers) => {
        const suggestions = allUsers.filter(user => String(user.id) !== currentUserId);
        const randomSuggestions = suggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
        whoToFollowList.innerHTML = '';

        randomSuggestions.forEach(user => {
            const suggestionEl = document.createElement('div');
            suggestionEl.className = 'follow-suggestion';
            const userProfileUrl = `profile-user-x.html?id=${user.id}`;
            
            suggestionEl.innerHTML = `
                <a href="${userProfileUrl}" class="suggestion-link">
                    <div class="suggestion-avatar" style="background-image: url('${user.profilePicture}')"></div>
                    <div class="suggestion-user-info">
                        <div class="suggestion-user-name">${user.name}</div>
                        <div class="suggestion-user-username">@${user.username}</div>
                    </div>
                </a>
                <button class="suggestion-follow-btn">Suivre</button>
            `;
            whoToFollowList.appendChild(suggestionEl);
        });
    };
    
    const handleLikeClick = async (likeBtn) => {
        const tweetId = likeBtn.dataset.tweetId;
        const likeCountSpan = likeBtn.querySelector('.like-count');
        try {
            const response = await fetch(`${API_URL}/tweets/${tweetId}`);
            if (!response.ok) throw new Error("Tweet non trouvé");
            const tweet = await response.json();
            const likedBy = tweet.likedBy || [];
            const isLikedByCurrentUser = likedBy.includes(currentUserId);
            let newLikedBy;
            if (isLikedByCurrentUser) {
                newLikedBy = likedBy.filter(id => id !== currentUserId);
                likeBtn.classList.remove('liked');
            } else {
                newLikedBy = [...likedBy, currentUserId];
                likeBtn.classList.add('liked');
            }
            likeCountSpan.textContent = newLikedBy.length;
            await fetch(`${API_URL}/tweets/${tweetId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ likedBy: newLikedBy })
            });
        } catch (error) {
            console.error("Erreur lors de la mise à jour du like:", error);
            alert("Une erreur est survenue. Veuillez réessayer.");
            loadFeed();
        }
    };

    const loadFeed = async () => {
        feedContainer.innerHTML = '<p style="padding:1rem; text-align:center;">Chargement des tweets...</p>';
        try {
            const usersResponse = await fetch(`${API_URL}/users`);
            const users = await usersResponse.json();
            usersMap.clear();
            users.forEach(user => usersMap.set(String(user.id), user));

            renderWhoToFollow(users);

            const tweetsResponse = await fetch(`${API_URL}/tweets?_sort=createdAt&_order=desc`);
            const tweets = await tweetsResponse.json();
            feedContainer.innerHTML = ''; 

            if (tweets.length === 0) {
                feedContainer.innerHTML = '<p style="padding:1rem; text-align:center;">Aucun tweet à afficher pour le moment.</p>';
                return;
            }
            
            tweets.forEach(tweet => {
                if (!tweet.likedBy) tweet.likedBy = [];
                const author = usersMap.get(String(tweet.userId));
                if (author) {
                    const tweetEl = createTweetElement(tweet, author);
                    feedContainer.appendChild(tweetEl);
                } else {
                    console.warn(`Auteur non trouvé pour le tweet ID: ${tweet.id}. Le tweet ne sera pas affiché.`);
                }
            });
        } catch (error) {
            console.error('Erreur lors du chargement du feed:', error);
            feedContainer.innerHTML = '<p style="padding:1rem; color:red; text-align:center;">Impossible de charger les tweets. Vérifiez la console.</p>';
        }
    };
    
    const setupCurrentUser = async () => {
        try {
            const response = await fetch(`${API_URL}/users/${currentUserId}`);
            if (!response.ok) throw new Error("Utilisateur connecté non trouvé");
            const user = await response.json();
            const profilePageUrl = `profile-user-x.html?id=${user.id}`;
            composeAvatar.style.backgroundImage = `url('${user.profilePicture}')`;
            menuAvatar.style.backgroundImage = `url('${user.profilePicture}')`;
            menuUserName.textContent = user.name;
            menuUserUsername.textContent = `@${user.username}`;
            profileLink.href = profilePageUrl;
            userProfileMenu.style.cursor = 'pointer';
            userProfileMenu.addEventListener('click', () => { window.location.href = profilePageUrl; });
        } catch(error) {
             console.error("Erreur critique:", error.message);
             localStorage.removeItem('twitterCloneUserId');
             window.location.href = 'index.html';
        }
    };

    composeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = composeTextarea.value.trim();
        if (!content) return;
        composeSubmitBtn.disabled = true;
        composeSubmitBtn.textContent = 'Envoi...';

        const newTweet = { 
            id: String(Date.now()), 
            userId: currentUserId, 
            content, 
            media: [], 
            likedBy: [],
            retweets: 0, 
            replies: [], 
            createdAt: new Date().toISOString(), 
            replyTo: null,
            views: 0
        };
        try {
            const response = await fetch(`${API_URL}/tweets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTweet) });
            if (!response.ok) throw new Error('Erreur de publication');
            const author = usersMap.get(String(newTweet.userId));
            if (author) {
                const tweetEl = createTweetElement(newTweet, author);
                feedContainer.prepend(tweetEl);
            }
            composeTextarea.value = '';
            composeTextarea.dispatchEvent(new Event('input'));
        } catch (error) { 
            console.error(error); 
        } finally {
            composeSubmitBtn.textContent = 'Tweeter';
        }
    });

    composeTextarea.addEventListener('input', () => { composeSubmitBtn.disabled = composeTextarea.value.trim().length === 0; });

    feedContainer.addEventListener('click', async (e) => {
        const target = e.target;
        const likeBtn = target.closest('.like-btn');
        if (likeBtn) {
            e.preventDefault();
            handleLikeClick(likeBtn);
        }

        const deleteBtn = target.closest('.delete-btn');
        if (deleteBtn) {
            e.preventDefault();
            const tweetId = deleteBtn.dataset.tweetId;
            if (confirm("Voulez-vous vraiment supprimer ce tweet ?")) {
                try {
                    await fetch(`${API_URL}/tweets/${tweetId}`, { method: 'DELETE' });
                    deleteBtn.closest('.tweet').remove();
                } catch (error) { alert("Impossible de supprimer le tweet."); }
            }
        }
    });
    
    logoutBtn.addEventListener('click', () => {
        if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
            localStorage.removeItem('twitterCloneUserId');
            window.location.href = 'index.html';
        }
    });

    await setupCurrentUser();
    await loadFeed();
});