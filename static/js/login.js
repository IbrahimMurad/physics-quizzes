const loginForm = document.getElementById('login-form');


loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (username && password) {
        e.target.submit();
    }
    
    if (username === '') {
        console.log("login files")
        usernameError.textContent = 'Username is required';
        usernameInput.focus();
    }

    if (password === '') {
        passwordError.textContent = 'Password is required';
        passwordInput.focus();
    }
});