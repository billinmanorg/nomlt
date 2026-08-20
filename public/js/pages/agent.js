/* ==========================================================================
   NOLMT AI GUIDE
   --------------------------------------------------------------------------
   A guided conversation that asks about the visitor's business and shows what
   NOLMT could build for them. It runs entirely in the browser from the script
   below — it does not call a language model, and it never claims to.

   To connect a real model, replace `respond()` with a call to your own
   endpoint. Keep the model, provider and prompt server-side.
   ========================================================================== */
(function () {
  "use strict";

  var panels = Array.prototype.slice.call(document.querySelectorAll("[data-agent]"));
  if (!panels.length) return;

  var SECTORS = {
    trades: { label: "Trades or services", agent: "a booking and quoting agent", app: "AI Website App",
      job: "answer the same questions, qualify the job and offer real appointment times" },
    community: { label: "A community or association", agent: "a member support agent", app: "Community App",
      job: "answer member questions from your own material, and keep training and events in one place" },
    coaching: { label: "Coaching or training", agent: "a learner support agent", app: "Community App",
      job: "guide people through your programme and answer the questions that repeat every cohort" },
    property: { label: "Real estate or mortgage", agent: "a client education agent", app: "Custom AI App",
      job: "explain the process, capture what you need up front and keep clients moving" },
    retail: { label: "Retail or ecommerce", agent: "a customer service agent", app: "AI Website App",
      job: "handle order questions and product help without a queue" },
    other: { label: "Something else", agent: "a customer-facing agent", app: "AI App",
      job: "take the repetitive part of the day off your team" }
  };

  var PAINS = {
    questions: { label: "Answering the same questions", line: "Repetition is the easiest thing to hand over — and the fastest to see working." },
    leads: { label: "Following up with leads", line: "Speed matters more than polish here. Most enquiries go to whoever answers first." },
    admin: { label: "Admin and paperwork", line: "Drafting is a good fit. Approving stays with a person." },
    training: { label: "Training people", line: "Learning works well when it lives where people already are." },
    scattered: { label: "Everything is scattered", line: "One place to sign in usually beats three tools that nearly talk to each other." }
  };

  function esc(t) { return String(t).replace(/[<>&]/g, function (c) { return { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]; }); }

  function init(panel) {
    var log = panel.querySelector("[data-agent-log]");
    var replies = panel.querySelector("[data-agent-replies]");
    var form = panel.querySelector("[data-agent-form]");
    var input = form ? form.querySelector("input") : null;
    var state = { step: 0, sector: null, pain: null, name: null };

    function scroll() { log.scrollTop = log.scrollHeight; }

    function say(text, cls) {
      var el = document.createElement("div");
      el.className = "msg msg--" + (cls || "agent");
      el.innerHTML = text;
      log.appendChild(el);
      scroll();
      return el;
    }

    function typing(then, delay) {
      var el = document.createElement("div");
      el.className = "msg msg--agent msg--typing";
      el.innerHTML = "<i></i><i></i><i></i>";
      el.setAttribute("aria-hidden", "true");
      log.appendChild(el);
      scroll();
      window.setTimeout(function () { el.remove(); then(); }, delay || 620);
    }

    function offer(options) {
      replies.innerHTML = "";
      options.forEach(function (o) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "reply";
        b.textContent = o.label;
        b.addEventListener("click", function () { choose(o); });
        replies.appendChild(b);
      });
      replies.hidden = false;
    }

    function choose(option) {
      say(esc(option.label), "user");
      replies.hidden = true;
      replies.innerHTML = "";
      if (option.href) { window.location.href = option.href; return; }
      advance(option.value);
    }

    /* The whole conversation, in one place. */
    function advance(value) {
      if (state.step === 0) {
        state.sector = value;
        state.step = 1;
        typing(function () {
          say("Good. What takes up the most time right now?");
          offer(Object.keys(PAINS).map(function (k) { return { label: PAINS[k].label, value: k }; }));
        });
        return;
      }

      if (state.step === 1) {
        state.pain = value;
        state.step = 2;
        typing(function () {
          say(PAINS[value].line);
          typing(function () {
            say("Last one — how many people would use it?");
            offer([
              { label: "Just me", value: "solo" },
              { label: "A small team", value: "team" },
              { label: "Hundreds", value: "hundreds" },
              { label: "Thousands", value: "thousands" }
            ]);
          }, 700);
        });
        return;
      }

      if (state.step === 2) {
        state.size = value;
        state.step = 3;
        summarise();
      }
    }

    function summarise() {
      var sector = SECTORS[state.sector] || SECTORS.other;
      var tier = sector.app;
      if (state.size === "thousands" || state.pain === "admin") tier = "Custom AI App";
      if (state.size === "solo" && tier === "Custom AI App") tier = "Community App";

      typing(function () {
        say("<strong>We can build something like this.</strong>");
        typing(function () {
          say("For " + esc(sector.label.toLowerCase()) + ", that usually starts as <strong>" + esc(sector.agent) +
              "</strong> that can " + esc(sector.job) + ".");
          typing(function () {
            say("Given the size, the sensible shape is a <strong>" + esc(tier) +
                "</strong>. Where people come back regularly, we can add digital utility so participation earns something they can use.");
            offer([
              { label: "Build my agent", href: "ai-agents.html#build" },
              { label: "See app options", href: "ai-app-development.html" },
              { label: "Book a discovery call", href: "book.html" }
            ]);
            if (form) form.hidden = true;
          }, 900);
        }, 900);
      });
    }

    /* Free text is accepted, matched loosely, and never pretended to be more
       than it is. */
    function respond(text) {
      var t = text.toLowerCase();
      if (state.step === 0) {
        var guess = Object.keys(SECTORS).filter(function (k) {
          return t.indexOf(k) > -1 || t.indexOf(SECTORS[k].label.toLowerCase().split(" ")[0]) > -1;
        })[0];
        if (guess) { advance(guess); return; }
        typing(function () {
          say("Got it. Which of these is closest?");
          offer(Object.keys(SECTORS).map(function (k) { return { label: SECTORS[k].label, value: k }; }));
        });
        return;
      }
      typing(function () {
        say("Noted. Pick whichever is closest and I will keep going.");
      });
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var text = (input.value || "").trim();
        if (!text) return;
        say(esc(text), "user");
        input.value = "";
        replies.hidden = true;
        respond(text);
      });
    }

    /* Opening line */
    typing(function () {
      say("Hi. What would you like AI to help you do?");
      typing(function () {
        say("Tell me what kind of business or community you run.");
        offer(Object.keys(SECTORS).map(function (k) { return { label: SECTORS[k].label, value: k }; }));
      }, 700);
    }, 500);
  }

  panels.forEach(init);
})();
