document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://localhost:4000/api';
    
    const currentUserId = String(localStorage.getItem('twitterCloneUserId'));
    if (!currentUserId) {
        alert("Vous devez être connecté pour voir un profil.");
        window.location.href = 'index.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const profileUserId = params.get('id');

    if (!profileUserId) {
        document.body.innerHTML = '<h1>Erreur : ID utilisateur manquant.</h1>';
        return;
    }
    
    const whoToFollowList = document.getElementById('who-to-follow-list');

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " a";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " j";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " min";
        return Math.floor(seconds) + " s";
    };

    const formatDateJoined = (dateString) => {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long' };
        return `A rejoint en ${date.toLocaleDateString('fr-FR', options)}`;
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
        }
    };
    
    const renderWhoToFollow = (allUsers) => {
        const suggestions = allUsers.filter(user => 
            String(user.id) !== currentUserId && 
            String(user.id) !== profileUserId
        );
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

    const displayUserProfile = (user) => {
        document.title = `${user.name} (@${user.username}) / X`;
        document.getElementById('header-profile-name').textContent = user.name;
        document.getElementById('profile-avatar').style.backgroundImage = `url('${user.profilePicture}')`;
        document.getElementById('details-profile-name').textContent = user.name;
        document.getElementById('details-profile-username').textContent = `@${user.username}`;
        document.getElementById('details-profile-bio').textContent = user.bio || "Ce compte n'a pas encore de bio.";
        const metaContainer = document.getElementById('details-profile-meta');
        metaContainer.innerHTML = '';
        if (user.location) metaContainer.innerHTML += `<div class="meta-item"><svg viewBox="0 0 24 24"><path d="M12 7c-1.93 0-3.5 1.57-3.5 3.5S10.07 14 12 14s3.5-1.57 3.5-3.5S13.93 7 12 7zm0 5c-.827 0-1.5-.673-1.5-1.5S11.173 9 12 9s1.5.673 1.5 1.5S12.827 12 12 12zm0-10c-4.687 0-8.5 3.813-8.5 8.5 0 5.967 7.621 11.116 7.945 11.332l.555.37.555-.37C12.379 21.116 20 15.967 20 10.5 20 5.813 16.187 2 12 2zm0 17.77c-1.665-1.241-6.5-5.196-6.5-9.27C5.5 6.916 8.416 4 12 4s6.5 2.916 6.5 6.5c0 4.074-4.835 8.029-6.5 9.27z"/></svg><span>${user.location}</span></div>`;
        if (user.website) metaContainer.innerHTML += `<div class="meta-item"><svg viewBox="0 0 24 24"><path d="M18.36 5.64c-1.95-1.96-5.11-1.96-7.07 0L9.88 7.05 8.46 5.64c-1.95-1.96-5.11-1.96-7.07 0-1.96 1.95-1.96 5.11 0 7.07l2.83 2.83c.78.78 2.05.78 2.83 0 .78-.78.78-2.05 0-2.83L5.64 11.3c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L8.46 11.3c.78.78 2.05.78 2.83 0L12.7 9.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41L12.7 12.7c-.78.78-.78 2.05 0 2.83.78.78 2.05.78 2.83 0l2.83-2.83c1.96-1.96 1.96-5.12 0-7.07z"/></svg><a href="${user.website}" target="_blank" rel="noopener noreferrer">${user.website.replace(/https?:\/\//, '')}</a></div>`;
        metaContainer.innerHTML += `<div class="meta-item"><svg viewBox="0 0 24 24"><path d="M7 4V2h-1c-.553 0-1 .447-1 1s.447 1 1 1h1zm-1 4h2V6H6v2zm12-5.5c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm0 1c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5.5zm-6.5-3.5c-5.514 0-10 4.486-10 10s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/></svg><span>${formatDateJoined(user.createdAt)}</span></div>`;
        document.getElementById('following-count').textContent = user.following;
        document.getElementById('followers-count').textContent = user.followers;
    };
    
    const displayUserTweets = (tweets, author) => {
        const tweetsContainer = document.getElementById('tweets-section');
        tweetsContainer.innerHTML = '';
        document.getElementById('header-tweets-count').textContent = `${tweets.length} Tweet${tweets.length > 1 ? 's' : ''}`;
        if (tweets.length === 0) {
            tweetsContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: #71767b;">Cet utilisateur n\'a pas encore tweeté.</p>';
            return;
        }
        tweets.forEach(tweet => {
            const tweetEl = document.createElement('div');
            tweetEl.className = 'tweet';
            const likedBy = tweet.likedBy || [];
            const isLikedByCurrentUser = likedBy.includes(currentUserId);
            const likedClass = isLikedByCurrentUser ? 'liked' : '';
            const likeCount = likedBy.length;
            
            const deleteButtonHTML = profileUserId === currentUserId
                ? `<button class="delete-btn" data-tweet-id="${tweet.id}" title="Supprimer le tweet">×</button>`
                : '';
            
            tweetEl.innerHTML = `
                <div class="tweet-avatar" style="background-image: url('${author.profilePicture}')"></div>
                <div class="tweet-body">
                    <div class="tweet-header">
                        <span class="tweet-author">${author.name}</span>
                        <span class="tweet-username">@${author.username}</span><span class="tweet-username">·</span>
                        <span class="tweet-date">${formatTimeAgo(tweet.createdAt)}</span>
                    </div>
                    ${deleteButtonHTML}
                    <div class="tweet-content">${tweet.content}</div>
                    ${tweet.media && tweet.media.length > 0 ? `<div class="tweet-media"><img src="${tweet.media[0].url}" class="tweet-image"></div>` : ''}
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
            tweetsContainer.appendChild(tweetEl);
        });
    };

    try {
        const [userResponse, tweetsResponse, allUsersResponse] = await Promise.all([
            fetch(`${API_URL}/users/${profileUserId}`),
            fetch(`${API_URL}/tweets?userId=${profileUserId}&_sort=createdAt&_order=desc`),
            fetch(`${API_URL}/users`)
        ]);

        if (!userResponse.ok) throw new Error('Utilisateur non trouvé');
        
        const profileUser = await userResponse.json();
        const tweets = await tweetsResponse.json();
        const allUsers = await allUsersResponse.json();
        
        displayUserProfile(profileUser);
        displayUserTweets(tweets, profileUser);
        renderWhoToFollow(allUsers);

        const tweetsContainer = document.getElementById('tweets-section');
        tweetsContainer.addEventListener('click', async (e) => {
            const likeBtn = e.target.closest('.like-btn');
            if (likeBtn) {
                e.preventDefault();
                handleLikeClick(likeBtn);
            }

            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                e.preventDefault();
                const tweetId = deleteBtn.dataset.tweetId;
                if (confirm("Voulez-vous vraiment supprimer ce tweet ?")) {
                    try {
                        const response = await fetch(`${API_URL}/tweets/${tweetId}`, { method: 'DELETE' });
                        if (!response.ok) throw new Error("La suppression a échoué.");
                        
                        deleteBtn.closest('.tweet').remove();
                        
                        const countEl = document.getElementById('header-tweets-count');
                        const currentCountText = countEl.textContent.split(' ')[0];
                        const currentCount = parseInt(currentCountText, 10);
                        if (!isNaN(currentCount)) {
                            const newCount = currentCount - 1;
                            countEl.textContent = `${newCount} Tweet${newCount !== 1 ? 's' : ''}`;
                        }

                    } catch (error) {
                        console.error("Erreur lors de la suppression du tweet:", error);
                        alert("Impossible de supprimer le tweet.");
                    }
                }
            }
        });
    } catch (error) {
        console.error("Erreur lors du chargement de la page de profil:", error);
        document.querySelector('.main-content').innerHTML = `<h1>Profil non trouvé</h1><p>${error.message}</p>`;
    }
});