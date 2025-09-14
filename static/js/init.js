'use strict';

{
    const themeToggleButton = document.querySelectorAll(".theme-toggle-button");
    const userName = document.querySelectorAll(".user-name");
    const logoutButtonContainer = document.querySelectorAll(".logout-button-container");
    const messages = document.querySelectorAll(".message");
    const closeMessageButtons = document.querySelectorAll(".close-message");

    function setTheme(mode) {
        if (mode !== "light" && mode !== "dark" && mode !== "auto") {
            console.error(`Got invalid theme mode: ${mode}. Resetting to auto.`);
            mode = "auto";
        }
        document.documentElement.setAttribute("class", mode);
        localStorage.setItem("theme", mode);
        themeToggleButton.forEach(btn => {
            if (mode === "auto") {
                btn.innerHTML = `<i class="fa-solid fa-circle-half-stroke"></i>`;
            } else {
                btn.innerHTML = `<i class="fa-solid fa-${mode === "dark" ? "sun" : "moon"}"></i>`;
            }
        });
    }

    function cycleTheme() {
        const currentTheme = localStorage.getItem("theme") || "auto";
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        if (prefersDark) {
            // Auto (dark) -> Light -> Dark
            if (currentTheme === "auto") {
                setTheme("light");
            } else if (currentTheme === "light") {
                setTheme("dark");
            } else {
                setTheme("auto");
            }
        } else {
            // Auto (light) -> Dark -> Light
            if (currentTheme === "auto") {
                setTheme("dark");
            } else if (currentTheme === "dark") {
                setTheme("light");
            } else {
                setTheme("auto");
            }
        }
    }

    function initTheme() {
        // set theme defined in localStorage if there is one, or fallback to auto mode
        const currentTheme = localStorage.getItem("theme");
        currentTheme ? setTheme(currentTheme) : setTheme("auto");
    }

    function dismissMessage(messageElement) {
        if (!messageElement) return;
        
        messageElement.classList.add("dismissing");
        
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 300);
    }

    function showMessages() {
        messages.forEach((message, index) => {
            setTimeout(() => {
                message.classList.add("active");
            }, index * 100); // Stagger the animation
        });
        
        // Auto-hide messages after 5 seconds (more reasonable than 500 seconds)
        setTimeout(hideMessages, 5000);
    }

    function hideMessages() {
        messages.forEach((message) => {
            if (!message.classList.contains("dismissing")) {
                dismissMessage(message);
            }
        });
    }

    function initMessages() {
        // Add click handlers for close buttons
        closeMessageButtons.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const message = btn.closest(".message");
                dismissMessage(message);
            });
        });

        // Add click handlers for messages themselves (optional dismiss)
        messages.forEach((message) => {
            message.addEventListener("click", (e) => {
                // Only dismiss if clicking the message itself, not the close button
                if (!e.target.closest(".close-message")) {
                    dismissMessage(message);
                }
            });

            // Add keyboard support for message dismissal
            message.addEventListener("keydown", (e) => {
                if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    dismissMessage(message);
                }
            });

            // Make messages focusable for keyboard users
            if (!message.hasAttribute("tabindex")) {
                message.setAttribute("tabindex", "0");
            }
        });

        // Pause auto-hide when hovering over messages
        const messagesContainer = document.querySelector(".messages");
        if (messagesContainer) {
            let hideTimeout;
            
            messagesContainer.addEventListener("mouseenter", () => {
                clearTimeout(hideTimeout);
            });

            messagesContainer.addEventListener("mouseleave", () => {
                hideTimeout = setTimeout(hideMessages, 3000);
            });
        }
    }

    window.addEventListener('load', () => {
        // Initialize theme toggle buttons
        themeToggleButton.forEach((btn) => {
            btn.addEventListener("click", cycleTheme);
        });

        // Initialize user name dropdowns
        userName.forEach((name) => {
            name.addEventListener("click", () => {
                logoutButtonContainer.forEach((container) => {
                    container.classList.toggle("active");
                });
            });
        });

        // Initialize messages
        if (messages.length > 0) {
            initMessages();
            setTimeout(showMessages, 100);
        }
    });

    // Add global escape key handler for dismissing messages
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const activeMessages = document.querySelectorAll(".message.active");
            activeMessages.forEach(dismissMessage);
        }
    });

    initTheme();
}