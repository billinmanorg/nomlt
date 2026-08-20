/* ==========================================================================
   NOLMT — site behaviour
   Pages declare intent with data attributes; this file wires them to the API.
   ========================================================================== */
(function () {
  "use strict";

  var CONFIG = window.NOLMT_CONFIG;
  var API = window.NOLMT_API;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }

  function shortAddress(a) {
    return a ? a.slice(0, 4) + "..." + a.slice(-4) : "";
  }

  function timeAgo(iso) {
    var diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + " min ago";
    if (diff < 86400) return Math.floor(diff / 3600) + " hr ago";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  /* ---------------------------------------------------------------------
     Toasts
     --------------------------------------------------------------------- */
  function toastStack() {
    var stack = $(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("role", "status");
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    return stack;
  }

  function toast(opts) {
    var el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("data-kind", opts.kind || "reward");
    var html = "<b>" + opts.title + "</b>";
    if (opts.body) html += "<span>" + opts.body + "</span>";
    if (opts.linkHref) html += '<span style="margin-top:.5rem"><a href="' + opts.linkHref + '">' + opts.linkText + "</a></span>";
    el.innerHTML = html;
    toastStack().appendChild(el);
    window.setTimeout(function () {
      el.style.transition = "opacity .4s, transform .4s";
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      window.setTimeout(function () { el.remove(); }, 400);
    }, opts.ms || 6000);
  }

  /* ---------------------------------------------------------------------
     "You just experienced tokenization" — shown once, after a first earn
     --------------------------------------------------------------------- */
  function showTokenizationCallout() {
    if ($(".modal-veil")) return;
    var veil = document.createElement("div");
    veil.className = "modal-veil";
    veil.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="jx-t">' +
        '<button class="modal__close" type="button" aria-label="Close">&times;</button>' +
        '<p class="eyebrow">Digital utility</p>' +
        '<h3 id="jx-t">You just experienced tokenization.</h3>' +
        "<p>You completed something useful and earned digital utility. No wallet, no purchase.</p>" +
        "<p>Your business or community could create an experience like this too.</p>" +
        '<div class="btn-row mt-1">' +
          '<a class="btn" href="tokenization.html">Tokenize my business</a>' +
          '<button class="btn btn--ghost" type="button" data-dismiss>Keep exploring</button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(veil);

    function close() {
      veil.remove();
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    veil.addEventListener("click", function (e) {
      if (e.target === veil || e.target.closest("[data-dismiss], .modal__close")) close();
    });
    document.addEventListener("keydown", onKey);
    $(".modal__close", veil).focus();
    API.markCalloutSeen();
  }

  /* ---------------------------------------------------------------------
     Header rewards indicator
     --------------------------------------------------------------------- */
  function refreshPill() {
    var pills = $$("[data-nolmt-pill]");
    if (!pills.length) return Promise.resolve();
    return Promise.all([API.session(), API.balance()]).then(function (r) {
      var user = r[0].user, bal = r[1];
      pills.forEach(function (pill) {
        if (user) {
          pill.innerHTML = '<span class="dot"></span><span class="pill-label">NOLMT</span> <b>' + fmt(bal.total) + "</b>";
          pill.setAttribute("href", "my-nolmt.html");
          pill.setAttribute("aria-label", "Your NOLMT rewards: " + bal.total + " total. Open My NOLMT.");
        } else {
          pill.innerHTML = '<span class="dot"></span><span class="pill-label">Your</span> NOLMT';
          pill.setAttribute("href", "my-nolmt.html");
          pill.setAttribute("aria-label", "Your NOLMT");
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
     Journey rail — the signature element
     --------------------------------------------------------------------- */
  function renderRail(root) {
    var stages = CONFIG.journey;
    var x0 = 70, x1 = 1130, y0 = 96, y1 = 96, baseline = 150;
    var svg = [
      '<svg class="rail__svg" viewBox="0 0 1200 240" role="img" aria-label="The NOLMT participation journey">',
      '<defs><linearGradient id="railgrad" x1="0" y1="0" x2="1" y2="0">',
      '<stop offset="0%" stop-color="#1E90FF"/><stop offset="55%" stop-color="#11C5FF"/>',
      '<stop offset="100%" stop-color="#21E6D8"/></linearGradient></defs>',
      '<path class="track" d="M' + x0 + " " + y0 + " L" + x1 + " " + y1 + '"/>',
      '<path class="live" pathLength="100" d="M' + x0 + " " + y0 + " L" + x1 + " " + y1 + '"/>'
    ];
    var list = ['<ul class="rail__list">'];

    stages.forEach(function (s, i) {
      var t = stages.length === 1 ? 0 : i / (stages.length - 1);
      var x = x0 + t * (x1 - x0);
      var y = y0 + t * (y1 - y0);
      svg.push('<circle class="node" data-stage="' + s.id + '" cx="' + x + '" cy="' + y + '" r="8"/>');
      svg.push('<text class="label" data-stage="' + s.id + '" x="' + x + '" y="' + baseline + '" text-anchor="middle">' + s.label.toUpperCase() + "</text>");
      list.push('<li data-stage="' + s.id + '">' + s.label + "</li>");
    });

    svg.push("</svg>");
    list.push("</ul>");
    root.innerHTML = svg.join("") + list.join("");
  }

  function refreshRail() {
    var rails = $$("[data-rail]");
    if (!rails.length) return Promise.resolve();
    return API.journey().then(function (state) {
      var stages = CONFIG.journey;
      var done = 0;
      for (var i = 0; i < stages.length; i++) {
        if (state[stages[i].id]) done = i; else break;
      }
      var progress = stages.length > 1 ? done / (stages.length - 1) : 0;

      rails.forEach(function (rail) {
        $$("[data-stage]", rail).forEach(function (node) {
          var id = node.getAttribute("data-stage");
          if (state[id]) node.setAttribute("data-state", "done");
          else node.removeAttribute("data-state");
        });
        var live = $(".live", rail);
        if (live) live.style.strokeDashoffset = String(100 - progress * 100);
        var status = rail.parentNode ? $(".rail__status", rail.parentNode) : null;
        if (status) {
          status.textContent = "Stage " + (done + 1) + " of " + stages.length + " — " + stages[done].label;
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
     Earning
     --------------------------------------------------------------------- */
  function handleEarn(btn) {
    var actionId = btn.getAttribute("data-earn");
    var action = API.actionById(actionId);
    btn.setAttribute("aria-disabled", "true");

    API.submitEvent(actionId, { surface: document.body.getAttribute("data-page") }).then(function (res) {
      btn.removeAttribute("aria-disabled");

      if (!res.ok) {
        if (res.requiresAccount) {
          toast({
            kind: "info",
            title: "Account needed",
            body: res.message,
            linkHref: "account.html",
            linkText: "Create an account"
          });
        } else {
          toast({ kind: "warn", title: "Not this time", body: res.message });
        }
        return;
      }

      var done = btn.getAttribute("data-earn-done");
      if (done) { btn.textContent = done; btn.setAttribute("aria-disabled", "true"); }

      if (res.status === "CLAIMABLE") {
        toast({
          title: "+" + res.amount + " NOLMT",
          body: res.label + " — added to your available balance.",
          linkHref: "my-nolmt.html",
          linkText: "See why"
        });
      } else {
        toast({
          kind: "info",
          title: "+" + res.amount + " NOLMT pending",
          body: res.blocked_on === "email_verification"
            ? "Verify your email and this becomes available."
            : "Subject to verification before it becomes available.",
          linkHref: "my-nolmt.html",
          linkText: "See why"
        });
      }

      refreshAll();
      API.calloutSeen().then(function (seen) {
        if (!seen) window.setTimeout(showTokenizationCallout, 900);
      });
    });

    if (action && !action.enabled) btn.removeAttribute("aria-disabled");
  }

  function handleUse(btn) {
    var id = btn.getAttribute("data-use");
    btn.setAttribute("aria-disabled", "true");
    API.useUtility(id).then(function (res) {
      btn.removeAttribute("aria-disabled");
      if (!res.ok) {
        toast({
          kind: "warn",
          title: "Not unlocked",
          body: res.message,
          linkHref: res.requiresAccount ? "account.html" : "my-nolmt.html",
          linkText: res.requiresAccount ? "Create an account" : "My NOLMT"
        });
        return;
      }
      toast({
        title: "Unlocked",
        body: res.utility.name + " — " + res.utility.cost + " NOLMT used.",
        linkHref: "my-nolmt.html",
        linkText: "View activity"
      });
      refreshAll();
    });
  }

  /* ---------------------------------------------------------------------
     Config-driven lists
     --------------------------------------------------------------------- */
  function renderEarnGrid(root) {
    var only = (root.getAttribute("data-earn-grid") || "").trim();
    var ids = only ? only.split(/\s*,\s*/) : null;
    var actions = CONFIG.rewardActions.filter(function (a) {
      return a.enabled && (!ids || ids.indexOf(a.action_id) > -1);
    });
    root.innerHTML = actions.map(function (a) {
      return '<article class="card">' +
        '<p class="amount grad">' + a.reward_amount + ' <small>NOLMT</small></p>' +
        "<h3>" + a.action_name + "</h3>" +
        "<p>" + a.description + "</p>" +
        "</article>";
    }).join("");
  }

  function renderUseGrid(root) {
    var limit = parseInt(root.getAttribute("data-use-grid-limit") || "0", 10);
    var list = CONFIG.utilityActions.filter(function (u) { return u.enabled; });
    if (limit) list = list.slice(0, limit);
    root.innerHTML = list.map(function (u) {
      return '<article class="card">' +
        '<p class="amount grad">' + u.cost + ' <small>NOLMT</small></p>' +
        "<h3>" + u.name + "</h3>" +
        "<p>" + u.description + "</p>" +
        '<button class="textlink" type="button" data-use="' + u.utility_id + '">Use NOLMT</button>' +
        "</article>";
    }).join("");
  }

  function injectAmounts() {
    $$("[data-amount]").forEach(function (el) {
      var a = API.actionById(el.getAttribute("data-amount"));
      if (a) el.textContent = a.reward_amount;
    });
    $$("[data-cost]").forEach(function (el) {
      var u = API.utilityById(el.getAttribute("data-cost"));
      if (u) el.textContent = u.cost;
    });
    $$("[data-config]").forEach(function (el) {
      var path = el.getAttribute("data-config").split(".");
      var v = CONFIG;
      path.forEach(function (k) { v = v && v[k]; });
      el.textContent = (v === null || v === undefined) ? "not configured" : v;
    });
  }

  /* ---------------------------------------------------------------------
     Account state on the page
     --------------------------------------------------------------------- */
  function refreshAuthState() {
    return API.session().then(function (s) {
      var user = s.user;
      $$("[data-when='signed-in']").forEach(function (el) { el.hidden = !user; });
      $$("[data-when='signed-out']").forEach(function (el) { el.hidden = !!user; });
      $$("[data-when='unverified']").forEach(function (el) { el.hidden = !user || user.emailVerified; });
      $$("[data-when='verified']").forEach(function (el) { el.hidden = !user || !user.emailVerified; });
      $$("[data-user-email]").forEach(function (el) { el.textContent = user ? user.email : ""; });
      $$("[data-user-name]").forEach(function (el) { el.textContent = user ? user.name : ""; });
      return s;
    });
  }

  function refreshAll() {
    return Promise.all([refreshPill(), refreshRail(), refreshAuthState()])
      .then(function () {
        if (window.NOLMT_PAGE && typeof window.NOLMT_PAGE.refresh === "function") {
          return window.NOLMT_PAGE.refresh();
        }
      });
  }

  /* ---------------------------------------------------------------------
     Chrome
     --------------------------------------------------------------------- */
  function initNav() {
    var toggle = $(".navtoggle");
    var nav = $(".mainnav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
    });
  }

  function initReveal() {
    var items = $$("[data-reveal]");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  }

  function initDemoState() {
    if (!API.isDemo) return;
    $$("[data-demo-only]").forEach(function (el) { el.hidden = false; });
  }

  function init() {
    initNav();
    initReveal();
    initDemoState();
    injectAmounts();

    $$("[data-rail]").forEach(renderRail);
    $$("[data-earn-grid]").forEach(renderEarnGrid);
    $$("[data-use-grid], [data-use-grid-limit]").forEach(renderUseGrid);

    document.addEventListener("click", function (e) {
      var earn = e.target.closest("[data-earn]");
      if (earn) { e.preventDefault(); handleEarn(earn); return; }
      var use = e.target.closest("[data-use]");
      if (use) { e.preventDefault(); handleUse(use); }
    });

    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

    refreshAll();
  }

  window.NOLMT = {
    api: API, config: CONFIG, toast: toast, refresh: refreshAll,
    fmt: fmt, timeAgo: timeAgo, shortAddress: shortAddress, $: $, $$: $$
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
