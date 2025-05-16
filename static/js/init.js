'use strict';

{
    const themeToggleButton = document.querySelectorAll(".theme-toggle-button");
    const userName = document.querySelectorAll(".user-name");
    const logoutButtonContainer = document.querySelectorAll(".logout-button-container");


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

    window.addEventListener('load', () => {
        themeToggleButton.forEach((btn) => {
            btn.addEventListener("click", cycleTheme);
            console.log(btn);
        });

        userName.forEach((name) => {
            name.addEventListener("click", () => {
                logoutButtonContainer.forEach((container) => {
                    container.classList.toggle("active");
                });
            });
        });
    });

    initTheme();
}
