// Create Exam JavaScript - Enhanced Functionality
let selectedScopeType = "textbook";
const scopeTypes = ["textbook", "unit", "chapter", "lesson"];
const scopeContainers = document.querySelectorAll(".scope");
const scopeRadioButtons = document.querySelectorAll("input[name='scope_type']");
const scopeSelects = document.querySelectorAll("select");
const examForm = document.querySelector(".custom-exam-form");
const submitButton = document.querySelector("button[type='submit']");
const examTitleInput = document.getElementById("exam-title");

// Cache for scope data to reduce API calls
const scopeDataCache = new Map();

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    initializeEventListeners();
    validateForm();
    
    // Add smooth entry animation
    examForm.style.opacity = "0";
    examForm.style.transform = "translateY(20px)";
    
    requestAnimationFrame(() => {
        examForm.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        examForm.style.opacity = "1";
        examForm.style.transform = "translateY(0)";
    });
});

// Initialize all event listeners
function initializeEventListeners() {
    // Radio button changes
    scopeRadioButtons.forEach((radioButton) => {
        radioButton.addEventListener("change", handleScopeTypeChange);
    });

    // Select changes
    scopeSelects.forEach((select, index) => {
        select.addEventListener("change", () => handleSelectChange(select, index));
    });

    // Form validation
    examForm.addEventListener("input", validateForm);
    examForm.addEventListener("change", validateForm);

    // Reset button
    const resetButton = document.querySelector("button[type='reset']");
    resetButton.addEventListener("click", handleReset);

    // Form submission
    examForm.addEventListener("submit", handleSubmit);

    // Add loading states to selects
    scopeSelects.forEach(select => {
        select.addEventListener("loadstart", () => select.classList.add("loading"));
        select.addEventListener("loadend", () => select.classList.remove("loading"));
    });

    // Character counter for title input
    examTitleInput.addEventListener("input", updateCharacterCount);
    updateCharacterCount(); // Initialize counter
}

// Update character count display
function updateCharacterCount() {
    const currentLength = examTitleInput.value.length;
    const maxLength = examTitleInput.getAttribute("maxlength");
    const helpText = document.getElementById("title-help");
    
    if (helpText) {
        helpText.setAttribute("data-chars", `${currentLength}/${maxLength}`);
    }
}

// Handle scope type change
function handleScopeTypeChange(event) {
    selectedScopeType = event.target.value;
    adjustScopeFields();
    validateForm();
}

// Handle select changes
function handleSelectChange(select, index) {
    const parentId = select.value;
    if (parentId) {
        fillScopeSelect(index + 1, parentId);
    } else {
        // Clear subsequent selects if no value selected
        clearSubsequentSelects(index + 1);
    }
    validateForm();
}

// Adjust scope fields based on the selected scope type
function adjustScopeFields() {
    let targetIndex = scopeTypes.indexOf(selectedScopeType);
    
    // Show all scopes up to the selected type
    for (let i = 0; i < scopeTypes.length; i++) {
        const scopeSelect = scopeSelects[i];
        const scopeContainer = scopeContainers[i];
        
        if (i <= targetIndex) {
            // Show this scope
            if (i === targetIndex && selectedScopeType !== "textbook") {
                showScopeField(i);
            } else if (i < targetIndex) {
                scopeContainer.classList.add("active");
                if (i > 0 && scopeSelects[i - 1].value) {
                    fillScopeSelect(i, scopeSelects[i - 1].value);
                }
            }
            
            // Set name attribute only for the target scope
            if (i === targetIndex) {
                scopeSelect.setAttribute("name", "id");
                scopeSelect.setAttribute("required", "required");
            } else {
                scopeSelect.removeAttribute("name");
                scopeSelect.removeAttribute("required");
            }
        } else {
            // Hide this scope
            hideScopeField(i);
        }
    }
}

// Show scope field with animation
function showScopeField(containerIndex) {
    const scopeContainer = scopeContainers[containerIndex];
    const scopeSelect = scopeSelects[containerIndex];
    
    scopeContainer.classList.add("active");
    scopeSelect.setAttribute("name", "id");
    scopeSelect.setAttribute("required", "required");
    
    // Fill with data if parent has value
    if (containerIndex > 0 && scopeSelects[containerIndex - 1].value) {
        fillScopeSelect(containerIndex, scopeSelects[containerIndex - 1].value);
    }
}

// Hide scope field with animation
function hideScopeField(containerIndex) {
    const scopeContainer = scopeContainers[containerIndex];
    const scopeSelect = scopeSelects[containerIndex];
    
    scopeContainer.classList.remove("active");
    scopeSelect.removeAttribute("name");
    scopeSelect.removeAttribute("required");
    scopeSelect.innerHTML = "";
}

