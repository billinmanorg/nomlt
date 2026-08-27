/* ==========================================================================
   ALICE — NOLMT AI Agent
   --------------------------------------------------------------------------
   Two entry tracks, one destination.

     "Build an AI Agent"  →  agent track
     "Build a Web App"    →  app track
                          →  a discovery call with our team

   Alice introduces herself, asks what the business is, asks whether the goal
   is saving time or generating revenue, explains what NOLMT can do for that
   combination, and then asks for the call.

   This runs entirely from the script below. It does not call a language model.
   To connect a real one, replace `reply()` with a request to your own endpoint
   and keep the model, provider and prompts server-side.
   ========================================================================== */
(function () {
  "use strict";

  var SECTORS = {
    trades: {
      label: "Trades or services",
      agent: "answer the same questions all day, qualify the job and offer real appointment times",
      app: "AI Website App",
      time: "Most of the day disappears into the phone. An agent answers first, every time, and only passes you the real jobs.",
      revenue: "Most enquiries go to whoever replies first. Answering at 9pm on a Sunday is worth more than a better logo."
    },
    community: {
      label: "A community or association",
      agent: "answer member questions from your own handbook and keep training and events in one place",
      app: "Community App",
      time: "The same twenty questions come round every month. An agent answers them from your own material instead of your inbox.",
      revenue: "Members who feel looked after renew. An agent that always answers is retention work that runs itself."
    },
    coaching: {
      label: "Coaching or training",
      agent: "guide people through your programme and answer the questions that repeat every cohort",
      app: "Community App",
      time: "You are answering the same onboarding questions for every intake. That is the first thing to hand over.",
      revenue: "People who finish the programme buy the next one. An agent keeps them moving through it."
    },
    property: {
      label: "Real estate or mortgage",
      agent: "explain the process, gather what you need up front and keep clients moving",
      app: "Custom AI App",
      time: "Chasing documents is the job nobody wants. An agent can chase politely and never forget.",
      revenue: "Clients go quiet when they are confused. An agent that explains the next step keeps deals alive."
    },
    retail: {
      label: "Retail or ecommerce",
      agent: "handle order questions and product help without a queue",
      app: "AI Website App",
      time: "Where-is-my-order is most of your support volume, and an agent can settle it instantly.",
      revenue: "Answering a product question in the moment is often the difference between a sale and a closed tab."
    },
    other: {
      label: "Something else",
      agent: "take the repetitive, customer-facing part of the day off your team",
      app: "AI App",
      time: "Almost every business has a handful of tasks done twenty times a week. Those are the ones to hand over first.",
      revenue: "Faster answers and better follow-up move the numbers before anything clever does."
    }
  };

  function esc(t) {
    return String(t).replace(/[<>&]/g, function (c) {
      return { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c];
    });
  }

  function init(panel) {
    var log = panel.querySelector("[data-agent-log]");
    var replies = panel.querySelector("[data-agent-replies]");
    var form = panel.querySelector("[data-agent-form]");
    var input = form ? form.querySelector("input") : null;

    var state = { track: panel.getAttribute("data-track") || "agent", step: "intro", sector: null, goal: null };

    function scroll() { log.scrollTop = log.scrollHeight; }

    function say(html, who) {
      var el = document.createElement("div");
      el.className = "msg msg--" + (who || "agent");
      el.innerHTML = html;
      log.appendChild(el);
      scroll();
    }

    function typing(then, delay) {
      var el = document.createElement("div");
      el.className = "msg msg--agent msg--typing";
      el.innerHTML = "<i></i><i></i><i></i>";
      el.setAttribute("aria-hidden", "true");
      log.appendChild(el);
      scroll();
      window.setTimeout(function () { el.remove(); then(); }, delay || 700);
    }

    function offer(options) {
      replies.innerHTML = "";
      options.forEach(function (o) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "reply" + (o.go ? " reply--go" : "");
        b.textContent = o.label;
        b.addEventListener("click", function () {
          if (o.href) { window.location.href = o.href; return; }
          say(esc(o.label), "user");
          replies.hidden = true;
          replies.innerHTML = "";
          advance(o.value);
        });
        replies.appendChild(b);
      });
      replies.hidden = false;
      scroll();
    }

    function advance(value) {
      if (state.step === "intro") {
        state.step = "sector";
        typing(function () {
          say("Great. Tell me about your business — what business are you in?");
          offer(Object.keys(SECTORS).map(function (k) {
            return { label: SECTORS[k].label, value: k };
          }));
        });
        return;
      }

      if (state.step === "sector") {
        state.sector = value;
        state.step = "goal";
        typing(function () {
          say("Got it. Are you looking to save time, or generate revenue?");
          offer([
            { label: "Save time", value: "time" },
            { label: "Generate revenue", value: "revenue" },
            { label: "Honestly, both", value: "both" }
          ]);
        });
        return;
      }

      if (state.step === "goal") {
        state.goal = value;
        state.step = "pitch";
        pitch();
        return;
      }

      if (state.step === "pitch") {
        if (value === "more") { more(); return; }
        if (value === "restart") { window.location.reload(); }
      }
    }

    function pitch() {
      var sector = SECTORS[state.sector] || SECTORS.other;
      var line = state.goal === "revenue" ? sector.revenue
               : state.goal === "time" ? sector.time
               : sector.time + " " + sector.revenue;

      typing(function () {
        say(line);
        typing(function () {
          if (state.track === "app") {
            say("For a business like yours, that usually starts as a <strong>" + esc(sector.app) +
                "</strong> — with an agent built into it, so the app does the work and the agent handles the conversation.");
          } else {
            say("An agent for you would " + esc(sector.agent) +
                ". It answers from your own material, and hands over to a person the moment something needs judgement.");
          }
          typing(function () {
            say("The best next step is a short discovery call with <strong>our team</strong>. Twenty minutes, and you will leave knowing what it would take to build — or that you do not need us.");
            offer([
              { label: "Book a discovery call", href: "book.html", go: true },
              { label: "Tell me more first", value: "more" }
            ]);
          }, 950);
        }, 950);
      });
    }

    function more() {
      typing(function () {
        if (state.track === "app") {
          say("There are three levels. A <strong>website app</strong> for a front door that actually does things. A <strong>community app</strong> for members, training and events. And a <strong>custom AI app</strong> when the workflow itself is the product.");
        } else {
          say("An agent can live on your website, inside your app, and in your community — sharing the same knowledge. It answers from documents you control, says when it does not know, and drafts work rather than deciding anything with money or safety attached.");
        }
        typing(function () {
          say("Where people come back regularly, we can also add digital utility, so taking part earns something they can use.");
          typing(function () {
            say("Our team can walk you through the whole thing properly. Shall I point you at the calendar?");
            offer([
              { label: "Book a discovery call", href: "book.html", go: true },
              { label: state.track === "app" ? "See app options" : "More about AI Agents",
                href: state.track === "app" ? "ai-app-development.html" : "ai-agents.html" },
              { label: "Start over", value: "restart" }
            ]);
          }, 900);
        }, 950);
      });
    }

    function reply(text) {
      var t = text.toLowerCase();

      if (state.step === "intro") { advance("yes"); return; }

      if (state.step === "sector") {
        var guess = Object.keys(SECTORS).filter(function (k) {
          return t.indexOf(k) > -1 || t.indexOf(SECTORS[k].label.toLowerCase().split(" ")[0]) > -1;
        })[0];
        if (guess) { advance(guess); return; }
        typing(function () {
          say("Thanks. Which of these is closest?");
          offer(Object.keys(SECTORS).map(function (k) { return { label: SECTORS[k].label, value: k }; }));
        });
        return;
      }

      if (state.step === "goal") {
        if (t.indexOf("time") > -1) { advance("time"); return; }
        if (t.indexOf("revenue") > -1 || t.indexOf("money") > -1 || t.indexOf("sales") > -1) { advance("revenue"); return; }
        advance("both");
        return;
      }

      typing(function () {
        say("Our team is the right place for that one. A short call will get you a proper answer.");
        offer([
          { label: "Book a discovery call", href: "book.html", go: true },
          { label: "Start over", value: "restart" }
        ]);
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
        reply(text);
      });
    }

    function start(track) {
      state.track = track || state.track;
      state.step = "intro";
      state.sector = null;
      state.goal = null;
      log.innerHTML = "";
      typing(function () {
        say("Good day! My name is <strong>Alice</strong> and I am an AI Agent.");
        typing(function () {
          say("Would you like to learn more about what " +
              (state.track === "app" ? "an AI App" : "an AI Agent") +
              " can do for your business?");
          offer([
            { label: "Yes, tell me", value: "yes" },
            { label: "What is " + (state.track === "app" ? "an AI App" : "an AI Agent") + "?", value: "yes" }
          ]);
        }, 850);
      }, 550);
    }

    panel.nolmtStart = start;
    start(state.track);
  }

  var panels = Array.prototype.slice.call(document.querySelectorAll("[data-agent]"));
  panels.forEach(init);

  /* The two big boxes hand the conversation its track, then scroll to it. */
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-start-agent]");
    if (!trigger) return;
    e.preventDefault();
    var track = trigger.getAttribute("data-start-agent");
    var panel = document.querySelector("[data-agent]");
    if (!panel) return;
    panel.setAttribute("data-track", track);
    var title = panel.querySelector("[data-agent-title]");
    if (title) {
      title.innerHTML = "Alice<small>NOLMT AI Agent &middot; " +
        (track === "app" ? "AI Apps" : "AI Agents") + "</small>";
    }
    if (panel.nolmtStart) panel.nolmtStart(track);

    /* Land on the conversation, clear of the sticky header. */
    var header = document.querySelector(".masthead");
    var offset = (header ? header.offsetHeight : 0) + 16;
    var top = panel.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    var field = panel.querySelector("[data-agent-form] input");
    if (field) window.setTimeout(function () { field.focus({ preventScroll: true }); }, 700);
  });
})();
