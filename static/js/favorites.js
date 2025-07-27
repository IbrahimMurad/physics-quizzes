document.addEventListener("DOMContentLoaded", function () {
  function debounce(func, delay = 400) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  document.querySelectorAll(".favorite-form").forEach(form => {
    form.addEventListener("submit", function (event) {
      // Prevent default form submission immediately
      event.preventDefault();

      // Store the form reference for use in the debounced function
      const form = event.target;
      const formData = new FormData(form);
      const filled = form.querySelector(".heart-icon.filled");
      const outline = form.querySelector(".heart-icon.outline");

      // Debounce the actual API call
      debounce(() => {
        fetch(form.action, {
          method: "POST",
          headers: {
            "X-CSRFToken": formData.get("csrfmiddlewaretoken"),
            "X-Requested-With": "XMLHttpRequest"
          },
          body: formData
        })
          .then(response => response.json())
          .then(data => {
            // Toggle the heart state visually
            const isNowFavorite = filled.style.display === "none";
            filled.style.display = isNowFavorite ? "inline" : "none";
            outline.style.display = isNowFavorite ? "none" : "inline";
          })
          .catch(error => {
            console.error("Favorite toggle failed:", error);
          });
      }, 300)(); // 100ms debounce delay (shorter delay for better UX)
    });
  });
});