// Fill scope select with data
async function fillScopeSelect(containerIndex, parentId) {
    if (containerIndex >= scopeSelects.length || scopeTypes.indexOf(selectedScopeType) < containerIndex) {
        return;
    }

    const scopeSelect = scopeSelects[containerIndex];
    const cacheKey = `${containerIndex}-${parentId}`;
    
    // Check cache first
    if (scopeDataCache.has(cacheKey)) {
        populateSelect(scopeSelect, scopeDataCache.get(cacheKey));
        fillScopeSelect(containerIndex + 1, scopeSelect.value);
        return;
    }

    // Show loading state
    scopeSelect.dispatchEvent(new Event("loadstart"));
    scopeSelect.innerHTML = "<option value=''>Loading...</option>";
    scopeSelect.disabled = true;

    try {
        const response = await fetch(`/scope/${parentId}/`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Cache the data
        scopeDataCache.set(cacheKey, data);
        
        // Populate select
        populateSelect(scopeSelect, data);
        
        // Fill next level if needed
        if (scopeSelect.value) {
            fillScopeSelect(containerIndex + 1, scopeSelect.value);
        }
    } catch (error) {
        console.error("Error fetching scope data:", error);
        scopeSelect.innerHTML = "<option value=''>Error loading data</option>";
        showErrorMessage("Failed to load data. Please try again.");
    } finally {
        scopeSelect.disabled = false;
        scopeSelect.dispatchEvent(new Event("loadend"));
    }
}

// Populate select element with options
function populateSelect(selectElement, data) {
    selectElement.innerHTML = "";
    
    if (data.length === 0) {
        selectElement.innerHTML = "<option value=''>No items available</option>";
        return;
    }
    
    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = `Select ${selectElement.parentElement.querySelector("label").textContent}`;
    selectElement.appendChild(defaultOption);
    
    // Add data options
    data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.title;
        selectElement.appendChild(option);
    });
}

// Clear subsequent selects
function clearSubsequentSelects(startIndex) {
    for (let i = startIndex; i < scopeSelects.length; i++) {
        scopeSelects[i].innerHTML = "";
    }
}

// Validate form
function validateForm() {
    console.log("Validating...")
    const targetIndex = scopeTypes.indexOf(selectedScopeType);
    console.log("targetIndex -> ", targetIndex)
    const targetSelect = scopeSelects[targetIndex];
    console.log("targetSelect -> ", targetSelect)
    const hasValidScope = targetSelect && targetSelect.value;
    console.log("hasValidScope -> ", hasValidScope)
    const hasTitle = examTitleInput.value.trim() !== "";
    console.log("hasTitle -> ", hasTitle)
    
    const isValid = hasValidScope && hasTitle;
    console.log("isValid -> ", isValid)
    submitButton.disabled = !isValid;
    console.log("submitButton.disabled -> ", submitButton.disabled)
    
    // Update submit button appearance
    if (isValid) {
        submitButton.classList.add("ready");
        console.log("Ready")
    } else {
        submitButton.classList.remove("ready");
        console.log("Not Ready")
    }
    
    // Add visual feedback to inputs
    if (examTitleInput.value.trim() !== "") {
        examTitleInput.classList.add("valid");
    } else {
        examTitleInput.classList.remove("valid");
    }
    
    return isValid;
}

// Handle form submission
function handleSubmit(event) {
    if (!validateForm()) {
        event.preventDefault();
        showErrorMessage("Please fill in all required fields.");
        return;
    }
    
    // Add loading state to submit button
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Creating...';
}

// Handle reset
function handleReset(event) {
    event.preventDefault();
    
    // Confirm reset
    if (confirm("Are you sure you want to reset the form?")) {
        examForm.reset();
        selectedScopeType = "textbook";
        adjustScopeFields();
        validateForm();
        clearErrorMessages();
        
        // Clear all selects except textbook
        for (let i = 1; i < scopeSelects.length; i++) {
            scopeSelects[i].innerHTML = "";
        }
    }
}

// Show error message
function showErrorMessage(message) {
    // Remove existing error messages
    clearErrorMessages();
    
    // Create error element
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message show";
    errorDiv.innerHTML = `<i class="fa fa-exclamation-circle"></i> ${message}`;
    
    // Insert after form title
    const formTitle = examForm.querySelector("h2");
    formTitle.insertAdjacentElement("afterend", errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Clear error messages
function clearErrorMessages() {
    const errors = examForm.querySelectorAll(".error-message");
    errors.forEach(error => error.remove());
}

// Add keyboard navigation support
document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.tagName !== "BUTTON") {
        event.preventDefault();
        
        // Move to next input
        const inputs = Array.from(examForm.querySelectorAll("input:not([type='radio']), select"));
        const currentIndex = inputs.indexOf(event.target);
        
        if (currentIndex > -1 && currentIndex < inputs.length - 1) {
            inputs[currentIndex + 1].focus();
        } else if (currentIndex === inputs.length - 1 && validateForm()) {
            submitButton.click();
        }
    }
});