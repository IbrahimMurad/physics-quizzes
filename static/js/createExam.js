// Create Exam JavaScript - Enhanced with Multi-Scope Support and Native Form Handling
let examType = "single_scope";
let selectedScopeType = "textbook";
const scopeTypes = ["textbook", "unit", "chapter", "lesson"];
const scopeContainers = document.querySelectorAll(".scope");
const scopeRadioButtons = document.querySelectorAll("input[name='scope_type']");
const scopeSelects = document.querySelectorAll("select");
const examForm = document.querySelector(".custom-exam-form");
const submitButton = document.querySelector("button[type='submit']");
const examTitleInput = document.getElementById("exam-title");

// Multi-scope specific elements
const examTypeRadios = document.querySelectorAll("input[name='exam-type']");
const singleScopeSection = document.getElementById("single-scope-section");
const multiScopeSection = document.getElementById("multi-scope-section");
const selectedScopesBoard = document.getElementById("selected-scopes-board");
const selectedCountSpan = document.querySelector(".selected-count");
const scopeSearchInput = document.getElementById("scope-search");
const numberProblemsField = document.querySelector(".number-of-problems-field");
const numberProblemsInput = document.getElementById("number-of-problems");
const rangeValueDisplay = document.getElementById("range-value");

// Cache for scope data
const scopeDataCache = new Map();
const scopeHierarchy = new Map(); // Map to track parent-child relationships

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    initializeEventListeners();
    validateForm();
    initializeMultiScope();
    buildScopeHierarchy();
    
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
    // Exam type change
    examTypeRadios.forEach(radio => {
        radio.addEventListener("change", handleExamTypeChange);
    });

    // Single scope listeners
    scopeRadioButtons.forEach((radioButton) => {
        radioButton.addEventListener("change", handleScopeTypeChange);
    });

    scopeSelects.forEach((select, index) => {
        select.addEventListener("change", () => handleSelectChange(select, index));
    });

    // Multi-scope checkbox listeners
    document.addEventListener("change", handleCheckboxChange);

    if (numberProblemsInput) {
        numberProblemsInput.addEventListener("input", handleRangeChange);
        numberProblemsInput.addEventListener("change", handleRangeChange);
        // Initialize the range display
        handleRangeChange();
    }

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
    updateCharacterCount();
}

// Initialize multi-scope functionality
function initializeMultiScope() {
    // Scope tree item clicks
    document.addEventListener("click", handleScopeTreeClick);

    // Search functionality
    if (scopeSearchInput) {
        scopeSearchInput.addEventListener("input", debounce(handleScopeSearch, 300));
    }

    // Initialize display
    updateSelectedScopesDisplay();
}

// Build initial scope hierarchy from DOM
function buildScopeHierarchy() {
    document.querySelectorAll(".scope-item").forEach(item => {
        const parentId = item.dataset.id;
        if (!scopeHierarchy.has(parentId)) {
            scopeHierarchy.set(parentId, new Set());
        }
    });
}

// Handle exam type change
function handleExamTypeChange(event) {
    examType = event.target.value;
    
    if (examType === "single_scope") {
        singleScopeSection.classList.add("active");
        multiScopeSection.classList.remove("active");
        numberProblemsField.classList.remove("active");;
        
        // Uncheck all multi-scope checkboxes
        document.querySelectorAll("input[name='scope_ids'][type='checkbox']").forEach(checkbox => {
            checkbox.checked = false;
        });
        updateSelectedScopesDisplay();
        
        // Reset single scope to active state
        adjustScopeFields();
    } else {
        singleScopeSection.classList.remove("active");
        multiScopeSection.classList.add("active");
        numberProblemsField.classList.add("active");
        
        // Clear single scope selections
        scopeSelects.forEach(select => {
            select.value = "";
            if (select.id !== "textbook-select") {
                select.innerHTML = '<option value="">Select ' + select.id.replace("-select", "").replace(/^\w/, c => c.toUpperCase()) + '</option>';
            }
        });
        
        adjustScopeFields();
    }
    
    validateForm();
}

// Handle checkbox changes for multi-scope
function handleCheckboxChange(event) {
    if (event.target.type === "checkbox" && event.target.name === "scope_ids") {
        const checkbox = event.target;
        const scopeItem = checkbox.closest(".scope-item");
        
        if (checkbox.checked) {
            handleScopeSelection(scopeItem);
        } else {
            handleScopeDeselection(scopeItem);
        }
        
        updateSelectedScopesDisplay();
        updateAddButtons();
        validateForm();
    }
}

