/* My NOLMT — balance, level, wallet, claim and activity history. */
(function () {
  "use strict";

  var API = window.NOLMT_API;
  var UI = window.NOLMT;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var STATUS_TEXT = {
    PENDING: "Pending",
    VALIDATED: "Validated",
    CLAIMABLE: "Claimable",
    REVIEW: "In review",
    REJECTED: "Rejected",
    CLAIMED: "Claimed",
    EXPIRED: "Expired",
    USED: "Used",
    CREATED: "Claim created"
  };

  function renderBalance(bal) {
    var set = function (sel, value) {
      $$(sel).forEach(function (el) { el.firstChild ? (el.firstChild.nodeValue = UI.fmt(value)) : (el.textContent = UI.fmt(value)); });
    };
    var total = $("[data-total]");
    if (total) total.childNodes[0].nodeValue = UI.fmt(bal.total);
    set("[data-pending]", bal.pending);
    set("[data-claimable]", bal.claimable);
    set("[data-claimed]", bal.claimed);

    var levelEl = $("[data-level]");
    var bar = $("[data-level-bar]");
    var note = $("[data-level-note]");
    if (levelEl) levelEl.textContent = bal.level.name;
    if (bar) {
      var pct = 100;
      if (bal.nextLevel) {
        var span = bal.nextLevel.threshold - bal.level.threshold;
        pct = Math.min(100, Math.round(((bal.lifetime - bal.level.threshold) / span) * 100));
      }
      bar.style.width = pct + "%";
    }
    if (note) {
      note.textContent = bal.nextLevel
        ? "Earned " + bal.lifetime + " so far — " + (bal.nextLevel.threshold - bal.lifetime) + " more to reach " + bal.nextLevel.name + "."
        : "Earned " + bal.lifetime + " so far — top level reached.";
    }
  }

  function renderLedger(rows) {
    var list = $("[data-ledger]");
    if (!list) return;
    if (!rows.length) return;

    list.innerHTML = rows.map(function (r) {
      var sign = r.amount < 0 ? "" : "+";
      var reason = r.blocked_on === "email_verification"
        ? "Waiting on email verification"
        : r.blocked_on === "manual_review"
          ? "Held for review before it becomes claimable"
          : UI.timeAgo(r.at);
      return '<li><span class="ledger__amt" data-dir="' + (r.amount < 0 ? "out" : "in") + '">' +
        sign + UI.fmt(r.amount) + "</span>" +
        '<span class="ledger__body"><b>' + r.label + "</b><span>" + reason + "</span></span>" +
        '<span class="ledger__status">' + (STATUS_TEXT[r.status] || r.status) + "</span></li>";
    }).join("");
  }

  function renderWallet(wallet) {
    $$("[data-when='wallet-off']").forEach(function (el) { el.hidden = !!wallet; });
    $$("[data-when='wallet-on']").forEach(function (el) { el.hidden = !wallet; });
    if (wallet) {
      $$("[data-wallet-address]").forEach(function (el) {
        el.textContent = UI.shortAddress(wallet.address);
        el.setAttribute("title", wallet.address);
      });
    }
  }

  var walletForm = document.getElementById("wallet-form");
  if (walletForm) {
    walletForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var address = (new FormData(walletForm).get("address") || "").trim();
      API.connectWallet(address).then(function (res) {
        if (!res.ok) {
          UI.toast({ kind: "warn", title: "Not connected", body: res.message });
          return;
        }
        UI.toast({ title: "Wallet connected", body: UI.shortAddress(res.wallet.address) + " is ready to receive a claim." });
        UI.refresh();
      });
    });
  }

  var disconnect = document.getElementById("wallet-disconnect");
  if (disconnect) {
    disconnect.addEventListener("click", function () {
      API.disconnectWallet().then(function () {
        UI.toast({ kind: "info", title: "Wallet disconnected", body: "Your balance is untouched." });
        UI.refresh();
      });
    });
  }

  var claimBtn = document.getElementById("claim-btn");
  var claimResult = document.getElementById("claim-result");
  if (claimBtn) {
    claimBtn.addEventListener("click", function () {
      claimBtn.setAttribute("aria-disabled", "true");
      API.createClaim().then(function (res) {
        claimBtn.removeAttribute("aria-disabled");
        claimResult.hidden = false;

        if (res.ok) {
          claimResult.className = "notice notice--gold mt-2";
          claimResult.innerHTML = "<p class='mb-0'><b>Claim submitted.</b> " + (res.message || "") + "</p>";
          UI.refresh();
          return;
        }

        if (res.notConfigured && res.claim) {
          claimResult.className = "notice notice--signal mt-2";
          claimResult.innerHTML =
            "<p><b>Claim prepared, not sent.</b> " + res.message + "</p>" +
            "<dl class='kv'>" +
            "<div><dt>Claim id</dt><dd>" + res.claim.claim_id + "</dd></div>" +
            "<div><dt>Wallet</dt><dd>" + UI.shortAddress(res.claim.wallet_address) + "</dd></div>" +
            "<div><dt>Amount</dt><dd>" + UI.fmt(res.claim.amount) + " NOLMT</dd></div>" +
            "<div><dt>Rewards included</dt><dd>" + res.claim.reward_ids.length + "</dd></div>" +
            "<div><dt>Status</dt><dd>" + res.claim.status + "</dd></div>" +
            "<div><dt>Transaction</dt><dd>None — no network configured</dd></div>" +
            "</dl>" +
            "<p class='mb-0 muted'>In production the server would sign an authorisation containing the wallet, amount, nonce and expiry, and a claim contract would verify it before releasing anything from the treasury.</p>";
          return;
        }

        claimResult.className = "notice mt-2";
        claimResult.innerHTML = "<p class='mb-0'><b>Not yet.</b> " + res.message + "</p>";
      });
    });
  }

  var reset = document.getElementById("reset-demo");
  if (reset) {
    reset.addEventListener("click", function () {
      API.reset().then(function () {
        window.location.reload();
      });
    });
  }

  window.NOLMT_PAGE = {
    refresh: function () {
      return Promise.all([API.balance(), API.ledger(), API.session()]).then(function (r) {
        renderBalance(r[0]);
        renderLedger(r[1]);
        renderWallet(r[2].wallet);
      });
    }
  };
})();
