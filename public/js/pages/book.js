/* Discovery call request. Posts to the API when one is configured; otherwise
   it says plainly that it is not connected rather than pretending to send. */
(function () {
  "use strict";
  var form = document.getElementById("form");
  if (!form) return;
  var msg = document.getElementById("book-msg");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var email = (fd.get("email") || "").trim();
    var name = (fd.get("name") || "").trim();

    msg.hidden = false;
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      msg.className = "notice notice--quiet";
      msg.innerHTML = "<p class='mb-0'>Add your name and a valid email address so we can reply.</p>";
      return;
    }

    var base = window.NOLMT_CONFIG.apiBase;
    if (!base) {
      msg.className = "notice";
      msg.innerHTML = "<p class='mb-0'><b>Not connected yet.</b> This form is not wired to an inbox in the demonstration build, so nothing was sent. Connect the API to enable it.</p>";
      return;
    }

    fetch(base + "/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name, email: email, topic: fd.get("topic"), notes: fd.get("notes")
      })
    }).then(function (r) {
      msg.className = r.ok ? "notice notice--aqua" : "notice notice--quiet";
      msg.innerHTML = r.ok
        ? "<p class='mb-0'><b>Request sent.</b> We will be in touch shortly.</p>"
        : "<p class='mb-0'>That did not send. Try again in a moment.</p>";
      if (r.ok) form.reset();
    }).catch(function () {
      msg.className = "notice notice--quiet";
      msg.innerHTML = "<p class='mb-0'>That did not send. Try again in a moment.</p>";
    });
  });
})();
