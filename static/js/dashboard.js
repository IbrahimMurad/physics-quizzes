const tabTriggers = document.querySelectorAll('.tab-trigger');
const tabSwitcher = document.querySelector(".tab-switcher");
const tabLessons = document.getElementById("tab-lessons");
const tabRecent = document.getElementById("tab-recent");

tabTriggers.forEach((tab) => {
    tab.addEventListener("click", () => {
        if (tab.classList.contains("active")) return;

        tabTriggers.forEach((tab) => {
            tab.classList.remove("active");
        })
        tab.classList.add("active");

        tabLessons.classList.remove("active");
        tabRecent.classList.remove("active");

        if (tab.dataset.tab === "lessons") {
            tabLessons.classList.add("active");
            tabSwitcher.classList.remove("right");
        } else if (tab.dataset.tab === "recent") {
            tabRecent.classList.add("active");
            tabSwitcher.classList.add("right");
        }
    })
})
