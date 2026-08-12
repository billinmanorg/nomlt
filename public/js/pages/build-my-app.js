/* App Builder — three steps, then a written plan and the reward. */
(function () {
  "use strict";

  var UI = window.NOLMT;
  var form = document.getElementById("builder");
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll("[data-step]"));
  var markers = Array.prototype.slice.call(document.querySelectorAll("#stepper li"));
  var back = document.getElementById("back");
  var next = document.getElementById("next");
  var finish = document.getElementById("finish");
  var plan = document.getElementById("plan");
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
    form.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  next.addEventListener("click", function () { show(Math.min(current + 1, steps.length)); });
  back.addEventListener("click", function () { show(Math.max(current - 1, 1)); });

  var TIERS = {
    website: { name: "AI Website App", price: "$3,000", anchor: "ai-app-development.html#website" },
    community: { name: "Community App", price: "$6,000", anchor: "ai-app-development.html#community" },
    custom: { name: "Custom AI App", price: "$12,000", anchor: "ai-app-development.html#custom" }
  };

  function recommend(data, needs) {
    var reasons = [];
    var tier = "website";

    var heavy = ["workflow", "agents", "integrations", "payments"].filter(function (n) { return needs.indexOf(n) > -1; });
    var communityish = ["login", "content"].filter(function (n) { return needs.indexOf(n) > -1; });

    if (heavy.length >= 2 || data.audience === "mixed" || data.audience === "staff") {
      tier = "custom";
      if (heavy.length >= 2) reasons.push("you need more than one of workflows, agents, payments or integrations, which means real permissions and a data model rather than a set of pages");
      if (data.audience === "mixed") reasons.push("several different groups use it, so user types and permissions are part of the build, not an afterthought");
      if (data.audience === "staff") reasons.push("staff-facing tools live or die on workflow detail, which is where the custom level spends its budget");
    } else if (communityish.length || data.audience === "members") {
      tier = "community";
      if (data.audience === "members") reasons.push("your users are members rather than one-off customers, so an account is the centre of the product");
      if (needs.indexOf("content") > -1) reasons.push("training or gated content needs somewhere for progress to live");
    } else {
      reasons.push("the job is a front door — capture, answer, schedule — which the website level covers without extra machinery");
    }

    if (data.today === "spreadsheet") reasons.push("the shared spreadsheet is usually the real brief; replacing it properly is most of the value");
    if (data.today === "manual" && tier === "website") reasons.push("moving from phone and paper to a working flow is the quickest win available to you");
    if (data.size === "xl" && tier !== "custom") reasons.push("at your scale, expect a conversation about load and support before launch");

    return { tier: tier, reasons: reasons };
  }

  function tokenNote(data, needs) {
    if (data.token === "no") {
      return "You said one-off transactions with nothing to unlock. We would not recommend tokenization, and we would rather say so now than sell you something that quietly does nothing.";
    }
    if (data.token === "yes" && (data.audience === "members" || needs.indexOf("content") > -1)) {
      return "Strong candidate. Repeat participation plus content worth unlocking is exactly the pattern where a utility token earns its keep. Worth scoping alongside the app rather than bolting on later.";
    }
    if (data.token === "maybe" || data.token === "unsure") {
      return "Worth twenty minutes, not a decision today. The four-question assessment on the tokenization page will tell you more than a sales call.";
    }
    return "Possible, but it depends on whether people come back often enough for a balance to accumulate into something useful.";
  }

  var LABELS = {
    login: "Member login", content: "Training or content", scheduling: "Booking or scheduling",
    assistant: "AI assistant", workflow: "Workflows and approvals", payments: "Payments",
    integrations: "Integrations", agents: "AI agents"
  };

  var WHEN = {
    asap: "You want it live as soon as possible, so the first conversation should be about what can be cut from version one.",
    quarter: "A three-month horizon is comfortable for any of the three levels.",
    year: "There is room to do the discovery properly and launch with the right scope.",
    exploring: "No pressure — the plan below is yours whether or not anything happens next."
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var data = {
      what: (fd.get("what") || "").trim(),
      audience: fd.get("audience") || "",
      size: fd.get("size") || "",
      job: (fd.get("job") || "").trim(),
      today: fd.get("today") || "",
      win: fd.get("win") || "",
      token: fd.get("token") || "",
      when: fd.get("when") || ""
    };
    var needs = fd.getAll("needs");

    if (!data.what || !data.audience || !data.job) {
      UI.toast({
        kind: "warn",
        title: "A few gaps",
        body: "Questions 1, 2 and 4 do the most work. Fill those in and the plan will be worth reading."
      });
      return;
    }

    var result = recommend(data, needs);
    var tier = TIERS[result.tier];

    plan.hidden = false;
    plan.innerHTML =
      '<div class="formcard mt-2">' +
        '<p class="eyebrow">Your plan</p>' +
        "<h2>" + tier.name + " — " + tier.price + "</h2>" +
        "<p class='lede'>Based on what you described: " + (data.what || "your business") + ".</p>" +
        "<h3 class='mt-2'>Why this level</h3>" +
        "<ul>" + result.reasons.map(function (r) { return "<li>" + r + "</li>"; }).join("") + "</ul>" +
        (needs.length ? "<h3 class='mt-2'>What we would build</h3><div class='chips'>" +
          needs.map(function (n) { return '<span class="tag">' + LABELS[n] + "</span>"; }).join("") + "</div>" : "") +
        "<h3 class='mt-2'>The job in your words</h3>" +
        "<p class='muted'>" + data.job.replace(/</g, "&lt;") + "</p>" +
        "<h3 class='mt-2'>Tokenization</h3>" +
        "<p>" + tokenNote(data, needs) + "</p>" +
        "<h3 class='mt-2'>What would change this</h3>" +
        "<p>" + (WHEN[data.when] || "Timing is open.") + " A recommendation made from nine answers is a starting point, not a quote — integrations, data migration and compliance are the three things that most often move a build up a level.</p>" +
        '<div class="btn-row mt-2">' +
          '<button class="btn btn--gold" type="button" data-earn="app_builder_completed" data-earn-done="Reward recorded">Save my plan · earn <span>' +
            (window.NOLMT_CONFIG.rewardActions.filter(function (a) { return a.action_id === "app_builder_completed"; })[0] || {}).reward_amount +
          "</span> NOLMT</button>" +
          '<a class="btn btn--ghost" href="' + tier.anchor + '">See what is included</a>' +
        "</div>" +
      "</div>";

    plan.setAttribute("tabindex", "-1");
    plan.focus();
    plan.scrollIntoView({ block: "start", behavior: "smooth" });
  });

  show(1);
})();
