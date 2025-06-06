const allChoices = document.querySelectorAll('input[type="radio"]');

allChoices.forEach((choice) => {
  choice.addEventListener('change', () => {
    const answeredProblems = document.querySelectorAll('input[type="radio"]:checked');
    const answeredProblemsCount = answeredProblems.length;
    document.querySelector('.answered').textContent = answeredProblemsCount;
  })
})