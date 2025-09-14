/**
 * Accessibility enhancements for the application
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize password toggle functionality
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        const input = document.querySelector(toggle.getAttribute('aria-controls'));
        if (!input) return;

        // Set initial state
        toggle.setAttribute('aria-label', 'Show password');
        
        // Toggle password visibility
        toggle.addEventListener('click', function() {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            const icon = this.querySelector('i');
            
            if (isPassword) {
                this.setAttribute('aria-label', 'Hide password');
                this.setAttribute('aria-pressed', 'true');
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                this.setAttribute('aria-label', 'Show password');
                this.setAttribute('aria-pressed', 'false');
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
            
            // Return focus to the password field
            input.focus();
        });
        
        // Handle keyboard events
        toggle.addEventListener('keydown', function(e) {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.click();
            }
        });
    });

    // Add error class to form fields with errors
    const formFields = document.querySelectorAll('input, select, textarea');
    formFields.forEach(field => {
        const errorId = field.getAttribute('aria-describedby')?.split(' ').find(id => id.endsWith('-error'));
        if (errorId) {
            const errorElement = document.getElementById(errorId);
            if (errorElement && errorElement.textContent.trim() !== '') {
                field.classList.add('error');
                field.setAttribute('aria-invalid', 'true');
            }
        }
    });

    // Handle form submission feedback
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitButton = this.querySelector('button[type="submit"]');
            if (submitButton) {
                const loadingText = submitButton.querySelector('.btn-loading');
                const buttonText = submitButton.querySelector('.btn-text');
                
                if (loadingText && buttonText) {
                    buttonText.style.display = 'none';
                    loadingText.style.display = 'inline-flex';
                    submitButton.disabled = true;
                    submitButton.setAttribute('aria-busy', 'true');
                }
            }
        });
    });
});

// Focus management for modals and dialogs
function trapFocus(element) {
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableContent = element.querySelectorAll(focusableElements);
    const firstFocusableElement = focusableContent[0];
    const lastFocusableElement = focusableContent[focusableContent.length - 1];

    element.addEventListener('keydown', function(e) {
        const isTabPressed = e.key === 'Tab';

        if (!isTabPressed) {
            return;
        }

        if (e.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
                lastFocusableElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastFocusableElement) {
                firstFocusableElement.focus();
                e.preventDefault();
            }
        }
    });

    firstFocusableElement.focus();
}

// Initialize any modals or dialogs on the page
document.addEventListener('DOMContentLoaded', function() {
    const modals = document.querySelectorAll('[role="dialog"], .modal');
    modals.forEach(modal => {
        if (modal.getAttribute('aria-hidden') !== 'true') {
            trapFocus(modal);
        }
    });
});

// Announce dynamic content changes
function announce(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.classList.add('sr-only');
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    // Remove the announcement after a short delay
    setTimeout(() => {
        announcement.remove();
    }, 1000);
}

// Export functions for use in other modules
window.Accessibility = {
    trapFocus,
    announce
};
