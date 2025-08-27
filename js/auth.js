document.addEventListener('DOMContentLoaded', () => {

    const API_URL = 'http://localhost:4000/api';

    const loginBtn = document.getElementById('loginBtn');
    const createAccountBtn = document.getElementById('createAccountBtn');
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const passwordModal = document.getElementById('passwordModal');
    
    const closeLoginModalBtn = document.getElementById('closeModal');
    const closeSignupModalBtn = document.getElementById('closeSignupModal');
    const closePasswordModalBtn = document.getElementById('closePasswordModal');

    const backToSignupBtn = document.getElementById('backToSignup');
    const switchToLoginBtn = document.getElementById('switchToLogin');
    const switchToSignupBtn = document.getElementById('switchToSignup');
    
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const passwordForm = document.getElementById('passwordForm');
    
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const signupNextBtn = document.getElementById('signupNextBtn');
    const createAccountFinalBtn = document.getElementById('createAccountFinalBtn');

    let tempUserData = {};

    const openModal = (modal) => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = (modal) => {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    };
    
    const initializeBirthday = () => {
        const daySelect = document.getElementById('birthdayDay');
        const monthSelect = document.getElementById('birthdayMonth');
        const yearSelect = document.getElementById('birthdayYear');

        for (let i = 1; i <= 31; i++) {
            daySelect.innerHTML += `<option value="${i}">${i}</option>`;
        }

        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        months.forEach((month, index) => {
            monthSelect.innerHTML += `<option value="${index + 1}">${month}</option>`;
        });

        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i >= 1900; i--) {
            yearSelect.innerHTML += `<option value="${i}">${i}</option>`;
        }
    };
    
    const generateUsername = (fullName) => {
        return fullName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
    };

    loginBtn.addEventListener('click', () => openModal(loginModal));
    createAccountBtn.addEventListener('click', () => openModal(signupModal));
    closeLoginModalBtn.addEventListener('click', () => closeModal(loginModal));
    closeSignupModalBtn.addEventListener('click', () => closeModal(signupModal));
    closePasswordModalBtn.addEventListener('click', () => closeModal(passwordModal));
    [loginModal, signupModal, passwordModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });
    switchToLoginBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(signupModal); openModal(loginModal); });
    switchToSignupBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(loginModal); openModal(signupModal); });
    backToSignupBtn.addEventListener('click', () => { closeModal(passwordModal); openModal(signupModal); });

    const validateLoginForm = () => { loginSubmitBtn.disabled = !(emailInput.value.trim() && passwordInput.value.trim()); };
    emailInput.addEventListener('input', validateLoginForm);
    passwordInput.addEventListener('input', validateLoginForm);

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = emailInput.value.trim();
        const password = passwordInput.value.trim();
        loginSubmitBtn.textContent = 'Connexion...';
        loginSubmitBtn.disabled = true;
        try {
            let response = await fetch(`${API_URL}/users?email=${identifier}`);
            let users = await response.json();
            if (users.length === 0) {
                response = await fetch(`${API_URL}/users?username=${identifier}`);
                users = await response.json();
            }
            if (users.length > 0 && users[0].password === password) {
                const user = users[0];
                alert(`Bienvenue, ${user.name} !`);
                localStorage.setItem('twitterCloneUserId', user.id);
                window.location.href = 'accueil-x.html';
            } else {
                alert('Identifiant ou mot de passe incorrect.');
                loginSubmitBtn.textContent = 'Se connecter';
                validateLoginForm();
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            alert('Une erreur est survenue. Veuillez réessayer.');
            loginSubmitBtn.textContent = 'Se connecter';
            validateLoginForm();
        }
    });

    const validateSignupForm = () => {
        const inputs = [ document.getElementById('fullNameInput'), document.getElementById('emailSignupInput'), document.getElementById('birthdayDay'), document.getElementById('birthdayMonth'), document.getElementById('birthdayYear') ];
        signupNextBtn.disabled = !inputs.every(input => input.value.trim() !== '');
    };
    ['fullNameInput', 'emailSignupInput', 'birthdayDay', 'birthdayMonth', 'birthdayYear'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('input', validateSignupForm);
        el.addEventListener('change', validateSignupForm);
    });

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        tempUserData = {
            name: document.getElementById('fullNameInput').value.trim(),
            email: document.getElementById('emailSignupInput').value.trim(),
            birthday: `${document.getElementById('birthdayYear').value}-${document.getElementById('birthdayMonth').value}-${document.getElementById('birthdayDay').value}`
        };
        const summary = document.getElementById('userInfoSummary');
        summary.innerHTML = `<div class="user-info-item"><span class="user-info-label">Nom</span><span class="user-info-value">${tempUserData.name}</span></div><div class="user-info-item"><span class="user-info-label">E-mail</span><span class="user-info-value">${tempUserData.email}</span></div>`;
        closeModal(signupModal);
        openModal(passwordModal);
    });
    
    const validatePasswordForm = () => {
        const password = document.getElementById('newPasswordInput').value;
        const confirmPassword = document.getElementById('confirmPasswordInput').value;
        const reqs = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password)
        };
        Object.keys(reqs).forEach(key => { document.getElementById(`req-${key}`).classList.toggle('valid', reqs[key]); });
        const allValid = Object.values(reqs).every(Boolean) && password === confirmPassword && password !== '';
        createAccountFinalBtn.disabled = !allValid;
    };
    document.getElementById('newPasswordInput').addEventListener('input', validatePasswordForm);
    document.getElementById('confirmPasswordInput').addEventListener('input', validatePasswordForm);

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        createAccountFinalBtn.textContent = 'Création en cours...';
        createAccountFinalBtn.disabled = true;

        const newId = String(Date.now());
        
        const newUser = {
            ...tempUserData,
            id: newId,
            username: generateUsername(tempUserData.name),
            password: document.getElementById('newPasswordInput').value,
            createdAt: new Date().toISOString(),
            profilePicture: `https://i.pravatar.cc/150?u=${newId}`,
            bio: "",
            location: "",
            website: "",
            followers: 0,
            following: 0
        };

        try {
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            if (response.ok) {
                const createdUser = await response.json();
                alert('Compte créé avec succès !');
                localStorage.setItem('twitterCloneUserId', createdUser.id);
                window.location.href = 'accueil-x.html';
            } else {
                throw new Error('La création du compte a échoué.');
            }
        } catch (error) {
            console.error("Erreur lors de la création du compte:", error);
            alert('Une erreur est survenue.');
            createAccountFinalBtn.textContent = 'Créer le compte';
            validatePasswordForm();
        }
    });

    initializeBirthday();
});