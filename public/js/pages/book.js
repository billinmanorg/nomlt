/* Discovery call request.
   Routed through FormSubmit (formsubmit.co) — no backend needed on a static
   site. Submissions email FORM_TO, with FORM_CC copied. If NOLMT_CONFIG.apiBase
   is ever set, the site's own /contact endpoint is used instead. */
(function () {
  "use strict";
  var FORM_TO = "bill@billinman.org";
  var FORM_CC = "claflair@clearmortgagecapital.com";

  var form = document.getElementById("form");
  if (!form) return;
  var msg = document.getElementById("book-msg");
  var btn = form.querySelector('[type="submit"]');

  function show(cls, html) { msg.hidden = false; msg.className = cls; msg.innerHTML = html; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var email = (fd.get("email") || "").trim();
    var name = (fd.get("name") || "").trim();
    var topic = fd.get("topic") || "";
    var notes = fd.get("notes") || "";

    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      show("notice notice--quiet", "<p class='mb-0'>Add your name and a valid email address so we can reply.</p>");
      return;
    }

    var base = (window.NOLMT_CONFIG && window.NOLMT_CONFIG.apiBase) || "";
    var url, body;
    if (base) {
      url = base + "/contact";
      body = { name: name, email: email, topic: topic, notes: notes };
    } else {
      url = "https://formsubmit.co/ajax/" + FORM_TO;
      body = {
        name: name, email: email, topic: topic, notes: notes,
        _subject: "NOLMT call request — " + name + (topic ? " (" + topic + ")" : ""),
        _replyto: email,
        _cc: FORM_CC,
        _template: "table",
        _captcha: "false"
      };
    }

    if (btn) btn.disabled = true;
    show("notice notice--quiet", "<p class='mb-0'>Sending…</p>");
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      show("notice notice--aqua", "<p class='mb-0'><b>Request sent.</b> We will be in touch shortly.</p>");
      form.reset();
    }).catch(function () {
      show("notice notice--quiet", "<p class='mb-0'>That did not send. Try again in a moment, or email <a href='mailto:" + FORM_TO + "'>" + FORM_TO + "</a>.</p>");
    }).then(function () { if (btn) btn.disabled = false; });
  });
})();