// Handle scope selection
function handleScopeSelection(scopeItem) {
    const scopeId = scopeItem.dataset.id;
    const scopeType = scopeItem.dataset.type;
    const scopeTitle = scopeItem.dataset.title;
    
    // Uncheck any children of this scope
    const childrenToUncheck = findAllChildren(scopeId);
    childrenToUncheck.forEach(childId => {
        const childCheckbox = document.querySelector(`input[name='scope_ids'][value='${childId}']`);
        if (childCheckbox && childCheckbox.checked) {
            childCheckbox.checked = false;
        }
    });
    
    // Uncheck any parents of this scope
    const parentsToUncheck = findAllParents(scopeId);
    parentsToUncheck.forEach(parentId => {
        const parentCheckbox = document.querySelector(`input[name='scope_ids'][value='${parentId}']`);
        if (parentCheckbox && parentCheckbox.checked) {
            parentCheckbox.checked = false;
        }
    });
    
    showNotification(`${scopeType} "${scopeTitle}" added successfully`, "success");
}

// Handle scope deselection
function handleScopeDeselection(scopeItem) {
    const scopeType = scopeItem.dataset.type;
    const scopeTitle = scopeItem.dataset.title;
    
    showNotification(`${scopeType} "${scopeTitle}" removed`, "info");
}

// Handle scope tree clicks
function handleScopeTreeClick(event) {
    const target = event.target;
    
    // Handle toggle icon click
    if (target.classList.contains("toggle-icon") || 
        (target.classList.contains("scope-title") && !target.closest(".add-scope-btn"))) {
        const scopeItem = target.closest(".scope-item");
        if (scopeItem) {
            toggleScopeExpansion(scopeItem);
        }
        return;
    }
    
    // Handle scope item header click (but not on buttons/labels)
    if (target.classList.contains("scope-item-header") && 
        !target.closest(".add-scope-btn")) {
        const scopeItem = target.closest(".scope-item");
        if (scopeItem) {
            toggleScopeExpansion(scopeItem);
        }
        return;
    }
    
    // Handle remove button click in selected scopes
    if (target.classList.contains("remove-scope-btn") || target.closest(".remove-scope-btn")) {
        event.preventDefault();
        const scopeCard = target.closest(".scope-card");
        if (scopeCard) {
            const scopeId = scopeCard.dataset.id;
            const checkbox = document.querySelector(`input[name='scope_ids'][value='${scopeId}']`);
            if (checkbox) {
                checkbox.checked = false;
                handleCheckboxChange({ target: checkbox });
            }
        }
        return;
    }
}

// Toggle scope expansion in tree
async function toggleScopeExpansion(scopeItem) {
    const isExpanded = scopeItem.classList.contains("expanded");
    
    if (isExpanded) {
        scopeItem.classList.remove("expanded");
    } else {
        scopeItem.classList.add("expanded");
        
        // Load children if not already loaded
        const childrenContainer = scopeItem.querySelector(".scope-children");
        if (childrenContainer && !childrenContainer.dataset.loaded) {
            await loadScopeChildren(scopeItem);
        }
    }
}

// Load scope children
async function loadScopeChildren(scopeItem) {
    const scopeId = scopeItem.dataset.id;
    const scopeType = scopeItem.dataset.type;
    const childrenContainer = scopeItem.querySelector(".scope-children");
    
    if (!childrenContainer) return;
    
    // Show loading state
    childrenContainer.innerHTML = '<div class="loading-children"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    
    try {
        const response = await fetch(`/scope/${scopeId}/`);
        if (!response.ok) throw new Error("Failed to load children");
        
        const children = await response.json();
        childrenContainer.innerHTML = "";
        childrenContainer.dataset.loaded = "true";
        
        // Determine child type
        const childType = getChildType(scopeType);
        
        if (children.length === 0) {
            childrenContainer.innerHTML = '<div class="empty-children">No items available</div>';
            return;
        }
        
        // Track hierarchy and create child elements
        if (!scopeHierarchy.has(scopeId)) {
            scopeHierarchy.set(scopeId, new Set());
        }
        
        children.forEach(child => {
            const childItem = createScopeItem(child, childType);
            childrenContainer.appendChild(childItem);
            
            // Track hierarchy
            scopeHierarchy.get(scopeId).add(child.id.toString());
        });
        
        // Update button states after loading children
        updateAddButtons();
        
    } catch (error) {
        console.error("Error loading children:", error);
        childrenContainer.innerHTML = '<div class="error-children">Failed to load items. <button type="button" onclick="loadScopeChildren(this.closest(\'.scope-item\'))" class="retry-btn">Retry</button></div>';
    }
}

