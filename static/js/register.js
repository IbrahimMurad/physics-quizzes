import { loading, stopLoading } from './accessibility.js';

// Enhanced registration form validation and UX
const registerForm = document.getElementById('register-form');
const emailInput = document.getElementById('email');
const confirmPasswordInput = document.getElementById('confirm-password');
const emailError = document.getElementById('email-error');
const confirmPasswordError = document.getElementById('confirm-password-error');
const confirmPasswordToggle = document.querySelector('.confirm-password-toggle');

// Password strength indicator
const passwordStrengthIndicator = document.createElement('div');
passwordStrengthIndicator.className = 'password-strength';
passwordStrengthIndicator.innerHTML = `
    <div class="strength-meter">
        <div class="strength-meter-fill"></div>
    </div>
    <span class="strength-text"></span>
`;

// Insert password strength indicator after password input
const passwordContainer = passwordInput.parentElement.parentElement;
passwordContainer.appendChild(passwordStrengthIndicator);

// Real-time validation functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateUsername(username) {
    if (username.length < 3) {
        return 'Username must be at least 3 characters long';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
}

function checkPasswordStrength(password) {
    let strength = 0;
    const strengthMeter = document.querySelector('.strength-meter-fill');
    const strengthText = document.querySelector('.strength-text');
    
    if (!password) {
        strengthMeter.style.width = '0%';
        strengthText.textContent = '';
        return;
    }
    
    // Check length
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Check for character types
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    // Update UI
    const percentage = (strength / 6) * 100;
    strengthMeter.style.width = percentage + '%';
    
    if (percentage <= 33) {
        strengthMeter.style.backgroundColor = 'var(--destructive)';
        strengthText.textContent = 'Weak';
        strengthText.style.color = 'var(--destructive)';
    } else if (percentage <= 66) {
        strengthMeter.style.backgroundColor = 'var(--message-warning-fg)';
        strengthText.textContent = 'Moderate';
        strengthText.style.color = 'var(--message-warning-fg)';
    } else {
        strengthMeter.style.backgroundColor = 'var(--message-success-fg)';
        strengthText.textContent = 'Strong';
        strengthText.style.color = 'var(--message-success-fg)';
    }
    
    return strength;
}

function validatePassword(password) {
    const errors = [];
    
    if (password.length < 8) {
        errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('One lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('One number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('One special character');
    }
    
    return errors;
}

// Clear error messages on input
emailInput.addEventListener('input', () => {
    emailError.textContent = '';
    if (emailInput.value && !validateEmail(emailInput.value)) {
        emailError.textContent = 'Please enter a valid email address';
    }
});

usernameInput.addEventListener('input', () => {
    const error = validateUsername(usernameInput.value);
    usernameError.textContent = error;
});

passwordInput.addEventListener('input', () => {
    const errors = validatePassword(passwordInput.value);
    checkPasswordStrength(passwordInput.value);
    
    if (errors.length > 0) {
        passwordError.textContent = 'Password must contain: ' + errors.join(', ');
    } else {
        passwordError.textContent = '';
    }
    
    // Check if passwords match
    if (confirmPasswordInput.value) {
        checkPasswordsMatch();
    }
});

confirmPasswordInput.addEventListener('input', checkPasswordsMatch);

function checkPasswordsMatch() {
    if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
        confirmPasswordError.textContent = 'Passwords do not match';
    } else {
        confirmPasswordError.textContent = '';
    }
}

// Toggle confirm password visibility
confirmPasswordToggle.addEventListener('click', () => {
    if (confirmPasswordInput.type === 'password') {
        confirmPasswordInput.type = 'text';
        confirmPasswordToggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        confirmPasswordInput.type = 'password';
        confirmPasswordToggle.innerHTML = '<i class="fas fa-eye"></i>';
    }
});

// Form submission
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitButton = registerForm.querySelector('button[type="submit"]');
    loading(submitButton);
    
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    let hasErrors = false;
    
    // Validate all fields
    if (!username) {
        usernameError.textContent = 'Username is required';
        hasErrors = true;
    } else {
        const usernameValidation = validateUsername(username);
        if (usernameValidation) {
            usernameError.textContent = usernameValidation;
            hasErrors = true;
        }
    }
    
    if (!email) {
        emailError.textContent = 'Email is required';
        hasErrors = true;
    } else if (!validateEmail(email)) {
        emailError.textContent = 'Please enter a valid email address';
        hasErrors = true;
    }
    
    if (!password) {
        passwordError.textContent = 'Password is required';
        hasErrors = true;
    } else {
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            passwordError.textContent = 'Password must contain: ' + passwordErrors.join(', ');
            hasErrors = true;
        }
    }
    
    if (!confirmPassword) {
        confirmPasswordError.textContent = 'Please confirm your password';
        hasErrors = true;
    } else if (password !== confirmPassword) {
        confirmPasswordError.textContent = 'Passwords do not match';
        hasErrors = true;
    }
    
    if (!hasErrors) {
        // Show loading state
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating account...';
        submitBtn.disabled = true;
        
        // Submit the form
        e.target.submit();
    }
    stopLoading(submitButton);
});

// Add styles for password strength meter
const style = document.createElement('style');
style.textContent = `
    .password-strength {
        margin-top: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .strength-meter {
        flex: 1;
        height: 4px;
        background-color: var(--muted);
        border-radius: 2px;
        overflow: hidden;
    }
    
    .strength-meter-fill {
        height: 100%;
        width: 0;
        transition: width 0.3s ease, background-color 0.3s ease;
    }
    
    .strength-text {
        font-size: 0.8rem;
        font-weight: 600;
        min-width: 60px;
    }
`;
document.head.appendChild(style);