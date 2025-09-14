'use strict';

/**
 * Accessibility enhancements for the application
 */

{
    // Enhanced focus management
    function initFocusManagement() {
        // Trap focus in modals/dialogs
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const activeModal = document.querySelector('.modal.active, .dialog.active');
                if (activeModal) {
                    trapFocus(e, activeModal);
                }
            }
        });
    }

    function trapFocus(e, container) {
        const focusableElements = container.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    // Enhanced keyboard navigation for messages
    function initMessageKeyboardSupport() {
        document.addEventListener('keydown', (e) => {
            const messages = document.querySelectorAll('.message.active');
            
            if (messages.length === 0) return;

            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                const currentMessage = document.activeElement.closest('.message');
                if (!currentMessage) return;

                e.preventDefault();
                const messagesArray = Array.from(messages);
                const currentIndex = messagesArray.indexOf(currentMessage);
                
                let nextIndex;
                if (e.key === 'ArrowDown') {
                    nextIndex = (currentIndex + 1) % messagesArray.length;
                } else {
                    nextIndex = currentIndex === 0 ? messagesArray.length - 1 : currentIndex - 1;
                }
                
                messagesArray[nextIndex].focus();
            }
        });
    }

    // Announce dynamic content changes to screen readers
    function announceToScreenReader(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Enhanced form validation announcements
    function initFormAccessibility() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const errors = form.querySelectorAll('.error, [aria-invalid="true"]');
                if (errors.length > 0) {
                    const errorCount = errors.length;
                    const message = `Form has ${errorCount} error${errorCount > 1 ? 's' : ''}. Please correct the errors and try again.`;
                    announceToScreenReader(message, 'assertive');
                    
                    // Focus first error
                    errors[0].focus();
                }
            });
            
            // Real-time validation announcements
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    const errorElement = input.parentNode.querySelector('.error-message');
                    if (errorElement && errorElement.textContent.trim()) {
                        announceToScreenReader(errorElement.textContent, 'assertive');
                    }
                });
            });
        });
    }

    // Reduced motion preferences
    function respectReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        function updateAnimations(mediaQuery) {
            if (mediaQuery.matches) {
                document.documentElement.classList.add('reduce-motion');
            } else {
                document.documentElement.classList.remove('reduce-motion');
            }
        }
        
        updateAnimations(prefersReducedMotion);
        prefersReducedMotion.addEventListener('change', updateAnimations);
    }

    // High contrast mode detection
    function detectHighContrast() {
        const highContrast = window.matchMedia('(-ms-high-contrast: active), (forced-colors: active)');
        
        function updateHighContrast(mediaQuery) {
            if (mediaQuery.matches) {
                document.documentElement.classList.add('high-contrast');
            } else {
                document.documentElement.classList.remove('high-contrast');
            }
        }
        
        updateHighContrast(highContrast);
        highContrast.addEventListener('change', updateHighContrast);
    }

    // Skip link functionality
    function initSkipLinks() {
        const skipLinks = document.querySelectorAll('.skip-to-content');
        skipLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // Color contrast warnings for developers (in development mode)
    function checkColorContrast() {
        if (process?.env?.NODE_ENV === 'development') {
            const elements = document.querySelectorAll('*');
            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                const bgColor = style.backgroundColor;
                const textColor = style.color;
                
                // Basic contrast checking would go here
                // This is a placeholder for more complex contrast calculations
            });
        }
    }

    // Initialize all accessibility features
    function initAccessibility() {
        initFocusManagement();
        initMessageKeyboardSupport();
        initFormAccessibility();
        respectReducedMotion();
        detectHighContrast();
        initSkipLinks();
        
        // Announce when messages are added
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('message')) {
                        const messageText = node.querySelector('.message-text')?.textContent;
                        const messageType = node.classList.contains('error') ? 'Error' : 
                                          node.classList.contains('warning') ? 'Warning' : 
                                          node.classList.contains('success') ? 'Success' : 'Message';
                        
                        if (messageText) {
                            announceToScreenReader(`${messageType}: ${messageText}`, 'assertive');
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccessibility);
    } else {
        initAccessibility();
    }

    // Export functions for use in other modules
    window.accessibility = {
        announceToScreenReader,
        trapFocus
    };
}