// Create scope item element
function createScopeItem(scope, type) {
    const div = document.createElement("div");
    div.className = "scope-item";
    div.dataset.id = scope.id;
    div.dataset.type = type;
    div.dataset.title = scope.title;
    
    const hasChildren = type !== "lesson";
    
    div.innerHTML = `
        <div class="scope-item-header">
            ${hasChildren ? '<i class="fas fa-chevron-right toggle-icon"></i>' : ''}
            <i class="fas fa-${getIconForType(type)}"></i>
            <span class="scope-title">${escapeHtml(scope.title)}</span>
            <label for="scope-${scope.id}" class="add-scope-btn" title="Add this scope">
                <input type="checkbox" id="scope-${scope.id}" name="scope_ids" value="${scope.id}" hidden>
                <i class="fas fa-plus"></i>
            </label>
        </div>
        ${hasChildren ? '<div class="scope-children"></div>' : ''}
    `;
    
    return div;
}

// Get child type based on parent type
function getChildType(parentType) {
    const typeIndex = scopeTypes.indexOf(parentType);
    return typeIndex < scopeTypes.length - 1 ? scopeTypes[typeIndex + 1] : null;
}

// Get icon for scope type
function getIconForType(type) {
    const icons = {
        textbook: "book",
        unit: "layer-group",
        chapter: "bookmark",
        lesson: "graduation-cap"
    };
    return icons[type] || "folder";
}

// Find all children of a scope (recursive)
function findAllChildren(scopeId, children = new Set()) {
    if (scopeHierarchy.has(scopeId)) {
        scopeHierarchy.get(scopeId).forEach(childId => {
            children.add(childId);
            findAllChildren(childId, children);
        });
    }
    return children;
}

// Find all parents of a scope (search through DOM structure)
function findAllParents(scopeId) {
    const parents = new Set();
    
    // Find the scope item in the DOM
    const targetItem = document.querySelector(`.scope-item[data-id="${scopeId}"]`);
    if (!targetItem) return parents;
    
    // Walk up the DOM tree to find parent scope items
    let currentElement = targetItem.parentElement;
    while (currentElement) {
        const parentScopeItem = currentElement.closest(".scope-item");
        if (parentScopeItem && parentScopeItem !== targetItem) {
            parents.add(parentScopeItem.dataset.id);
            currentElement = parentScopeItem.parentElement;
        } else {
            break;
        }
    }
    
    return parents;
}

// Update selected scopes display
function updateSelectedScopesDisplay() {
    const checkedBoxes = document.querySelectorAll("input[name='scope_ids'][type='checkbox']:checked");
    const selectedCount = checkedBoxes.length;
    
    selectedCountSpan.textContent = `(${selectedCount})`;
    
    if (selectedCount === 0) {
        selectedScopesBoard.innerHTML = `
            <div class="empty-selected">
                <i class="fas fa-inbox"></i>
                <p>No scopes selected yet</p>
                <p>Click the checkboxes next to any scope to add them</p>
            </div>
        `;
        return;
    }
    
    selectedScopesBoard.innerHTML = "";
    
    // Group selected scopes by type for better display
    const scopesByType = { textbook: [], unit: [], chapter: [], lesson: [] };
    
    checkedBoxes.forEach(checkbox => {
        const scopeItem = checkbox.closest(".scope-item");
        if (scopeItem) {
            const scope = {
                id: scopeItem.dataset.id,
                type: scopeItem.dataset.type,
                title: scopeItem.dataset.title
            };
            scopesByType[scope.type].push(scope);
        }
    });
    
    // Add scopes to display in order
    scopeTypes.forEach(type => {
        scopesByType[type].forEach(scope => {
            const card = createScopeCard(scope);
            selectedScopesBoard.appendChild(card);
        });
    });
}

