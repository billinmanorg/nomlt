/* Account: create, verify, profile. Each step reports to the API, which decides
   whether a reward is earned and whether it is claimable or pending. */
(function () {
  "use strict";

  var API = window.NOLMT_API;
  var UI = window.NOLMT;

  var signup = document.getElementById("signup");
  var error = document.getElementById("signup-error");
  var verifyBtn = document.getElementById("verify-btn");
  var profile = document.getElementById("profile");
  var done = document.getElementById("account-done");

  function fail(message) {
    error.hidden = false;
    error.textContent = message;
  }

  if (signup) {
    signup.addEventListener("submit", function (e) {
      e.preventDefault();
      error.hidden = true;
      var data = new FormData(signup);
      var name = (data.get("name") || "").trim();
      var email = (data.get("email") || "").trim();
      var password = data.get("password") || "";

      if (!name) return fail("Add your name so we know who the rewards belong to.");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("That email address does not look right.");
      if (password.length < 10) return fail("Passwords need at least ten characters.");

      API.signUp({ name: name, email: email }).then(function (res) {
        if (!res.ok) return fail(res.message || "That did not work. Try again.");
        UI.toast({
          title: "Account created",
          body: "Verify your email to turn pending rewards into claimable NOLMT.",
          linkHref: "my-nolmt.html",
          linkText: "See my balance"
        });
        UI.refresh();
      });
    });
  }

  if (verifyBtn) {
    verifyBtn.addEventListener("click", function () {
      verifyBtn.setAttribute("aria-disabled", "true");
      API.verifyEmail().then(function (res) {
        verifyBtn.removeAttribute("aria-disabled");
        if (!res.ok) {
          UI.toast({ kind: "warn", title: "Not verified", body: res.message });
          return;
        }
        UI.toast({
          title: "Email verified",
          body: "Anything that was waiting on verification is now claimable.",
          linkHref: "my-nolmt.html",
          linkText: "See my balance"
        });
        UI.refresh();
      });
    });
  }

  if (profile) {
    profile.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(profile);
      if (!data.get("role") || !data.get("size") || !data.get("interest")) {
        UI.toast({ kind: "warn", title: "Almost", body: "Answer all three and the profile will save." });
        return;
      }
      API.completeProfile({
        role: data.get("role"), size: data.get("size"), interest: data.get("interest")
      }).then(function (res) {
        if (!res.ok) {
          UI.toast({ kind: "warn", title: "Not saved", body: res.message });
          return;
        }
        profile.hidden = true;
        if (done) done.hidden = false;
        var amount = res.reward && res.reward.ok ? res.reward.amount : 0;
        UI.toast({
          title: amount ? "+" + amount + " NOLMT" : "Profile saved",
          body: "Profile complete.",
          linkHref: "my-nolmt.html",
          linkText: "See my balance"
        });
        UI.refresh();
      });
    });
  }

  /* Once the profile already exists, show the confirmation instead of the form. */
  window.NOLMT_PAGE = {
    refresh: function () {
      return API.session().then(function (s) {
        if (s.user && s.user.profileComplete) {
          if (profile) profile.hidden = true;
          if (done) done.hidden = false;
        }
      });
    }
  };
})();
