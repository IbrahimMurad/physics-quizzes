
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
    Object.entries(sections).forEach(([key, el]) =>
        el.classList.toggle("active", activeKeys.includes(key))
    );
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
                populateSelect(`/textbook/${selects.textbook.value}/units/json/`, "unit");
            }
            if (selectElement === "unit") {
                populateSelect(`/unit/${selects.unit.value}/chapters/json/`, "chapter");
            }
            if (selectElement === "chapter") {
                populateSelect(`/chapter/${selects.chapter.value}/lessons/json/`, "lesson");
            }
        });
}

function reset(selectElements = []) {
    selectElements.forEach((el) => { selects[el].innerHTML = '' });
}

// Radio change handlers
radios.textbook.addEventListener("change", () => {
    toggleSections([]);
    reset(["unit", "chapter", "lesson"]);
});

radios.unit.addEventListener("change", () => {
    toggleSections(["units"]);
    reset(["chapter", "lesson"]);
    if (selects.textbook.value) {
        populateSelect(`/textbook/${selects.textbook.value}/units/json/`, "unit");
    } else {
        reset(["unit"]);
    }
});

radios.chapter.addEventListener("change", () => {
    toggleSections(["units", "chapters"]);
    reset(["lesson"]);
    if (selects.unit.value) {
        populateSelect(`/unit/${selects.unit.value}/chapters/json/`, "chapter");
    } else {
        reset(["chapter"]);
    }
});

radios.lesson.addEventListener("change", () => {
    toggleSections(["units", "chapters", "lessons"]);
    reset(["lesson"]);
    if (selects.chapter.value) {
        populateSelect(`/chapter/${selects.chapter.value}/lessons/json/`, "lesson");
    } else {
        reset(["lesson"]);
    }
});

// Textbook select change
selects.textbook.addEventListener("change", () => {
    if (selects.textbook.value) {
        populateSelect(`/textbook/${selects.textbook.value}/units/json/`, "unit");
    } else {
        reset(["unit", "chapter", "lesson"]);
    }
});

// Unit select change
selects.unit.addEventListener("change", () => {
    populateSelect(`/unit/${selects.unit.value}/chapters/json/`, "chapter");
});

// Chapter select change
selects.chapter.addEventListener("change", () => {
    populateSelect(`/chapter/${selects.chapter.value}/lessons/json/`, "lesson");
});


form.addEventListener("submit", (e) => {
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    switch (data.scope_type) {
        case "Textbook":
            if (!data.textbook_id) {
                alert("Please select a textbook");
                return;
            }
            data.scope_id = data.textbook_id;
            break;
        case "Unit":
            if (!data.unit_id) {
                alert("Please select a unit");
                return;
            }
            data.scope_id = data.unit_id;
            break;
        case "Chapter":
            if (!data.chapter_id) {
                alert("Please select a chapter");
                return;
            }
            data.scope_id = data.chapter_id;
            break;
        case "Lesson":
            if (!data.lesson_id) {
                alert("Please select a lesson");
                return;
            }
            data.scope_id = data.lesson_id;
            break;
        default:
            alert("Please select a scope type");
            return;
    }
    const scopeIdInput = document.getElementById("scope-id-input");
    scopeIdInput.value = data.scope_id;

    const removeFields = ['textbook_id', 'unit_id', 'chapter_id', 'lesson_id'];
    removeFields.forEach(name => {
        const input = form.querySelector(`[name="${name}"]`);
        if (input) input.remove();
    });

    form.submit();
})