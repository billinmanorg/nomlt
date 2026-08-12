/* ==========================================================================
   NOLMT — rewards client
   --------------------------------------------------------------------------
   Two adapters behind one interface.

   SERVER ADAPTER   used when NOLMT_CONFIG.apiBase is set. Every reward event,
                    balance, claim and utility spend is decided by the server.
                    The browser only reports that something happened; it never
                    decides what it is worth.

   DEMO ADAPTER     used when apiBase is empty. State lives in localStorage so
                    the journey can be walked through before the backend
                    exists. It is a stand-in for a product demo, not a
                    security boundary — anything in the browser can be edited
                    by the person using the browser. Limits and cooldowns are
                    mirrored here only so the UX can be seen working.
   ========================================================================== */
(function () {
  "use strict";

  var CONFIG = window.NOLMT_CONFIG;
  var STORE_KEY = "nolmt.demo.v1";

  /* ---------------------------------------------------------------------
     Helpers
     --------------------------------------------------------------------- */
  function now() { return new Date().toISOString(); }

  function uid(prefix) {
    var rand = (window.crypto && window.crypto.randomUUID)
      ? window.crypto.randomUUID().split("-")[0]
      : Math.random().toString(36).slice(2, 10);
    return prefix + "_" + rand;
  }

  function actionById(id) {
    return CONFIG.rewardActions.filter(function (a) { return a.action_id === id; })[0] || null;
  }

  function utilityById(id) {
    return CONFIG.utilityActions.filter(function (u) { return u.utility_id === id; })[0] || null;
  }

  /* ---------------------------------------------------------------------
     Demo store
     --------------------------------------------------------------------- */
  function blank() {
    return {
      user: null,          /* { id, email, name, emailVerified, profileComplete, createdAt } */
      wallet: null,        /* { address, connectedAt } */
      events: [],          /* reward ledger entries */
      claims: [],
      utilities: [],       /* utility transactions */
      seenTokenizationCallout: false
    };
  }

  function read() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : blank();
    } catch (e) {
      return blank();
    }
  }

  function write(state) {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) { /* private browsing — demo simply will not persist */ }
    return state;
  }

  /* ---------------------------------------------------------------------
     Balance maths — shared by both adapters for display
     --------------------------------------------------------------------- */
  function summarise(state) {
    var pending = 0, claimable = 0, claimed = 0, review = 0, spent = 0;

    state.events.forEach(function (e) {
      if (e.reward_status === "PENDING" || e.reward_status === "VALIDATED") pending += e.reward_amount;
      else if (e.reward_status === "CLAIMABLE") claimable += e.reward_amount;
      else if (e.reward_status === "CLAIMED") claimed += e.reward_amount;
      else if (e.reward_status === "REVIEW") review += e.reward_amount;
    });

    state.utilities.forEach(function (u) { spent += u.cost; });

    var available = Math.max(0, claimable - spent);
    var lifetime = pending + claimable + claimed + review;
    var level = CONFIG.levels[0];
    CONFIG.levels.forEach(function (l) { if (lifetime >= l.threshold) level = l; });
    var next = CONFIG.levels.filter(function (l) { return l.threshold > lifetime; })[0] || null;

    return {
      pending: pending,
      claimable: available,
      claimed: claimed,
      review: review,
      spent: spent,
      lifetime: lifetime,
      total: pending + available,
      level: level,
      nextLevel: next
    };
  }

  /* ---------------------------------------------------------------------
     Demo adapter
     --------------------------------------------------------------------- */
  var Demo = {
    isDemo: true,

    session: function () {
      var s = read();
      return Promise.resolve({ user: s.user, wallet: s.wallet });
    },

    signUp: function (payload) {
      var s = read();
      if (s.user) return Promise.resolve({ ok: true, user: s.user });
      s.user = {
        id: uid("usr"),
        email: payload.email,
        name: payload.name || payload.email.split("@")[0],
        emailVerified: false,
        profileComplete: false,
        createdAt: now()
      };
      write(s);
      return Demo.submitEvent("account_created").then(function (r) {
        return { ok: true, user: read().user, reward: r };
      });
    },

    signIn: function (payload) {
      var s = read();
      if (!s.user) return Demo.signUp(payload);
      return Promise.resolve({ ok: true, user: s.user });
    },

    signOut: function () {
      /* Demo sign-out keeps the ledger so the journey can be resumed. */
      return Promise.resolve({ ok: true });
    },

    verifyEmail: function () {
      var s = read();
      if (!s.user) return Promise.resolve({ ok: false, message: "Create an account first." });
      if (s.user.emailVerified) return Promise.resolve({ ok: true, already: true });
      s.user.emailVerified = true;
      write(s);
      /* Verification unlocks anything that was waiting on it. */
      var st = read();
      st.events.forEach(function (e) {
        if (e.reward_status === "PENDING" && e.blocked_on === "email_verification") {
          e.reward_status = "CLAIMABLE";
          e.validated_at = now();
          e.blocked_on = null;
        }
      });
      write(st);
      return Demo.submitEvent("email_verified").then(function (r) {
        return { ok: true, reward: r };
      });
    },

    completeProfile: function (profile) {
      var s = read();
      if (!s.user) return Promise.resolve({ ok: false, message: "Create an account first." });
      s.user.profileComplete = true;
      s.user.profile = profile || {};
      write(s);
      return Demo.submitEvent("profile_completed").then(function (r) {
        return { ok: true, reward: r };
      });
    },

    /* Mirrors what the server rule engine would decide. */
    submitEvent: function (actionId, metadata) {
      var s = read();
      var action = actionById(actionId);

      if (!action || !action.enabled) {
        return Promise.resolve({ ok: false, status: "REJECTED", message: "That reward is not available right now." });
      }
      if (action.requires_login && !s.user) {
        return Promise.resolve({ ok: false, status: "REJECTED", requiresAccount: true, message: "Create an account to earn NOLMT for this." });
      }

      var same = s.events.filter(function (e) { return e.action_id === actionId; });

      if (action.lifetime_limit && same.length >= action.lifetime_limit) {
        return Promise.resolve({ ok: false, status: "REJECTED", reason: "lifetime_limit", message: "You have already earned everything available for this action." });
      }

      var dayAgo = Date.now() - 86400000;
      var todayCount = same.filter(function (e) { return new Date(e.created_at).getTime() > dayAgo; }).length;
      if (action.daily_limit && todayCount >= action.daily_limit) {
        return Promise.resolve({ ok: false, status: "REJECTED", reason: "daily_limit", message: "Daily limit reached for this action. Try again tomorrow." });
      }

      if (action.cooldown_seconds && same.length) {
        var last = new Date(same[same.length - 1].created_at).getTime();
        if (Date.now() - last < action.cooldown_seconds * 1000) {
          return Promise.resolve({ ok: false, status: "REJECTED", reason: "cooldown", message: "This action is on cooldown." });
        }
      }

      var summary = summarise(s);
      if (summary.lifetime + action.reward_amount > CONFIG.caps.lifetimePerUser) {
        return Promise.resolve({ ok: false, status: "REJECTED", reason: "lifetime_cap", message: "Lifetime reward cap reached." });
      }

      var status = "CLAIMABLE";
      var blocked = null;
      if (action.requires_email_verification && !(s.user && s.user.emailVerified)) {
        status = "PENDING";
        blocked = "email_verification";
      }
      if (action.risk_level === "high") {
        status = "PENDING";
        blocked = blocked || "manual_review";
      }

      var event = {
        event_id: uid("evt"),
        user_id: s.user ? s.user.id : null,
        action_id: action.action_id,
        event_type: "reward",
        label: action.action_name,
        source: action.surface,
        metadata: metadata || {},
        created_at: now(),
        validated_at: status === "CLAIMABLE" ? now() : null,
        risk_score: action.risk_level === "high" ? 45 : 10,
        reward_amount: action.reward_amount,
        reward_status: status,
        blocked_on: blocked
      };

      s.events.push(event);
      write(s);

      return Promise.resolve({
        ok: true,
        status: status,
        amount: action.reward_amount,
        label: action.action_name,
        event_id: event.event_id,
        blocked_on: blocked,
        firstEarn: s.events.length === 1
      });
    },

    balance: function () {
      return Promise.resolve(summarise(read()));
    },

    ledger: function () {
      var s = read();
      var rows = s.events.map(function (e) {
        return {
          kind: "reward", id: e.event_id, at: e.created_at,
          label: e.label, amount: e.reward_amount,
          status: e.reward_status, blocked_on: e.blocked_on
        };
      }).concat(s.utilities.map(function (u) {
        return {
          kind: "spend", id: u.transaction_id, at: u.created_at,
          label: u.name, amount: -u.cost, status: "USED", blocked_on: null
        };
      })).concat(s.claims.map(function (c) {
        return {
          kind: "claim", id: c.claim_id, at: c.created_at,
          label: "Claim to wallet", amount: -c.amount, status: c.status, blocked_on: null
        };
      }));
      rows.sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
      return Promise.resolve(rows);
    },

    connectWallet: function (address) {
      var s = read();
      if (!s.user) return Promise.resolve({ ok: false, message: "Create an account before connecting a wallet." });
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return Promise.resolve({ ok: false, message: "That does not look like a valid address. It should start 0x and be 42 characters." });
      }
      s.wallet = { address: address, connectedAt: now() };
      write(s);
      return Promise.resolve({ ok: true, wallet: s.wallet });
    },

    disconnectWallet: function () {
      var s = read();
      s.wallet = null;
      write(s);
      return Promise.resolve({ ok: true });
    },

    /* A claim in demo mode stops at the point where a real signature would be
       produced. No transaction is broadcast and no hash is invented. */
    createClaim: function () {
      var s = read();
      var summary = summarise(s);

      if (!s.user) return Promise.resolve({ ok: false, message: "Create an account first." });
      if (!s.user.emailVerified) return Promise.resolve({ ok: false, message: "Verify your email before claiming." });
      if (!s.wallet) return Promise.resolve({ ok: false, message: "Connect a wallet to claim." });
      if (summary.claimable < CONFIG.claim.minimumBalance) {
        return Promise.resolve({
          ok: false,
          message: "You need at least " + CONFIG.claim.minimumBalance + " claimable NOLMT. You have " + summary.claimable + "."
        });
      }

      var lastClaim = s.claims[s.claims.length - 1];
      if (lastClaim) {
        var since = Date.now() - new Date(lastClaim.created_at).getTime();
        if (since < CONFIG.claim.cooldownHours * 3600000) {
          return Promise.resolve({ ok: false, message: "One claim per " + CONFIG.claim.cooldownHours + " hours. Try again later." });
        }
      }

      /* No network configured means no claim can be authorised — say so. */
      if (!CONFIG.chain.network || !CONFIG.chain.claimContract) {
        var pendingClaim = {
          claim_id: uid("clm"),
          user_id: s.user.id,
          wallet_address: s.wallet.address,
          amount: summary.claimable,
          reward_ids: s.events.filter(function (e) { return e.reward_status === "CLAIMABLE"; }).map(function (e) { return e.event_id; }),
          nonce: uid("nonce"),
          created_at: now(),
          expires_at: null,
          status: "CREATED",
          transaction_hash: null,
          network: null,
          risk_score: 10
        };
        return Promise.resolve({
          ok: false,
          claim: pendingClaim,
          notConfigured: true,
          message: "Your balance qualifies. The claim stops here because no network, token contract or claim contract has been confirmed yet — nothing is transferred until those are set."
        });
      }

      return Promise.resolve({ ok: false, message: "Claim submission runs server-side. Connect the API to enable it." });
    },

    useUtility: function (utilityId) {
      var s = read();
      var utility = utilityById(utilityId);
      var summary = summarise(s);

      if (!utility || !utility.enabled) return Promise.resolve({ ok: false, message: "That is not available right now." });
      if (!s.user) return Promise.resolve({ ok: false, requiresAccount: true, message: "Create an account to use NOLMT." });
      if (!s.user.emailVerified) return Promise.resolve({ ok: false, message: "Verify your email first." });
      if (summary.claimable < utility.cost) {
        return Promise.resolve({
          ok: false,
          message: "This needs " + utility.cost + " NOLMT. You have " + summary.claimable + " available."
        });
      }

      s.utilities.push({
        transaction_id: uid("utx"),
        utility_id: utility.utility_id,
        name: utility.name,
        cost: utility.cost,
        created_at: now()
      });
      write(s);
      return Promise.resolve({ ok: true, utility: utility });
    },

    journey: function () {
      var s = read();
      var summary = summarise(s);
      return Promise.resolve({
        discover: true,
        participate: s.events.length > 0,
        earn: summary.lifetime > 0,
        accumulate: summary.lifetime >= 10,
        wallet: !!s.wallet,
        claim: s.claims.some(function (c) { return c.status === "CONFIRMED"; }),
        use: s.utilities.length > 0
      });
    },

    calloutSeen: function () {
      return Promise.resolve(read().seenTokenizationCallout);
    },

    markCalloutSeen: function () {
      var s = read();
      s.seenTokenizationCallout = true;
      write(s);
      return Promise.resolve({ ok: true });
    },

    reset: function () {
      write(blank());
      return Promise.resolve({ ok: true });
    }
  };

  /* ---------------------------------------------------------------------
     Server adapter — thin. All decisions belong to the server.
     --------------------------------------------------------------------- */
  function request(path, options) {
    var opts = options || {};
    return fetch(CONFIG.apiBase + path, {
      method: opts.method || "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw Object.assign(new Error(data.message || "Request failed"), { data: data, status: res.status });
        return data;
      });
    });
  }

  var Server = {
    isDemo: false,
    session: function () { return request("/session"); },
    signUp: function (p) { return request("/auth/signup", { method: "POST", body: p }); },
    signIn: function (p) { return request("/auth/signin", { method: "POST", body: p }); },
    signOut: function () { return request("/auth/signout", { method: "POST" }); },
    verifyEmail: function (token) { return request("/auth/verify-email", { method: "POST", body: { token: token } }); },
    completeProfile: function (p) { return request("/me/profile", { method: "POST", body: p }); },
    submitEvent: function (actionId, metadata) {
      return request("/rewards/events", { method: "POST", body: { action_id: actionId, metadata: metadata || {} } });
    },
    balance: function () { return request("/rewards/balance"); },
    ledger: function () { return request("/rewards/ledger"); },
    connectWallet: function (address) { return request("/wallet/connect", { method: "POST", body: { address: address } }); },
    disconnectWallet: function () { return request("/wallet/disconnect", { method: "POST" }); },
    createClaim: function () { return request("/claims", { method: "POST" }); },
    useUtility: function (id) { return request("/utility/" + id + "/use", { method: "POST" }); },
    journey: function () { return request("/me/journey"); },
    calloutSeen: function () { return request("/me/callout").then(function (r) { return r.seen; }); },
    markCalloutSeen: function () { return request("/me/callout", { method: "POST" }); },
    reset: function () { return Promise.resolve({ ok: false }); }
  };

  var API = CONFIG.apiBase ? Server : Demo;
  API.summarise = summarise;
  API.actionById = actionById;
  API.utilityById = utilityById;
  window.NOLMT_API = API;
})();
