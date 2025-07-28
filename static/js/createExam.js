let selectedScopeType = "textbook";
const scopeTypes = ["textbook", "unit", "chapter", "lesson"];
const scopeContainers = document.querySelectorAll(".scope");
const scopeRadioButtons = document.querySelectorAll("input[name='scope_type']");
const scopeSelects = document.querySelectorAll("select");
const examTypeRadioButtons = document.querySelectorAll("input[name='exam_type']");
const addBtns = document.querySelectorAll("button.add-btn");

// handle the change of selected exam type
examTypeRadioButtons.forEach((radioButton) => {
    radioButton.addEventListener("change", () => {
        if (radioButton.value === "single_scope") {
            document.querySelector(".scope-selector").style.display = "flex";
            hideScopeField(1)
            hideScopeField(2)
            hideScopeField(3)
            hideAddBtns()
            document.querySelector(".multiple-scope-exam-scopes").style.display = "none";
        } else {
            document.querySelector(".scope-selector").style.display = "none";
            showScopeField(1)
            showScopeField(2)
            showScopeField(3)
            showAddBtns()
            document.querySelector(".multiple-scope-exam-scopes").style.display = "flex";
        }
    })
})

function hideAddBtns() {
    addBtns.forEach((btn) => {
        btn.style.display = "none";
    })
}

function showAddBtns() {
    addBtns.forEach((btn) => {
        btn.style.display = "block";
    })
}


function addScope(scope_id, scope_type, scope_title) {
    const div = document.createElement("div");
    div.classList.add("selected-scope");
    div.innerHTML = `
        <input type="checkbox" name="id" value="${scope_id}" hidden checked>
        <label>
            ${scope_type} : <span class="selected-scope-title">${scope_title}</span>
        </label>
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">remove</button>
    `;
    document.getElementById("selected-scopes").appendChild(div);
}

addBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        const scopeSelect = btn.previousElementSibling;
        const scope_id = scopeSelect.value;
        const scope_type = btn.parentElement.previousElementSibling.textContent;
        const scope_title = scopeSelect.options[scopeSelect.selectedIndex].textContent;
        addScope(scope_id, scope_type, scope_title);
    })
})


// handle the change of selected scope type
scopeRadioButtons.forEach((radioButton) => {
    radioButton.addEventListener("change", () => {
        selectedScopeType = radioButton.value;
        adjustScopeFields();
    })
})

// adjust scope fields based on the selected scope type
function adjustScopeFields() {
    let i;

    // show scope select fields up to the selected scope type
    for (i = 0; i < scopeTypes.length; i++) {
        const scopeSelect = scopeSelects[i];

        if (scopeTypes.indexOf(selectedScopeType) === i) {
            if (selectedScopeType !== "textbook") {
                showScopeField(i);
            }
            break;
        }
        if (!scopeContainers[i].classList.contains("active")) {
            scopeContainers[i].classList.add("active")
            fillScopeSelect(i, scopeSelects[i - 1].value);
        }
        scopeSelect.removeAttribute("name");
        scopeSelect.removeAttribute("required");
    }

    // hide other scope select fields
    for (let j = i + 1; j < scopeTypes.length; j++) {
        hideScopeField(j);
    }
}

// show scope select fields
function showScopeField(containerIndex) {
    // shows the scope container and adds name and requried attributes from select element

    const scopeSelect = scopeSelects[containerIndex];
    scopeSelect.setAttribute("name", "id");
    scopeSelect.setAttribute("required", "required");
    scopeContainers[containerIndex].classList.add("active");
    fillScopeSelect(containerIndex, scopeSelects[containerIndex - 1].value);
}

// hide scope select fields
function hideScopeField(containerIndex) {
    // hides the scope container and removes name and requried attributes from select element

    const scopeSelect = scopeSelects[containerIndex];
    scopeSelect.removeAttribute("name");
    scopeSelect.removeAttribute("required");
    scopeSelect.innerHTML = "";
    scopeContainers[containerIndex].classList.remove("active");
}

// fill scope select fields with data from the server
function fillScopeSelect(containerIndex, parentId) {
    if (containerIndex >= scopeSelects.length || scopeTypes.indexOf(selectedScopeType) < containerIndex) {
        return;
    }
    fetch(`/scope/${parentId}/`)
        .then(response => response.json())
        .then(data => {
            const scopeSelect = scopeSelects[containerIndex];
            scopeSelect.innerHTML = "";
            data.forEach(item => {
                const option = document.createElement("option");
                option.value = item.id;
                option.textContent = item.title;
                scopeSelect.appendChild(option);
            })
            fillScopeSelect(containerIndex + 1, scopeSelect.value)
        })
        .catch(error => {
            console.error(error);
            for (let j = containerIndex; j < scopeSelects.length; j++) {
                scopeSelects[j].innerHTML = "";
            }
        })
}

// handle the change of selected scope value for any scope type and its subsequent scopes
scopeSelects.forEach((select) => {
    select.addEventListener("change", () => {
        let parentId = select.value;
        const i = Array.from(scopeSelects).indexOf(select);
        fillScopeSelect(i + 1, parentId);
    })
})

// handle reset button to resets the form to its initial state
document.querySelector("button[type='reset']").addEventListener("click", () => {
    document.querySelector("form").reset();
    selectedScopeType = "textbook";
    adjustScopeFields();
})