/* ==========================================================================
   NOLMT redesign — homepage + landers
   --------------------------------------------------------------------------
   The "build my free preview" console is a scripted demonstration. It never
   calls the live chat endpoint and never touches Alice: Alice stays in
   js/pages/agent.js, unchanged. Buttons that should reach Alice use the
   existing data-start-agent hook that agent.js already listens for.
   ========================================================================== */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t).replace(/[<>&"]/g, function (c) { return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]; }); };

  function scrollToEl(el, block) {
    var header = $(".masthead");
    var off = (header ? header.offsetHeight : 0) + 12;
    var top = el.getBoundingClientRect().top + window.pageYOffset - off;
    if (block === "center") top -= Math.max(0, (window.innerHeight - off - el.offsetHeight) / 2);
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  /* ---------- "focus the website box" buttons ---------- */
  $$("[data-focus]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var input = document.getElementById(a.getAttribute("data-focus"));
      if (!input) return;
      e.preventDefault();
      scrollToEl(input, "center");
      setTimeout(function () { input.focus({ preventScroll: true }); }, 450);
    });
  });

  /* ---------- plan feature lists: open on desktop, collapsed on phones ---------- */
  var mq = window.matchMedia("(max-width:900px)");
  function syncIncl() { $$("details.r-incl").forEach(function (d) { d.open = !mq.matches; }); }
  syncIncl();
  if (mq.addEventListener) mq.addEventListener("change", syncIncl); else if (mq.addListener) mq.addListener(syncIncl);

  /* ---------- billing toggle ---------- */
  function setBill(annual) {
    $$("[data-bill]").forEach(function (b) { b.setAttribute("aria-pressed", String((b.getAttribute("data-bill") === "a") === annual)); });
    $$(".r-price[data-m]").forEach(function (p) { p.innerHTML = "$" + (annual ? p.getAttribute("data-a") : p.getAttribute("data-m")) + "<small>/mo</small>"; });
    $$(".r-plan .r-setup[data-setup]").forEach(function (s) {
      var kind = s.getAttribute("data-setup") || "scoped";
      if (kind === "none") s.innerHTML = annual ? "<b>No setup fee</b> · billed yearly" : "<b>No setup fee</b> · billed monthly";
      else s.innerHTML = annual ? "<s>Standard setup</s> <b>Setup waived</b> · billed yearly" : "Setup cost provided before purchase";
    });
  }
  $$("[data-bill]").forEach(function (b) { b.addEventListener("click", function () { setBill(b.getAttribute("data-bill") === "a"); }); });
  if ($("[data-bill]")) setBill(true);

  /* ---------- pricing tabs (AI Agents / AI Apps) ---------- */
  var tabBtns = $$("[data-tab]");
  function setTab(name) {
    if (!tabBtns.length) return;
    tabBtns.forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-tab") === name)); });
    $$(".r-panel").forEach(function (p) { p.hidden = p.id !== "panel-" + name; });
  }
  tabBtns.forEach(function (b) { b.addEventListener("click", function () { setTab(b.getAttribute("data-tab")); }); });
  if (tabBtns.length) {
    var h = (location.hash || "").replace("#", "");
    setTab(h === "apps" ? "apps" : "agents");
    window.addEventListener("hashchange", function () { var x = location.hash.replace("#", ""); if (x === "apps" || x === "agents") { setTab(x); } });
  }

  /* ---------- demo console ---------- */
  var con = $("[data-console]");
  if (!con) return;
  var chat = $("[data-c-chat]", con), steps = $("[data-c-steps]", con);
  var chips = $("[data-c-chips]", con), send = $("[data-c-send]", con);
  var save = $("[data-c-save]", con), replay = $("[data-c-replay]", con);
  var nameEl = $("[data-c-name]", con), subEl = $("[data-c-sub]", con);
  var isLander = !$(".r-roles", con);
  var domain = isLander ? "suncoasthomesteam.com" : "bayviewdental.com";
  var turns = 0, role = "desk", runId = 0, deskState = null;

  var nice = function (d) { return (d || "").replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].trim().toLowerCase() || "yourbusiness.com"; };
  var brand = function (d) { return d.split(".")[0].replace(/[-_]/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }); };

  function add(cls, html) {
    var m = document.createElement("div");
    m.className = "r-msg " + cls;
    m.innerHTML = html;
    chat.appendChild(m);
    chat.scrollTop = chat.scrollHeight;
    return m;
  }
  function typing() { return add("r-a", '<span class="r-typing"><i></i><i></i><i></i></span>'); }

  function build(raw) {
    if (!isLander && role !== "desk") setRole("desk");
    runId++;
    domain = nice(raw);
    turns = 0;
    save.classList.remove("r-show");
    nameEl.textContent = brand(domain) + " Assistant";
    subEl.textContent = "Your preview · trained on " + domain;
    var labels = [
      "Reading " + domain + " — found " + (12 + domain.length % 17) + " pages",
      isLander ? "Learning listings, areas & price ranges" : "Learning services, hours & prices",
      isLander ? "Writing showing & lead-scoring rules" : "Writing booking & hand-off rules",
      "Setting guardrails: never guesses, escalates to a person",
      "Agent ready"
    ];
    steps.hidden = false;
    steps.innerHTML = labels.map(function (l) { return '<li><span class="r-s"></span>' + esc(l) + "</li>"; }).join("");
    chat.innerHTML = "";
    chat.style.height = "300px";
    chips.hidden = true; send.hidden = true;
    var lis = $$("li", steps), i = 0, my = runId;
    (function next() {
      if (my !== runId) return;
      if (i > 0) lis[i - 1].className = "r-done";
      if (i < lis.length) { lis[i].className = "r-run"; i++; setTimeout(next, 650 + Math.random() * 350); }
      else {
        add("r-a", "Hi! I’m the new assistant for <b>" + esc(domain) + "</b>. Ask me anything a " + (isLander ? "buyer" : "customer") + " would — " + (isLander ? "listings, showings, financing" : "prices, hours, booking") + ". I’ll answer from your own site.");
        chips.hidden = false; send.hidden = false;
      }
    })();
    scrollToEl(con, "center");
  }

  $$("form[data-build]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = $("input", f).value || "yourbusiness.com";
      var target = f.getAttribute("data-target");
      if (target && document.getElementById(target)) document.getElementById(target).value = v;
      build(v);
    });
  });

  var answers = isLander ? [
    [/available|still|listing/i, function () { return "Yes, it’s still available. Are you pre-approved, or would you like an intro to a lender first?"; }],
    [/book|showing|saturday|see it|tour/i, function () { return "I have Saturday 10:30 or 1:00 open. Which works? I’ll text you a confirmation and the address."; }],
    [/know|wrong|sure/i, function (d) { return "If I’m not certain, I say so and pass you straight to an agent at " + esc(brand(d)) + " — with the whole conversation, so you never repeat yourself."; }]
  ] : [
    [/cost|price|how much/i, function (d) { return "Most first visits at " + esc(brand(d)) + " start with a free consultation. Want me to find you a time this week?"; }],
    [/book|tuesday|appointment|schedule/i, function () { return "I have Tuesday at 9:30 a.m. or 3:15 p.m. Which works? I’ll text you a confirmation."; }],
    [/know|wrong|sure/i, function (d) { return "If I’m not certain, I say so and pass you to a person on the " + esc(brand(d)) + " team — with the whole conversation, so you never repeat yourself."; }]
  ];
  function reply(q) {
    add("r-u", esc(q));
    var t = typing(); turns++;
    setTimeout(function () {
      var hit = answers.filter(function (a) { return a[0].test(q); })[0];
      t.innerHTML = hit ? hit[1](domain) : "Good question. Your live agent would answer that from " + esc(domain) + " and your documents. Want our team to set that up?";
      chat.scrollTop = chat.scrollHeight;
      if (turns >= 2) save.classList.add("r-show");
    }, 900);
  }
  $$("button[data-q]", con).forEach(function (b) { b.addEventListener("click", function () { reply(b.getAttribute("data-q")); }); });
  send.addEventListener("submit", function (e) {
    e.preventDefault();
    var input = $("input", send), v = input.value.trim();
    if (v) { reply(v); input.value = ""; }
  });

  /* The lander's starting transcript is a finished example, so the
     "make it real" box shows straight away there. */
  if (isLander) save.classList.add("r-show");
  if (isLander) return;

  /* ---------- role scenarios (homepage): agents that take actions ---------- */
  var SCEN = {
    sales: { name: "Coastline Sales Agent", sub: "Example · inbound lead → booked demo", cta: "Build my sales agent →", steps: [
      ["t", "New lead · pricing form · 4:52 p.m."],
      ["x", "Researched <b>coastlineroofing.com</b>: 3 locations, ~40 staff, uses ServiceTitan"],
      ["a", "Hi Jordan, thanks for asking about pricing. So I send the right numbers: roughly how many inbound calls do your 3 locations get a week?"],
      ["u", "Maybe 300. We miss a lot after 5."],
      ["a", "That’s common. At 300 a week, missing even 1 in 5 after hours is about 60 leads. Growth covers web, text and phone for all 3 locations. Want to see it on a 15-minute call? I have Thursday 10:00 or 2:30."],
      ["u", "2:30 works"],
      ["x", "Booked <b>Thu 2:30 p.m.</b> with Sam (account exec) · invite sent"],
      ["x", "Created deal in <b>HubSpot</b> · stage: Demo booked · est. $4,788/yr"],
      ["x", "Wrote call brief for Sam: 3 locations, ~300 calls/wk, after-hours gap, ServiceTitan"],
      ["s", [["6 min", "lead to booked demo"], ["0 min", "rep time used"], ["3", "systems updated"]]]] },
    intake: { name: "Harbor Injury Law Intake", sub: "Example · missed call → booked consult", cta: "Build my intake agent →", steps: [
      ["t", "Missed call · 9:14 p.m."],
      ["x", "Texted the caller back in <b>4 seconds</b>"],
      ["a", "Hi, this is the intake assistant at Harbor Injury Law. Sorry we missed your call. Were you in an accident?"],
      ["u", "Yes, rear-ended on I-275 yesterday"],
      ["a", "I’m sorry to hear that. A few quick questions so an attorney can review: did you see a doctor, and was a police report filed?"],
      ["u", "Urgent care last night. Police came."],
      ["x", "Screened: <b>auto accident · 1 day ago · treated · police report · Florida</b> → meets firm criteria"],
      ["x", "Booked consult <b>tomorrow 9:30 a.m.</b> · intake saved to Filevine · attorney notified"],
      ["a", "You’re booked for 9:30 a.m. tomorrow with an attorney. If you have the police report number, reply with it and I’ll add it to your file."],
      ["s", [["3 min", "missed call to booked consult"], ["24/7", "no after-hours gap"], ["0", "forms for the caller"]]]] },
    winback: { name: "Suncoast Homes Follow-up", sub: "Example · reviving cold leads", cta: "Build my follow-up agent →", steps: [
      ["t", "Weekly run · Monday 8:00 a.m."],
      ["x", "Found <b>412 leads</b> with no reply in 90+ days"],
      ["x", "Matched each lead to new listings in their saved search"],
      ["a", "Hi Maria, it’s the team at Suncoast Homes. Still looking in Westchase? Two new listings under $450k came up this week."],
      ["u", "Yes! Still looking"],
      ["a", "Great. Want to see both on Saturday? I can hold 10:30 or 1:00."],
      ["u", "10:30"],
      ["x", "Showing booked <b>Sat 10:30 a.m.</b> · lead moved to <b>Hot</b> · agent texted"],
      ["s", [["412", "re-contacted"], ["57", "replied"], ["9", "showings booked"]]]] }
  };
  var roleCta = $("[data-c-rolecta]", con);

  function setRole(r) {
    if (role === "desk") deskState = { chat: chat.innerHTML, steps: steps.innerHTML, name: nameEl.textContent, sub: subEl.textContent };
    role = r; runId++;
    $$(".r-roles button", con).forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-role") === r)); });
    var desk = r === "desk";
    steps.hidden = !desk; chips.hidden = !desk; send.hidden = !desk; replay.hidden = desk;
    if (!desk) save.classList.remove("r-show");
    if (desk) {
      if (deskState) { chat.innerHTML = deskState.chat; steps.innerHTML = deskState.steps; nameEl.textContent = deskState.name; subEl.textContent = deskState.sub; }
      chat.style.height = "";
      return;
    }
    play(r);
  }

  function play(r) {
    var sc = SCEN[r], my = ++runId, i = 0;
    chat.innerHTML = ""; chat.style.height = "420px";
    nameEl.textContent = sc.name; subEl.textContent = sc.sub; roleCta.textContent = sc.cta;
    (function next() {
      if (my !== runId || i >= sc.steps.length) return;
      var st = sc.steps[i++], k = st[0], v = st[1], d = 700, e;
      if (k === "t") { e = document.createElement("div"); e.className = "r-trig"; e.textContent = v; chat.appendChild(e); d = 600; }
      else if (k === "x") { e = document.createElement("div"); e.className = "r-act"; e.innerHTML = "<span>" + v + "</span>"; chat.appendChild(e); d = 900; }
      else if (k === "u") { add("r-u", v); d = 900; }
      else if (k === "a") { var t = typing(); setTimeout(function () { if (my !== runId) return; t.innerHTML = v; chat.scrollTop = chat.scrollHeight; }, 700); d = 1700; }
      else if (k === "s") { e = document.createElement("div"); e.className = "r-sum"; e.innerHTML = v.map(function (x) { return "<div><b>" + x[0] + "</b>" + x[1] + "</div>"; }).join("") + '<div class="r-ex">Example scenario · sample figures</div>'; chat.appendChild(e); }
      chat.scrollTop = chat.scrollHeight;
      setTimeout(next, d);
    })();
  }

  $$(".r-roles button", con).forEach(function (b) { b.addEventListener("click", function () { setRole(b.getAttribute("data-role")); }); });
  $("[data-c-replaybtn]", con).addEventListener("click", function () { play(role); });

  /* Who-it's-for tiles play the matching agent in the hero */
  $$("[data-see]").forEach(function (b) {
    b.addEventListener("click", function () { setRole(b.getAttribute("data-see")); scrollToEl(con, "center"); });
  });
})();
