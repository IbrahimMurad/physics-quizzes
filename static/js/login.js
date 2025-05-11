const loginForm = document.getElementById('login-form');


loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (username && password) {
        e.target.submit();
    }
    
    if (username === '') {
        usernameError.textContent = 'Username is required';
    }

    if (password === '') {
        passwordError.textContent = 'Password is required';
    }
});