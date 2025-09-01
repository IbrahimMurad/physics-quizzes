// Create Exam JavaScript - Enhanced with Multi-Scope Support
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
const selectedIdsInput = document.getElementById("selected-ids");
const selectedCountSpan = document.querySelector(".selected-count");
const scopeSearchInput = document.getElementById("scope-search");

// Cache for scope data
const scopeDataCache = new Map();
const selectedScopes = new Map(); // Map of scope ID to scope data
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

    // Initialize empty state
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
        
        // Clear multi-scope selection
        selectedScopes.clear();
        updateSelectedScopesDisplay();
    } else {
        singleScopeSection.classList.remove("active");
        multiScopeSection.classList.add("active");
        
        // Clear single scope selections
        scopeSelects.forEach(select => {
            if (select.id !== "textbook-select") {
                select.value = "";
                select.innerHTML = "";
            }
        });
        
        adjustScopeFields();
    }
    
    validateForm();
}

// Handle scope tree clicks
function handleScopeTreeClick(event) {
    const target = event.target;
    
    // Handle toggle icon click
    if (target.classList.contains("toggle-icon") || target.classList.contains("scope-title") || target.closest(".toggle-icon")) {
        const scopeItem = target.closest(".scope-item");
        if (scopeItem) {
            toggleScopeExpansion(scopeItem);
        }
        return;
    }
    
    // Handle add button click
    if (target.classList.contains("add-scope-btn") || target.closest(".add-scope-btn")) {
        event.preventDefault();
        const scopeItem = target.closest(".scope-item");
        if (scopeItem) {
            addScope(scopeItem);
        }
        return;
    }
    
    // Handle remove button click
    if (target.classList.contains("remove-scope-btn") || target.closest(".remove-scope-btn")) {
        event.preventDefault();
        const scopeId = target.closest(".scope-card").dataset.id;
        if (scopeId) {
            removeScope(scopeId);
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
            <button type="button" class="add-scope-btn" title="Add this scope">
                <i class="fas fa-plus"></i>
            </button>
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

// Add scope to selection
function addScope(scopeItem) {
    const scopeId = scopeItem.dataset.id;
    const scopeType = scopeItem.dataset.type;
    const scopeTitle = scopeItem.dataset.title;
    
    // Check if already selected
    if (selectedScopes.has(scopeId)) {
        showNotification("This scope is already selected", "warning");
        return;
    }
    
    // Remove any children of this scope from selection
    const childrenToRemove = findAllChildren(scopeId);
    childrenToRemove.forEach(childId => {
        if (selectedScopes.has(childId)) {
            selectedScopes.delete(childId);
        }
    });
    
    // Remove any parents of this scope from selection
    const parentsToRemove = findAllParents(scopeId);
    parentsToRemove.forEach(parentId => {
        if (selectedScopes.has(parentId)) {
            selectedScopes.delete(parentId);
        }
    });
    
    // Add the scope
    selectedScopes.set(scopeId, {
        id: scopeId,
        type: scopeType,
        title: scopeTitle
    });
    
    updateSelectedScopesDisplay();
    updateAddButtons();
    validateForm();
    showNotification(`${scopeType} "${scopeTitle}" added successfully`, "success");
}

// Remove scope from selection
function removeScope(scopeId) {
    const scope = selectedScopes.get(scopeId);
    if (scope) {
        selectedScopes.delete(scopeId);
        updateSelectedScopesDisplay();
        updateAddButtons();
        validateForm();
        showNotification(`${scope.type} "${scope.title}" removed`, "info");
    }
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
    selectedCountSpan.textContent = `(${selectedScopes.size})`;
    
    if (selectedScopes.size === 0) {
        selectedScopesBoard.innerHTML = `
            <div class="empty-selected">
                <i class="fas fa-inbox"></i>
                <p>No scopes selected yet</p>
                <p>Click the + button next to any scope to add it</p>
            </div>
        `;
        selectedIdsInput.value = "";
        return;
    }
    
    selectedScopesBoard.innerHTML = "";
    const idsArray = [];
    
    // Sort selected scopes by type hierarchy for better display
    const sortedScopes = Array.from(selectedScopes.entries()).sort((a, b) => {
        const typeOrder = { textbook: 0, unit: 1, chapter: 2, lesson: 3 };
        return typeOrder[a[1].type] - typeOrder[b[1].type];
    });
    
    sortedScopes.forEach(([id, scope]) => {
        idsArray.push(id);
        const card = createScopeCard(scope);
        selectedScopesBoard.appendChild(card);
    });
    
    selectedIdsInput.value = idsArray.join(",");
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
        
        // Check various states
        const isSelected = selectedScopes.has(scopeId);
        const hasSelectedParent = findAllParents(scopeId).size > 0 && 
            Array.from(findAllParents(scopeId)).some(parentId => selectedScopes.has(parentId));
        const hasSelectedChild = Array.from(findAllChildren(scopeId)).some(childId => 
            selectedScopes.has(childId));
        
        btn.disabled = isSelected || hasSelectedParent || hasSelectedChild;
        
        // Update button appearance and tooltip
        if (isSelected) {
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.title = "Already selected";
            btn.classList.add("selected");
        } else if (hasSelectedParent) {
            btn.innerHTML = '<i class="fas fa-level-up-alt"></i>';
            btn.title = "Parent scope already selected";
            btn.classList.remove("selected");
        } else if (hasSelectedChild) {
            btn.innerHTML = '<i class="fas fa-level-down-alt"></i>';
            btn.title = "Child scope already selected";
            btn.classList.remove("selected");
        } else {
            btn.innerHTML = '<i class="fas fa-plus"></i>';
            btn.title = "Add this scope";
            btn.classList.remove("selected");
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
            // Check if any children match (need to load them first if not loaded)
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

// Single Scope Functions (existing functionality)
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
    const scopeSelect = scopeSelects[containerIndex];
    
    scopeContainer.classList.add("active");
    
    // Only set name and required for the target scope type
    if (examType === "single_scope") {
        scopeSelect.setAttribute("name", "id");
        scopeSelect.setAttribute("required", "required");
    }
    
    if (containerIndex > 0 && scopeSelects[containerIndex - 1].value) {
        fillScopeSelect(containerIndex, scopeSelects[containerIndex - 1].value);
    }
}

function hideScopeField(containerIndex) {
    const scopeContainer = scopeContainers[containerIndex];
    const scopeSelect = scopeSelects[containerIndex];
    
    scopeContainer.classList.remove("active");
    scopeSelect.removeAttribute("name");
    scopeSelect.removeAttribute("required");
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
        const targetIndex = scopeTypes.indexOf(selectedScopeType);
        const targetSelect = scopeSelects[targetIndex];
        const hasValidScope = targetSelect && targetSelect.value && targetSelect.value !== "";
        isValid = hasValidScope && examTitleInput.value.trim() !== "";
    } else {
        isValid = selectedScopes.size > 0 && examTitleInput.value.trim() !== "";
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
    
    return isValid;
}

// Handle form submission
function handleSubmit(event) {
    if (!validateForm()) {
        event.preventDefault();
        showErrorMessage("Please fill in all required fields.");
        return;
    }
    
    // Ensure proper form field setup based on exam type
    if (examType === "single_scope") {
        // Remove multi-scope field
        selectedIdsInput.removeAttribute("name");
        
        // Ensure only the target scope select has the name attribute
        scopeSelects.forEach((select, index) => {
            if (index === scopeTypes.indexOf(selectedScopeType)) {
                select.setAttribute("name", "id");
            } else {
                select.removeAttribute("name");
            }
        });
    } else {
        // For multi-scope, remove single scope fields and ensure ids field is named
        scopeSelects.forEach(select => {
            select.removeAttribute("name");
        });
        selectedIdsInput.setAttribute("name", "ids");
    }
    
    // Add loading state to submit button
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
}

// Handle reset
function handleReset(event) {
    event.preventDefault();
    
    if (confirm("Are you sure you want to reset the form? All your selections will be lost.")) {
        // Reset all form values
        examForm.reset();
        
        // Reset JavaScript state
        examType = "single_scope";
        selectedScopeType = "textbook";
        selectedScopes.clear();
        
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
    if (event.key === "Enter" && event.target.tagName !== "BUTTON" && event.target.type !== "radio") {
        event.preventDefault();
        
        const inputs = Array.from(examForm.querySelectorAll("input:not([type='radio']):not([type='hidden']), select"));
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

// Initialize on page load
adjustScopeFields();