// Create scope card for selected display
function createScopeCard(scope) {
    const div = document.createElement("div");
    div.className = "scope-card";
    div.dataset.id = scope.id;
    
    div.innerHTML = `
        <i class="scope-card-icon fas fa-${getIconForType(scope.type)}"></i>
        <div class="scope-card-content">
            <div class="scope-card-title">${escapeHtml(scope.title)}</div>
            <div class="scope-card-type">${scope.type}</div>
        </div>
        <button type="button" class="remove-scope-btn" title="Remove this scope">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    return div;
}

// Update add buttons state
function updateAddButtons() {
    document.querySelectorAll(".add-scope-btn").forEach(btn => {
        const scopeItem = btn.closest(".scope-item");
        if (!scopeItem) return;
        
        const scopeId = scopeItem.dataset.id;
        const checkbox = btn.querySelector("input[type='checkbox']");
        
        // Check various states
        const isSelected = checkbox && checkbox.checked;
        const hasSelectedParent = findAllParents(scopeId).size > 0 && 
            Array.from(findAllParents(scopeId)).some(parentId => {
                const parentCheckbox = document.querySelector(`input[name='scope_ids'][value='${parentId}']`);
                return parentCheckbox && parentCheckbox.checked;
            });
        const hasSelectedChild = Array.from(findAllChildren(scopeId)).some(childId => {
            const childCheckbox = document.querySelector(`input[name='scope_ids'][value='${childId}']`);
            return childCheckbox && childCheckbox.checked;
        });
        
        // Update button appearance and state
        const icon = btn.querySelector("i");
        
        if (isSelected) {
            icon.className = "fas fa-check";
            btn.title = "Already selected";
            btn.classList.add("selected");
        } else if (hasSelectedParent) {
            icon.className = "fas fa-level-up-alt";
            btn.title = "Parent scope already selected";
            btn.classList.remove("selected");
        } else if (hasSelectedChild) {
            icon.className = "fas fa-level-down-alt";
            btn.title = "Child scope already selected";
            btn.classList.remove("selected");
        } else {
            icon.className = "fas fa-plus";
            btn.title = "Add this scope";
            btn.classList.remove("selected");
        }
        
        // Handle disabled state for browsers that don't support :has()
        if (!CSS.supports("selector(:has(*))")) {
            btn.disabled = isSelected || hasSelectedParent || hasSelectedChild;
        }
    });
}

// Handle scope search
function handleScopeSearch() {
    const searchTerm = scopeSearchInput.value.toLowerCase().trim();
    
    if (searchTerm === "") {
        // Reset all items and collapse
        document.querySelectorAll(".scope-item").forEach(item => {
            item.style.display = "";
            item.classList.remove("expanded");
        });
        return;
    }
    
    document.querySelectorAll(".scope-item").forEach(item => {
        const title = item.dataset.title.toLowerCase();
        const matches = title.includes(searchTerm);
        
        if (matches) {
            item.style.display = "";
            // Expand parents to show matching item
            expandParentsOfItem(item);
        } else {
            // Check if any children match
            const hasVisibleMatchingChild = Array.from(item.querySelectorAll(".scope-item")).some(child => 
                child.dataset.title.toLowerCase().includes(searchTerm) && 
                child.style.display !== "none"
            );
            
            item.style.display = hasVisibleMatchingChild ? "" : "none";
        }
    });
}

// Expand all parents of an item
function expandParentsOfItem(item) {
    let parent = item.parentElement.closest(".scope-item");
    while (parent) {
        parent.classList.add("expanded");
        parent = parent.parentElement.closest(".scope-item");
    }
}

// Single Scope Functions
function handleScopeTypeChange(event) {
    selectedScopeType = event.target.value;
    adjustScopeFields();
    validateForm();
}

function handleSelectChange(select, index) {
    const parentId = select.value;
    if (parentId) {
        fillScopeSelect(index + 1, parentId);
    } else {
        clearSubsequentSelects(index + 1);
    }
    validateForm();
}

function adjustScopeFields() {
    let targetIndex = scopeTypes.indexOf(selectedScopeType);
    
    for (let i = 0; i < scopeTypes.length; i++) {
        const scopeSelect = scopeSelects[i];
        const scopeContainer = scopeContainers[i];
        
        if (i <= targetIndex) {
            if (i === targetIndex) {
                showScopeField(i);
            } else if (i < targetIndex) {
                scopeContainer.classList.add("active");
                if (i > 0 && scopeSelects[i - 1].value) {
                    fillScopeSelect(i, scopeSelects[i - 1].value);
                }
            }
        } else {
            hideScopeField(i);
        }
    }
}

function showScopeField(containerIndex) {
    const scopeContainer = scopeContainers[containerIndex];
    
    scopeContainer.classList.add("active");
    
    if (containerIndex > 0 && scopeSelects[containerIndex - 1].value) {
        fillScopeSelect(containerIndex, scopeSelects[containerIndex - 1].value);
    }
}

function hideScopeField(containerIndex) {
    const scopeContainer = scopeContainers[containerIndex];
    const scopeSelect = scopeSelects[containerIndex];
    
    scopeContainer.classList.remove("active");
    scopeSelect.innerHTML = "";
    scopeSelect.value = "";
}

async function fillScopeSelect(containerIndex, parentId) {
    if (containerIndex >= scopeSelects.length || scopeTypes.indexOf(selectedScopeType) < containerIndex) {
        return;
    }

    const scopeSelect = scopeSelects[containerIndex];
    const cacheKey = `${containerIndex}-${parentId}`;
    
    if (scopeDataCache.has(cacheKey)) {
        populateSelect(scopeSelect, scopeDataCache.get(cacheKey));
        return;
    }

    scopeSelect.dispatchEvent(new Event("loadstart"));
    scopeSelect.innerHTML = "<option value=''>Loading...</option>";
    scopeSelect.disabled = true;

    try {
        const response = await fetch(`/scope/${parentId}/`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        scopeDataCache.set(cacheKey, data);
        populateSelect(scopeSelect, data);
        
    } catch (error) {
        console.error("Error fetching scope data:", error);
        scopeSelect.innerHTML = "<option value=''>Error loading data</option>";
        showNotification("Failed to load data. Please try again.", "error");
    } finally {
        scopeSelect.disabled = false;
        scopeSelect.dispatchEvent(new Event("loadend"));
    }
}

function populateSelect(selectElement, data) {
    const scopeType = scopeTypes[Array.from(scopeSelects).indexOf(selectElement)];
    
    selectElement.innerHTML = "";
    
    if (data.length === 0) {
        selectElement.innerHTML = "<option value=''>No items available</option>";
        return;
    }
    
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = `Select ${scopeType}`;
    selectElement.appendChild(defaultOption);
    
    data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.title;
        selectElement.appendChild(option);
    });
}

function clearSubsequentSelects(startIndex) {
    for (let i = startIndex; i < scopeSelects.length; i++) {
        scopeSelects[i].innerHTML = "";
        scopeSelects[i].value = "";
    }
}

// Validation
function validateForm() {
    let isValid = false;
    
    if (examType === "single_scope") {
        // Check if the active scope level has a selected value
        const targetIndex = scopeTypes.indexOf(selectedScopeType);
        const targetSelect = scopeSelects[targetIndex];
        const hasValidScope = targetSelect && targetSelect.value && targetSelect.value !== "";
        isValid = hasValidScope && examTitleInput.value.trim() !== "";
    } else {
        // Check if any checkboxes are checked
        const checkedBoxes = document.querySelectorAll("input[name='scope_ids'][type='checkbox']:checked");
        const numberOfProblems = parseInt(numberProblemsInput.value);
        isValid = checkedBoxes.length > 0 && 
                 examTitleInput.value.trim() !== "" && 
                 numberOfProblems > 10 && 
                 numberOfProblems <= 50;
    }
    
    // Update submit button state
    if (isValid) {
        submitButton.classList.add("ready");
        submitButton.classList.remove("disabled");
        submitButton.disabled = false;
    } else {
        submitButton.classList.remove("ready");
        submitButton.classList.add("disabled");
        submitButton.disabled = true;
    }
    
    // Update title input validation state
    if (examTitleInput.value.trim() !== "") {
        examTitleInput.classList.add("valid");
    } else {
        examTitleInput.classList.remove("valid");
    }

    // Add validation state for number of problems input
    if (examType === "multi_scope") {
        const numberOfProblems = parseInt(numberProblemsInput.value);
        if (numberOfProblems > 0 && numberOfProblems <= 100) {
            numberProblemsInput.classList.add("valid");
        } else {
            numberProblemsInput.classList.remove("valid");
        }
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
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    
    // Form will be submitted with native HTML behavior
    // All selected checkboxes will be automatically included
}

// Handle reset
function handleReset(event) {
    event.preventDefault();
    
    if (confirm("Are you sure you want to reset the form? All your selections will be lost.")) {
        // Reset all form values
        examForm.reset();
        numberProblemsInput.value = "10";
        handleRangeChange();
        
        // Reset JavaScript state
        examType = "single_scope";
        selectedScopeType = "textbook";
        
        // Reset UI state
        updateSelectedScopesDisplay();
        adjustScopeFields();
        validateForm();
        clearErrorMessages();
        
        // Clear dynamic content
        for (let i = 1; i < scopeSelects.length; i++) {
            scopeSelects[i].innerHTML = "";
            scopeSelects[i].value = "";
        }
        
        // Reset exam type UI
        singleScopeSection.classList.add("active");
        multiScopeSection.classList.remove("active");
        
        // Reset search
        if (scopeSearchInput) {
            scopeSearchInput.value = "";
            handleScopeSearch();
        }
        
        // Collapse all expanded items
        document.querySelectorAll(".scope-item.expanded").forEach(item => {
            item.classList.remove("expanded");
        });
        
        updateAddButtons();
        showNotification("Form reset successfully", "info");
    }
}

// Update character count
function updateCharacterCount() {
    const currentLength = examTitleInput.value.length;
    const maxLength = examTitleInput.getAttribute("maxlength") || 256;
    const helpText = document.getElementById("title-help");
    
    if (helpText) {
        helpText.setAttribute("data-chars", `${currentLength}/${maxLength}`);
        
        // Add warning if approaching limit
        if (currentLength > maxLength * 0.9) {
            helpText.style.color = "var(--destructive)";
        } else {
            helpText.style.color = "";
        }
    }
}

// Show error message
function showErrorMessage(message) {
    clearErrorMessages();
    
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message show";
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    const formTitle = examForm.querySelector("h2");
    formTitle.insertAdjacentElement("afterend", errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

// Show notification
function showNotification(message, type = "info") {
    // Remove existing notifications
    document.querySelectorAll(".notification").forEach(n => n.remove());
    
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: "check-circle",
        warning: "exclamation-triangle", 
        error: "times-circle",
        info: "info-circle"
    };
    
    notification.innerHTML = `
        <i class="fas fa-${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    // Add styles for notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        background: var(--card);
        border: 1px solid var(--border);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-size: 0.875rem;
        max-width: 300px;
    `;
    
    // Type-specific colors
    const colors = {
        success: "var(--accent)",
        warning: "var(--message-warning-fg)",
        error: "var(--destructive)",
        info: "var(--primary)"
    };
    
    notification.style.borderColor = colors[type];
    notification.querySelector("i").style.color = colors[type];
    
    document.body.appendChild(notification);
    
    requestAnimationFrame(() => {
        notification.style.transform = "translateX(0)";
    });
    
    setTimeout(() => {
        notification.style.transform = "translateX(100%)";
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Clear error messages
function clearErrorMessages() {
    const errors = examForm.querySelectorAll(".error-message");
    errors.forEach(error => error.remove());
}

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Add keyboard navigation
document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.tagName !== "BUTTON" && event.target.type !== "radio" && event.target.type !== "checkbox") {
        event.preventDefault();
        
        const inputs = Array.from(examForm.querySelectorAll("input:not([type='radio']):not([type='hidden']):not([type='checkbox']), select"));
        const currentIndex = inputs.indexOf(event.target);
        
        if (currentIndex > -1 && currentIndex < inputs.length - 1) {
            inputs[currentIndex + 1].focus();
        } else if (currentIndex === inputs.length - 1 && validateForm()) {
            submitButton.click();
        }
    }
    
    // ESC key to close notifications
    if (event.key === "Escape") {
        document.querySelectorAll(".notification").forEach(n => n.remove());
    }
});

// handle range input changes
function handleRangeChange() {
    const value = numberProblemsInput.value;
    const min = numberProblemsInput.min || 1;
    const max = numberProblemsInput.max || 100;
    
    // Update display value with animation
    rangeValueDisplay.classList.add("updating");
    rangeValueDisplay.textContent = value;
    
    setTimeout(() => {
        rangeValueDisplay.classList.remove("updating");
    }, 150);
    
    // Update progress bar
    const progress = ((value - min) / (max - min)) * 100;
    numberProblemsInput.style.setProperty('--progress', `${progress}%`);
    
    // Validate form
    validateForm();
}

// Initialize on page load
adjustScopeFields();

