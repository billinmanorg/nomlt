/* Lesson quizzes — the reward button appears only after the right answer. */
(function () {
  "use strict";

  document.addEventListener("change", function (e) {
    var input = e.target;
    if (!input.matches || !input.matches("[data-quiz] input[type='radio']")) return;

    var quiz = input.closest("[data-quiz]");
    var feedback = quiz.querySelector("[data-feedback]");
    var button = quiz.querySelector("[data-earn]");
    var correct = input.hasAttribute("data-correct");

    feedback.hidden = false;
    feedback.textContent = correct
      ? "Correct — module complete."
      : "Not quite. Read the last paragraph again and try another answer.";

    if (button) button.hidden = !correct;
  });
})();
