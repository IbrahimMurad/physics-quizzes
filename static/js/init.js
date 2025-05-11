function setTheme(theme) {
    if (theme === "auto") {
        document.documentElement.setAttribute("class", "system");
    } else {
        document.documentElement.setAttribute("class", theme);
    }
}

function initTheme() {
    // set theme defined in localStorage if there is one, or fallback to auto mode
    const currentTheme = localStorage.getItem("theme");
    currentTheme ? setTheme(currentTheme) : setTheme("dark");
}

initTheme();
