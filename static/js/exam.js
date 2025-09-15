// Track answered questions (delegated)
document.addEventListener('change', (e) => {
  if (e.target.matches('input[type="radio"]')) {
    const answeredProblems = document.querySelectorAll('input[type="radio"]:checked');
    const answeredElement = document.querySelector('.answered');
    if (answeredElement) {
      answeredElement.textContent = answeredProblems.length;
    }
  }
});

// Exam protection features
(function() {
  let isSubmitting = false;

  // Lightweight toast notifications (non-blocking)
  function showExamToast(message) {
    let el = document.getElementById('exam-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'exam-toast';
      el.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:8px 12px;border-radius:6px;z-index:9999;opacity:.95;max-width:90vw;box-shadow:0 2px 8px rgba(0,0,0,.25);font-size:14px;';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.style.display = 'block';
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => { el.style.display = 'none'; }, 2000);
  }

  // Prevent accidental navigation away from the exam page
  const handleBeforeUnload = function(event) {
    if (!isSubmitting) {
      event.preventDefault();
      event.returnValue = '';
      return '';
    }
  };
  window.addEventListener("beforeunload", handleBeforeUnload);

  if (window.history && window.history.pushState) {
    const currentState = { page: 'exam', timestamp: Date.now() };
    // Ensure there is a forward entry to return to when Back is pressed
    window.history.replaceState(currentState, document.title, window.location.href);
    window.history.pushState({ ...currentState, sentinel: true }, document.title, window.location.href);

    window.addEventListener('popstate', function() {
      if (isSubmitting) return;
      // Prevent leaving via Back: send the user forward to the sentinel state
      history.forward();
      showExamToast('Back navigation is disabled during the exam.');
    });
  }

  // Right-click context menu handler (scoped)
  const examForm = document.querySelector('.exam-form') || document.body;
  if (examForm) {
    examForm.addEventListener('contextmenu', function(e) {
      if (isSubmitting) return;
      e.preventDefault();
      showExamToast('Right-click is disabled during the exam.');
    });
  }

  // Text selection handler (scoped to exam form)
  if (examForm) {
    examForm.addEventListener('selectstart', function(e) {
      e.preventDefault();
    });
  }

  // keydown handler
  document.addEventListener("keydown", (e) => {
    const key = (e.key || '').toLowerCase();
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const disabledShortcuts = {
      s: 'Save is disabled during the exam.',
      c: 'Copying is disabled during the exam.',
      v: 'Pasting is disabled during the exam.',
      a: 'Select all is disabled during the exam.',
      u: 'View source is disabled during the exam.'
    };

    if (isCtrlOrCmd && disabledShortcuts[key]) {
      e.preventDefault();
      showExamToast(disabledShortcuts[key]);
    }
    // Handle developer tools shortcuts
    const isDevToolsShortcut = 
      key === 'f12' || 
      (e.ctrlKey && e.shiftKey && ['i', 'c', 'j'].includes(key)) ||
      (e.metaKey && e.altKey && key === 'i') ||
      (e.ctrlKey && e.shiftKey && key === 'delete');

    if (isDevToolsShortcut) {
      e.preventDefault();
      showExamToast('Developer tools are disabled during the exam.');
    }

    if ((e.altKey && key === 'tab') || (e.metaKey && key === 'tab')) {
      return true;
    }
  })

  document.addEventListener("submit", (e) => {
    e.preventDefault();
    isSubmitting = true;
    e.target.submit();
  });
})();
