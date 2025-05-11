const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('username-error');
const passwordError = document.getElementById('password-error');
const passwordToggle = document.querySelector('.password-toggle');


passwordInput.addEventListener('input', () => {
    passwordError.textContent = '';
});

usernameInput.addEventListener('input', () => {
    usernameError.textContent = '';
});

passwordToggle.addEventListener('click', () => {
    console.log(passwordInput.type);
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordToggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        passwordInput.type = 'password';
        passwordToggle.innerHTML = '<i class="fas fa-eye"></i>';
    }
});
