/* ==========================================================================
   NOLMT — public configuration
   --------------------------------------------------------------------------
   Reward names, amounts and utility prices shown on the website.

   In production this file supplies DEFAULTS ONLY. When `apiBase` is set, the
   site calls GET {apiBase}/config on load and the server response replaces
   everything below, so amounts and rules change without a redeploy.

   Nothing proprietary belongs in this file. Reward qualification rules,
   limits, cooldowns, risk thresholds and fraud logic live server-side and are
   never published. See docs/API_CONTRACT.md.
   ========================================================================== */
window.NOLMT_CONFIG = {
  /* Set to your API origin to leave demonstration mode. */
  apiBase: "",

  /* Unset until a network is confirmed. Claims stay disabled while null. */
  chain: {
    network: null,
    chainId: null,
    tokenContract: null,
    claimContract: null,
    explorerBase: null
  },

  claim: {
    minimumBalance: 25
  },

  levels: [
    { id: "participant", name: "Participant", threshold: 0 },
    { id: "contributor", name: "Contributor", threshold: 25 },
    { id: "builder", name: "Builder", threshold: 75 },
    { id: "leader", name: "Leader", threshold: 150 }
  ],

  /* Ways to earn. Qualification rules are enforced server-side. */
  rewardActions: [
    { action_id: "account_created", action_name: "Create a verified account",
      description: "Set up your NOLMT account so rewards belong to you.",
      surface: "account", reward_amount: 5, enabled: true },

    { action_id: "email_verified", action_name: "Verify your email",
      description: "Confirm your email address to make rewards available.",
      surface: "account", reward_amount: 5, enabled: true },

    { action_id: "profile_completed", action_name: "Complete your profile",
      description: "Three quick questions. Nothing sensitive.",
      surface: "account", reward_amount: 5, enabled: true },

    { action_id: "lesson_ai_fundamentals", action_name: "Complete AI Fundamentals",
      description: "Where AI is genuinely useful in a business, and where it is not.",
      surface: "education", reward_amount: 5, enabled: true },

    { action_id: "lesson_tokenization_basics", action_name: "Complete Tokenization Basics",
      description: "What digital utility does inside a normal business.",
      surface: "education", reward_amount: 3, enabled: true },

    { action_id: "lesson_agents", action_name: "Complete AI Agents in Practice",
      description: "What an agent should do, and where a person stays in the loop.",
      surface: "education", reward_amount: 3, enabled: true },

    { action_id: "app_plan_completed", action_name: "Complete your AI App plan",
      description: "Plan your app and get a written summary back.",
      surface: "app-plan", reward_amount: 10, enabled: true },

    { action_id: "tokenization_explored", action_name: "Explore tokenization",
      description: "Work out whether digital utility fits your business or community.",
      surface: "tokenization", reward_amount: 8, enabled: true },

    { action_id: "community_joined", action_name: "Join the community",
      description: "Take part in an approved community activity.",
      surface: "community", reward_amount: 4, enabled: true },

    { action_id: "challenge_completed", action_name: "Complete a challenge",
      description: "Finish a selected NOLMT challenge.",
      surface: "community", reward_amount: 6, enabled: true },

    { action_id: "referral_qualified", action_name: "Refer someone",
      description: "Applies once your invitee verifies and takes part.",
      surface: "referral", reward_amount: 15, enabled: true }
  ],

  /* Ways to use NOLMT. */
  utilityActions: [
    { utility_id: "agent_usage", name: "AI Agent usage",
      description: "Put an agent to work on your own questions and content.",
      cost: 15, category: "AI Agents", enabled: true },

    { utility_id: "ai_learning", name: "Premium AI learning",
      description: "Applied modules on agents, workflows and getting value from AI.",
      cost: 25, category: "AI Education", enabled: true },

    { utility_id: "resources", name: "Premium resources",
      description: "Templates, prompts and checklists used on real NOLMT builds.",
      cost: 20, category: "Resources", enabled: true },

    { utility_id: "community_access", name: "Community access",
      description: "Working sessions with the people building NOLMT apps.",
      cost: 40, category: "Community", enabled: true },

    { utility_id: "ai_tools", name: "Selected AI tools",
      description: "Switch on a NOLMT AI tool for a period of use.",
      cost: 45, category: "AI tools", enabled: true },

    { utility_id: "app_services", name: "App services",
      description: "Selected add-ons and services for an app we have built.",
      cost: 60, category: "Apps", enabled: true },

    { utility_id: "events", name: "Selected events",
      description: "Register for a selected live NOLMT session.",
      cost: 30, category: "Events", enabled: true },

    { utility_id: "premium_support", name: "Premium support",
      description: "Priority help when you are building something.",
      cost: 50, category: "Support", enabled: true }
  ],

  journey: [
    { id: "participate", label: "Participate" },
    { id: "earn", label: "Earn NOLMT" },
    { id: "accumulate", label: "Build balance" },
    { id: "wallet", label: "Connect wallet" },
    { id: "claim", label: "Claim" },
    { id: "use", label: "Use NOLMT" }
  ]
};

/* ==========================================================================
   Alice — live chat connection
   --------------------------------------------------------------------------
   mode: "off"   Alice runs her built-in script (the site as it was).
         "test"  The live agent answers only when the site is opened with
                 ?chat=live on the end of the address. Everyone else still
                 gets the built-in script. Use this while testing.
         "on"    The live agent answers every visitor.

   Alice also stays on her built-in script while accessKey is not filled in.
   ========================================================================== */
window.NOLMT_CHAT = {
  mode: "test",
  endpoint: "https://nolmtchat.srv1456914.hstgr.cloud/api/plugins/custom-webhook/webhook",
  accessKey: "PASTE_ACCESS_KEY_HERE",
  timeoutMs: 60000
};
