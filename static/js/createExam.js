
// the create exam form
const form = document.querySelector(".custom-exam-form");


// Radio buttons that specifies the scope_type
const radios = {
    textbook: document.getElementById("textbook-radio"),
    unit: document.getElementById("unit-radio"),
    chapter: document.getElementById("chapter-radio"),
    lesson: document.getElementById("lesson-radio"),
};


// All scope sections
const sections = {
    units: document.getElementById("units"),
    chapters: document.getElementById("chapters"),
    lessons: document.getElementById("lessons"),
};

// All scope selections
const selects = {
    textbook: document.getElementById("textbook-select"),
    unit: document.getElementById("unit-select"),
    chapter: document.getElementById("chapter-select"),
    lesson: document.getElementById("lesson-select"),
};


// Utility: show/hide sections
function toggleSections(activeKeys = []) {
    Object.entries(sections).forEach(([key, el]) => {
        el.classList.toggle("active", activeKeys.includes(key));
    });
}


// Utility: fetch and populate a select
function populateSelect(url, selectElement) {
    selects[selectElement].innerHTML = '';
    fetch(url)
        .then(res => res.json())
        .then(data => {
            data.forEach(item => {
                const option = document.createElement("option");
                option.value = item.id;
                option.textContent = item.title;
                selects[selectElement].appendChild(option);
            });
            if (selectElement === "textbook") {
                populateSelect(`/scope/${selects.textbook.value}/`, "unit");
            }
            if (selectElement === "unit") {
                populateSelect(`/scope/${selects.unit.value}/`, "chapter");
            }
            if (selectElement === "chapter") {
                populateSelect(`/scope/${selects.chapter.value}/`, "lesson");
            }
        });
}

// Radio change handlers
radios.textbook.addEventListener("change", () => {
    toggleSections([]);
});

radios.unit.addEventListener("change", () => {
    toggleSections(["units"]);
    if (selects.textbook.value) {
        populateSelect(`/scope/${selects.textbook.value}/`, "unit");
    }
});

radios.chapter.addEventListener("change", () => {
    toggleSections(["units", "chapters"]);
    if (selects.unit.value) {
        populateSelect(`/scope/${selects.unit.value}/`, "chapter");
    }
});

radios.lesson.addEventListener("change", () => {
    toggleSections(["units", "chapters", "lessons"]);
    if (selects.chapter.value) {
        populateSelect(`/scope/${selects.chapter.value}/`, "lesson");
    }
});

Object.entries(selects).forEach(([, element], index) => {
    console.log(element, ["unit", "chapter", "lesson"].at(index))
    element.addEventListener("change", () => populateSelect(`/scope/${element.value}/`, ["unit", "chapter", "lesson"].at(index)))
} )

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
});

const scopeRadios = document.querySelectorAll('input[name="scope_type"]');

function updateSelectName() {
    console.log("initial updateSelectName");
    const selected = document.querySelector('input[name="scope_type"]:checked').value;
    console.log(selected);
    Object.entries(selects).forEach(([key, select]) => {
        if (key === selected) {
            select.setAttribute('name', 'id');
        } else {
            select.removeAttribute('name');
        }
    });
}

updateSelectName();

scopeRadios.forEach(radio => {
    radio.addEventListener('change', updateSelectName);
});