/* Tokenization fit questionnaire — scores the answers, then unlocks the reward. */
(function () {
  "use strict";
  var form = document.getElementById("fit-form");
  if (!form) return;

  var result = document.getElementById("fit-result");
  var earn = document.getElementById("fit-earn");

  var SCORES = {
    frequency: { weekly: 3, monthly: 2, occasional: 1, once: 0 },
    behaviour: { learning: 3, attendance: 3, referral: 2, contribution: 3, usage: 2 },
    sink: { content: 3, access: 3, tools: 3, status: 2, nothing: 0 },
    size: { small: 1, mid: 3, large: 3, xl: 2 }
  };

  var VERDICTS = [
    {
      min: 10,
      cls: "notice notice--gold",
      title: "Strong fit.",
      body: "You have repeat participation and something worth unlocking. A utility token would recognise behaviour you already want more of, and members would have somewhere to spend it."
    },
    {
      min: 7,
      cls: "notice notice--signal",
      title: "Worth designing carefully.",
      body: "The ingredients are there, but the rewarded action and the thing it unlocks need to be picked deliberately. Start with one action and one utility, then widen."
    },
    {
      min: 0,
      cls: "notice",
      title: "Probably not yet.",
      body: "With this pattern of participation a token adds machinery without adding much. Better follow-up, a member area or a training track will move the numbers further. Come back when people are returning regularly."
    }
  ];

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(form);
    var total = 0;
    var missing = false;

    Object.keys(SCORES).forEach(function (key) {
      var value = data.get(key);
      if (!value) { missing = true; return; }
      total += SCORES[key][value] || 0;
    });

    if (missing) {
      result.hidden = false;
      result.className = "notice";
      result.innerHTML = "<p class='mb-0'>Answer all four questions and the assessment will appear here.</p>";
      return;
    }

    var verdict = VERDICTS.filter(function (v) { return total >= v.min; })[0];
    result.hidden = false;
    result.className = verdict.cls;
    result.innerHTML = "<p><b>" + verdict.title + "</b></p><p class='mb-0'>" + verdict.body + "</p>";
    result.setAttribute("tabindex", "-1");
    result.focus();

    if (earn) earn.hidden = false;
  });
})();
