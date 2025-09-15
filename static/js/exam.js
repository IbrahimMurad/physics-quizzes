// Track answered questions
const allChoices = document.querySelectorAll('input[type="radio"]');

allChoices.forEach((choice) => {
  choice.addEventListener('change', () => {
    const answeredProblems = document.querySelectorAll('input[type="radio"]:checked');
    const answeredProblemsCount = answeredProblems.length;
    document.querySelector('.answered').textContent = answeredProblemsCount;
  })
});

// Exam protection features
(function() {
  // Flag to track if exam is being submitted normally
  let isSubmitting = false;

  // Get the exam form
  const examForm = document.querySelector('.exam-form');

  // If exam form exists, add submit listener
  if (examForm) {
    examForm.addEventListener('submit', function() {
      isSubmitting = true;
    });
  }

  // Warning message
  const warningMessage = 'Are you sure you want to leave?\nYour exam will be considered aborted which will lead to a zero score.';

  // Tracking variables
  let tabSwitchCount = 0;
  let blurCount = 0;
  let focusing = true;
  const maxTabSwitches = 3;
  const maxBlurCount = 3;
  const suspiciousActivities = [];

  // Alert cascade prevention
  let showingAlert = false;
  let blurTimeout = null;

  // 1. Handle page refresh, close tab, or navigate away
  window.addEventListener('beforeunload', function(e) {
    if (!isSubmitting) {
      e.preventDefault();
      e.returnValue = warningMessage;
      return warningMessage;
    }
  });

  // 2. Handle browser back button
  if (window.history && window.history.pushState) {
    window.history.pushState(null, null, window.location.href);

    window.addEventListener('popstate', function(e) {
      if (!isSubmitting) {
        if (confirm(warningMessage)) {
          // User confirmed, allow navigation
          window.history.back();
        } else {
          // User cancelled, push state again to prevent back navigation
          window.history.pushState(null, null, window.location.href);
        }
      }
    });
  }

  // 3. Handle tab visibility change
  document.addEventListener('visibilitychange', function() {
    // Skip if showing alert to prevent interference
    if (showingAlert) return;

    if (document.hidden && !isSubmitting) {
      tabSwitchCount++;
    } else if (!document.hidden && tabSwitchCount > 0 && !isSubmitting) {

      // Set flag to prevent blur events during alert
      showingAlert = true;

      try {
        // Show warning when tab becomes visible again
        if (tabSwitchCount < maxTabSwitches) {
          setTimeout(() => {
            if (!isSubmitting && showingAlert) {
              alert(`Warning: You have switched tabs ${tabSwitchCount} time(s). \n\nPlease stay on the exam page to avoid losing your progress.`);
            }
          }, 500);
        } else if (tabSwitchCount === maxTabSwitches) {
          setTimeout(() => {
            if (!isSubmitting && showingAlert) {
              alert(`Warning: You have switched tabs ${tabSwitchCount} times. \n\nExcessive tab switching will abort the exam leading to a zero score.`);
            }
          }, 500);
        } else {
          setTimeout(() => {
            if (!isSubmitting) {
              isSubmitting = true; // Bypass beforeunload warning
              window.location.reload(true); // Force reload from server
            }
          }, 500);
          return; // Don't reset showingAlert flag if we're reloading
        }
      } finally {
        // Reset flag after alert
        setTimeout(() => {
          showingAlert = false;
        }, 1000); // Longer delay for tab switching alerts
      }
    }
  });

  // 4. Handle window blur (losing focus) - separate from tab switching
  window.addEventListener('blur', function() {
    // Skip if showing alert or submitting
    if (showingAlert || isSubmitting) return;

    focusing = false;
    blurCount++;

    // Clear any existing timeout to prevent multiple timers
    if (blurTimeout) {
      clearTimeout(blurTimeout);
    }

    // Set new timeout to reload page if focus isn't regained
    blurTimeout = setTimeout(() => {
      if (!focusing && !isSubmitting && !showingAlert) {
        window.location.reload();
      }
    }, 30000);
  });

  // 5. Handle window focus (regaining focus) - SINGLE EVENT LISTENER
  window.addEventListener('focus', function() {
    // Skip if showing alert or submitting
    if (showingAlert || isSubmitting) return;

    // Clear the reload timeout since focus is regained
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }

    if (!focusing) { // Only process if we were actually blurred
      // Set flag to prevent blur events during alert
      showingAlert = true;

      try {
        if (blurCount < maxBlurCount) {
          alert('Please, stay on the exam page to avoid any penalty.');
        } else if (blurCount === maxBlurCount) {
          alert('Excessive window focus loss will abort the exam leading to a zero score.');
        } else {
          window.location.reload(true);
          return;
        }
      } finally {
        // Always reset the flag after a delay
        setTimeout(() => {
          showingAlert = false;
        }, 200);
      }
    }

    focusing = true;
  });

  // 6. Disable right-click context menu
  document.addEventListener('contextmenu', function(e) {
    if (showingAlert) return; // Don't interfere with alerts

    e.preventDefault();
    showingAlert = true;
    try {
      alert('Right-click is disabled during the exam.');
    } finally {
      setTimeout(() => {
        showingAlert = false;
      }, 200);
    }
    return false;
  });

  // 7. Disable text selection (with exceptions)
  document.addEventListener('selectstart', function(e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      return false;
    }
  });

  // 8. Handle keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (showingAlert) return; // Don't interfere with alerts

    // Handle F5 (refresh)
    if (e.key === 'F5') {
      e.preventDefault();
      showingAlert = true;
      try {
        if (confirm(warningMessage)) {
          location.reload();
        }
      } finally {
        setTimeout(() => {
          showingAlert = false;
        }, 200);
      }
      return false;
    }

    // Handle Ctrl+R / Cmd+R (refresh) with confirmation
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      showingAlert = true;
      try {
        if (confirm(warningMessage)) {
          location.reload();
        }
      } finally {
        setTimeout(() => {
          showingAlert = false;
        }, 200);
      }
      return false;
    }

    // Disable other shortcuts that don't conflict with beforeunload
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      return false;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      showingAlert = true;
      try {
        alert('Copying is disabled during the exam.');
      } finally {
        setTimeout(() => {
          showingAlert = false;
        }, 200);
      }
      return false;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      showingAlert = true;
      try {
        alert('Pasting is disabled during the exam.');
      } finally {
        setTimeout(() => {
          showingAlert = false;
        }, 200);
      }
      return false;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      showingAlert = true;
      try {
        alert('Select all is disabled during the exam.');
      } finally {
        setTimeout(() => {
          showingAlert = false;
        }, 200);
      }
      return false;
    }

    // Disable developer tools shortcuts
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'u')) {
      e.preventDefault();
      showingAlert = true;
      try {
        alert('Developer tools are disabled during the exam.');
      } finally {
        setTimeout(() => {
          showingAlert = false;
        }, 200);
      }
      return false;
    }
  });

  // 9. Add a timer display (optional but useful)
  const durationElement = document.querySelector('.duration-countdown');
  if (durationElement) {
    let startTime = Date.now();

    function updateTimer() {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;

      durationElement.textContent = `Time: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  // 10. Page load protection - Ensure beforeunload is properly set
  window.addEventListener('load', function() {
    // Force a user interaction to ensure beforeunload will work
    document.addEventListener('click', function enableUnloadWarning() {
      // This ensures the beforeunload event will be respected by the browser
      document.removeEventListener('click', enableUnloadWarning);
    }, { once: true });
  });

})();