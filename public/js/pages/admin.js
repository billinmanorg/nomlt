/* Admin preview — renders the live reward and utility configuration read-only. */
(function () {
  "use strict";

  var CONFIG = window.NOLMT_CONFIG;

  function cooldown(seconds) {
    if (!seconds) return "None";
    if (seconds % 86400 === 0) return seconds / 86400 + "d";
    if (seconds % 3600 === 0) return seconds / 3600 + "h";
    return seconds + "s";
  }

  function verification(action) {
    var parts = [];
    if (action.requires_login) parts.push("account");
    if (action.requires_email_verification) parts.push("email");
    if (action.requires_phone_verification) parts.push("phone");
    if (action.requires_wallet) parts.push("wallet");
    return parts.length ? parts.join(" + ") : "None";
  }

  function window_(item) {
    if (!item.start_at && !item.end_at) return "Always";
    return (item.start_at || "—") + " to " + (item.end_at || "—");
  }

  var rewards = document.querySelector("#reward-table tbody");
  if (rewards) {
    rewards.innerHTML = CONFIG.rewardActions.map(function (a) {
      return "<tr>" +
        "<td>" + a.action_name + "</td>" +
        "<td>" + a.reward_amount + "</td>" +
        "<td>" + (a.daily_limit || "—") + "</td>" +
        "<td>" + (a.weekly_limit || "—") + "</td>" +
        "<td>" + (a.lifetime_limit || "—") + "</td>" +
        "<td>" + cooldown(a.cooldown_seconds) + "</td>" +
        "<td>" + verification(a) + "</td>" +
        "<td>" + a.risk_level + "</td>" +
        "<td>" + (a.enabled ? "Yes" : "No") + "</td>" +
        "</tr>";
    }).join("");
  }

  var utilities = document.querySelector("#utility-table tbody");
  if (utilities) {
    utilities.innerHTML = CONFIG.utilityActions.map(function (u) {
      return "<tr>" +
        "<td>" + u.name + "</td>" +
        "<td>" + u.cost + "</td>" +
        "<td>" + u.category + "</td>" +
        "<td>" + u.eligibility.replace(/_/g, " ") + "</td>" +
        "<td>" + window_(u) + "</td>" +
        "<td>" + (u.enabled ? "Yes" : "No") + "</td>" +
        "</tr>";
    }).join("");
  }
})();
