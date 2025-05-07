const loginForm = document.querySelector('#login-form');
const usernameInput = document.querySelector('#username');
const passwordInput = document.querySelector('#password');
const usernameError = document.querySelector('#username-error');
const passwordError = document.querySelector('#password-error');
const passwordToggle = document.querySelector('.password-toggle');


loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (username === '') {
        usernameError.textContent = 'Username is required';
    }

    if (password === '') {
        passwordError.textContent = 'Password is required';
    }
});

passwordInput.addEventListener('input', () => {
    passwordError.textContent = '';
});

usernameInput.addEventListener('input', () => {
    usernameError.textContent = '';
});

passwordToggle.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordToggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        passwordInput.type = 'password';
        passwordToggle.innerHTML = '<i class="fas fa-eye"></i>';
    }
});