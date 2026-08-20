/* Plan my app — three short steps, then a written plan and the reward. */
(function () {
  "use strict";

  var UI = window.NOLMT;
  var form = document.getElementById("planner");
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll("[data-step]"));
  var markers = Array.prototype.slice.call(document.querySelectorAll("#stepper li"));
  var back = document.getElementById("back");
  var next = document.getElementById("next");
  var finish = document.getElementById("finish");
  var result = document.getElementById("plan-result");
  var current = 1;

  function show(step) {
    current = step;
    steps.forEach(function (el) { el.hidden = Number(el.getAttribute("data-step")) !== step; });
    markers.forEach(function (el, i) {
      if (i + 1 < step) el.setAttribute("data-state", "done");
      else if (i + 1 === step) el.setAttribute("data-state", "active");
      else el.removeAttribute("data-state");
    });
    back.hidden = step === 1;
    next.hidden = step === steps.length;
    finish.hidden = step !== steps.length;
  }

  next.addEventListener("click", function () { show(Math.min(current + 1, steps.length)); });
  back.addEventListener("click", function () { show(Math.max(current - 1, 1)); });

  var TIERS = {
    website: { name: "AI Website App", price: "$3,000", href: "#website" },
    community: { name: "Community App", price: "$6,000", href: "#community" },
    custom: { name: "Custom AI App", price: "$12,000", href: "#custom" }
  };

  var LABELS = {
    login: "Member login", content: "Training or content", scheduling: "Booking or scheduling",
    agent: "AI Agent", workflow: "Workflows", payments: "Payments",
    integrations: "Integrations", dashboard: "Dashboards"
  };

  function recommend(data, needs) {
    var reasons = [];
    var heavy = ["workflow", "dashboard", "integrations", "payments"].filter(function (n) { return needs.indexOf(n) > -1; });
    var member = ["login", "content"].filter(function (n) { return needs.indexOf(n) > -1; });
    var tier = "website";

    if (heavy.length >= 2 || data.audience === "mixed" || data.audience === "staff") {
      tier = "custom";
      if (heavy.length >= 2) reasons.push("you need more than one of workflows, dashboards, payments or integrations, which means real permissions and a data model rather than a set of pages");
      if (data.audience === "mixed") reasons.push("several different groups use it, so user types are part of the build rather than an afterthought");
      if (data.audience === "staff") reasons.push("staff tools live or die on workflow detail, which is where the custom level spends its budget");
    } else if (member.length || data.audience === "members") {
      tier = "community";
      if (data.audience === "members") reasons.push("your users are members rather than one-off customers, so an account is the centre of the product");
      if (needs.indexOf("content") > -1) reasons.push("training or gated content needs somewhere for progress to live");
    } else {
      reasons.push("the job is a front door — capture, answer, schedule — which the website level covers without extra machinery");
    }

    if (data.today === "spreadsheet") reasons.push("the shared spreadsheet is usually the real brief; replacing it properly is most of the value");
    if (data.today === "manual" && tier === "website") reasons.push("moving from phone and paper to a working flow is the quickest win available to you");
    if (needs.indexOf("agent") > -1) reasons.push("an AI Agent can be included at any level — the difference is how much of your system it can reach");

    return { tier: tier, reasons: reasons };
  }

  function tokenNote(data) {
    if (data.token === "no") return "You said one-off transactions. We would not recommend adding digital utility, and we would rather say so now.";
    if (data.token === "yes") return "Strong candidate. Repeat participation is exactly the pattern where digital utility earns its keep — worth scoping alongside the app rather than bolting on later.";
    return "Worth a short conversation rather than a decision today.";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var data = {
      what: (fd.get("what") || "").trim(),
      audience: fd.get("audience") || "",
      job: (fd.get("job") || "").trim(),
      today: fd.get("today") || "",
      token: fd.get("token") || ""
    };
    var needs = fd.getAll("needs");

    if (!data.what || !data.audience || !data.job) {
      UI.toast({ kind: "warn", title: "A few gaps", body: "Questions 1, 2 and 3 do most of the work. Fill those in and the plan will be worth reading." });
      return;
    }

    var out = recommend(data, needs);
    var tier = TIERS[out.tier];
    var amount = (window.NOLMT_CONFIG.rewardActions.filter(function (a) { return a.action_id === "app_plan_completed"; })[0] || {}).reward_amount;

    result.hidden = false;
    result.innerHTML =
      '<div class="formcard mt-3">' +
        '<p class="eyebrow">Your plan</p>' +
        "<h2>" + tier.name + " — " + tier.price + "</h2>" +
        '<p class="lede">Based on what you described: ' + data.what.replace(/</g, "&lt;") + ".</p>" +
        "<h3 class='mt-2'>Why this level</h3><ul>" +
          out.reasons.map(function (r) { return "<li>" + r + "</li>"; }).join("") + "</ul>" +
        (needs.length ? "<h3 class='mt-2'>What we would build</h3><div class='chips'>" +
          needs.map(function (n) { return '<span class="tag">' + LABELS[n] + "</span>"; }).join("") + "</div>" : "") +
        "<h3 class='mt-2'>Digital utility</h3><p>" + tokenNote(data) + "</p>" +
        "<h3 class='mt-2'>What happens next</h3>" +
        "<p>A recommendation from six answers is a starting point, not a quote. Integrations, data migration and compliance are the three things that most often move a build up a level.</p>" +
        '<div class="btn-row mt-2">' +
          '<button class="btn" type="button" data-earn="app_plan_completed" data-earn-done="Reward recorded">Save my plan · earn ' + amount + " NOLMT</button>" +
          '<a class="btn btn--ghost" href="book.html">Book a discovery call</a>' +
        "</div>" +
      "</div>";

    result.setAttribute("tabindex", "-1");
    result.focus();
    result.scrollIntoView({ block: "start", behavior: "smooth" });
  });

  show(1);
})();
