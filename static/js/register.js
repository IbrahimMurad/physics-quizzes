const registerForm = document.getElementById('register-form');
const emailInput = document.getElementById('email');
const confirmPasswordInput = document.getElementById('confirm-password');
const emailError = document.getElementById('email-error');
const confirmPasswordError = document.getElementById('confirm-password-error');
const confirmPasswordToggle = document.querySelector('.confirm-password-toggle');


registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (username && email && password && confirmPassword) {
        e.target.submit();
    }
    
    if (username === '') {
        usernameError.textContent = 'Username is required';
    }

    if (email === '') {
        emailError.textContent = 'Email is required';
    }

    if (password === '') {
        passwordError.textContent = 'Password is required';
    }

    if (confirmPassword === '') {
        confirmPasswordError.textContent = 'Confirm password is required';
    }
});

emailInput.addEventListener('input', () => {
    emailError.textContent = '';
});

confirmPasswordInput.addEventListener('input', () => {
    confirmPasswordError.textContent = '';
});

confirmPasswordToggle.addEventListener('click', () => {
    if (confirmPasswordInput.type === 'password') {
        confirmPasswordInput.type = 'text';
        confirmPasswordToggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        confirmPasswordInput.type = 'password';
        confirmPasswordToggle.innerHTML = '<i class="fas fa-eye"></i>';
    }
});