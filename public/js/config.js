/* ==========================================================================
   NOLMT — configuration
   --------------------------------------------------------------------------
   Every reward amount, limit and utility price on the website is read from
   this object. Nothing is hard-coded into page markup or components.

   In production this file supplies DEFAULTS ONLY. When `apiBase` is set, the
   site calls GET {apiBase}/config on load and the server response replaces
   everything below, so amounts and rules can change without a redeploy.

   The same shape is what the backend should return. See docs/API_CONTRACT.md.
   ========================================================================== */
window.NOLMT_CONFIG = {
  /* Set to your API origin (e.g. "https://nolmt-api.onrender.com") to leave
     demo mode and run against real server-side validation. Empty = demo. */
  apiBase: "",

  /* Blockchain settings are deliberately unset. Claims stay disabled until a
     network, token contract, treasury and claim contract are confirmed. */
  chain: {
    network: null,
    chainId: null,
    tokenContract: null,
    claimContract: null,
    explorerBase: null,
    gasMode: "undecided" /* "user_pays" | "sponsored" | "undecided" */
  },

  claim: {
    minimumBalance: 25,
    maximumPerClaim: 5000,
    cooldownHours: 24,
    authorizationTtlMinutes: 30
  },

  caps: {
    dailyPerUser: 40,
    weeklyPerUser: 120,
    lifetimePerUser: 2000
  },

  levels: [
    { id: "participant", name: "Participant", threshold: 0 },
    { id: "contributor", name: "Contributor", threshold: 25 },
    { id: "builder", name: "Builder", threshold: 75 },
    { id: "leader", name: "Leader", threshold: 150 }
  ],

  /* ---------------------------------------------------------------------
     Reward actions
     --------------------------------------------------------------------- */
  rewardActions: [
    {
      action_id: "account_created",
      action_name: "Create your account",
      description: "Set up a NOLMT account so rewards can be tied to a verified person.",
      surface: "account",
      reward_amount: 5,
      daily_limit: 1, weekly_limit: 1, lifetime_limit: 1,
      requires_login: true, requires_email_verification: false,
      requires_phone_verification: false, requires_wallet: false,
      cooldown_seconds: 0, enabled: true,
      start_at: null, end_at: null, risk_level: "low"
    },
    {
      action_id: "email_verified",
      action_name: "Verify your email",
      description: "Confirm your email address. Required before rewards become claimable.",
      surface: "account",
      reward_amount: 5,
      daily_limit: 1, weekly_limit: 1, lifetime_limit: 1,
      requires_login: true, requires_email_verification: false,
      requires_phone_verification: false, requires_wallet: false,
      cooldown_seconds: 0, enabled: true,
      start_at: null, end_at: null, risk_level: "low"
    },
    {
      action_id: "profile_completed",
      action_name: "Build your profile",
      description: "Tell us what you do and what you want to build. Nothing sensitive.",
      surface: "account",
      reward_amount: 5,
      daily_limit: 1, weekly_limit: 1, lifetime_limit: 1,
      requires_login: true, requires_email_verification: true,
      requires_phone_verification: false, requires_wallet: false,
      cooldown_seconds: 0, enabled: true,
      start_at: null, end_at: null, risk_level: "low"
    },
    {
      action_id: "lesson_ai_fundamentals",
      action_name: "Complete AI Fundamentals",
      description: "Where AI is genuinely useful in a business, and where it is not.",
      surface: "education",
      reward_amount: 5,
      daily_limit: 1, weekly_limit: 1, lifetime_limit: 1,
      requires_login: true, requires_email_verification: true,
      requires_phone_verification: false, requires_wallet: false,
      cooldown_seconds: 0, enabled: true,
      start_at: null, end_at: null, risk_level: "low"
    },
    {
      action_id: "lesson_tokenization_basics",
      action_name: "Complete Tokenization Basics",
      description: "What a utility token actually does inside a normal business.",
      surface: "education",
      reward_amount: 3,
      daily_limit: 1, weekly_limit: 1, lifetime_limit: 1,
      requires_login: true, requires_email_verification: true,
      requires_phone_verification: false, requires_wallet: false,
      cooldown_seconds: 0, enabled: true,
      start_at: null, end_at: null, risk_level: "low"
    },
    {
      action_id: "lesson_subtokens",
      action_name: "Complete Subtokens Explained",
      description: "How a community can run its own token inside the NOLMT ecosystem.",
      surface: "education",
      reward_amount: 3,
      daily_limit: 1, weekly_limit: 1, lifetime_limit: 1,
      requires_login: true, requires_email_verification: true,
      requires_phone_verification: false, requires_wallet: false,
      cooldown_seconds: 0, enabled: true,
      start_at: null, end_at: null, risk_level: "low"
    },
    {
      action_id: "app_builder_completed",
      action_name: "Complete Build My App",
      description: "Plan your app with the NOLMT App Builder and get a written brief back.",
      surface: "app-builder",
      reward_amount: 10,
      daily_limit: 1, weekly_limit: 1, lifetime_limit: 1,
      requires_login: true, requires_email_verification: true,
      requires_phone_verification: false, requires_wallet: false,
      cooldown_seconds: 0, enabled: true,
      start_at: null, end_at: null, risk_level: "medium"
    },
    {
      action_id: "tokenization_questionnaire",
      action_name: "Complete the tokenization questionnaire",
      description: "Work out whether tokenization fits your business or community.",
      surface: "tokenization",
      reward_amount: 8,
      daily_limit: 1, weekly_limit: 1, lifetime_limit: 1,
      requires_login: true, requires_email_verification: true,
      requires_phone_verification: false, requires_wallet: false,
      cooldown_seconds: 0, enabled: true,
      start_at: null, end_at: null, risk_level: "medium"
    },
    {
      action_id: "community_joined",
      action_name: "Join the community",
      description: "Take part in an approved community activity.",
      surface: "community",
      reward_amount: 4,
      daily_limit: 1, weekly_limit: 1, lifetime_limit: 1,
      requires_login: true, requires_email_verification: true,
      requires_phone_verification: false, requires_wallet: false,
      cooldown_seconds: 0, enabled: true,
      start_at: null, end_at: null, risk_level: "medium"
    },
    {
      action_id: "challenge_completed",
      action_name: "Complete a challenge",
      description: "Finish a selected NOLMT build or learning challenge.",
      surface: "community",
      reward_amount: 6,
      daily_limit: 1, weekly_limit: 2, lifetime_limit: 12,
      requires_login: true, requires_email_verification: true,
      requires_phone_verification: false, requires_wallet: false,
      cooldown_seconds: 86400, enabled: true,
      start_at: null, end_at: null, risk_level: "medium"
    },
    {
      action_id: "event_attended",
      action_name: "Attend an approved event",
      description: "Check in to a NOLMT digital event.",
      surface: "community",
      reward_amount: 6,
      daily_limit: 1, weekly_limit: 2, lifetime_limit: 24,
      requires_login: true, requires_email_verification: true,
      requires_phone_verification: false, requires_wallet: false,
      cooldown_seconds: 43200, enabled: true,
      start_at: null, end_at: null, risk_level: "medium"
    },
    {
      action_id: "feedback_submitted",
      action_name: "Send useful product feedback",
      description: "Reviewed by a person before the reward becomes claimable.",
      surface: "community",
      reward_amount: 4,
      daily_limit: 1, weekly_limit: 2, lifetime_limit: 10,
      requires_login: true, requires_email_verification: true,
      requires_phone_verification: false, requires_wallet: false,
      cooldown_seconds: 86400, enabled: true,
      start_at: null, end_at: null, risk_level: "high"
    },
    {
      action_id: "referral_qualified",
      action_name: "Refer someone",
      description: "Pays only after your invitee verifies and completes a qualifying action.",
      surface: "referral",
      reward_amount: 15,
      daily_limit: 2, weekly_limit: 5, lifetime_limit: 40,
      requires_login: true, requires_email_verification: true,
      requires_phone_verification: false, requires_wallet: false,
      cooldown_seconds: 0, enabled: true,
      start_at: null, end_at: null, risk_level: "high"
    }
  ],

  /* ---------------------------------------------------------------------
     Utility actions — what NOLMT is for
     --------------------------------------------------------------------- */
  utilityActions: [
    {
      utility_id: "premium_lesson",
      name: "Premium AI learning track",
      description: "Six applied modules on agents, workflows and evaluation.",
      cost: 25, category: "Education", enabled: true,
      eligibility: "verified_account", start_at: null, end_at: null
    },
    {
      utility_id: "resource_pack",
      name: "Implementation resource pack",
      description: "Templates, prompts and checklists used on real NOLMT builds.",
      cost: 20, category: "Resources", enabled: true,
      eligibility: "verified_account", start_at: null, end_at: null
    },
    {
      utility_id: "event_seat",
      name: "Digital event seat",
      description: "Register for a selected live NOLMT session.",
      cost: 30, category: "Events", enabled: true,
      eligibility: "verified_account", start_at: null, end_at: null
    },
    {
      utility_id: "ai_tool_credits",
      name: "AI tool activation",
      description: "Switch on a NOLMT AI tool for a period of use.",
      cost: 40, category: "AI tools", enabled: true,
      eligibility: "verified_account", start_at: null, end_at: null
    },
    {
      utility_id: "app_builder_pro",
      name: "App Builder advanced mode",
      description: "Deeper questioning, data model sketch and a costed scope.",
      cost: 60, category: "Product", enabled: true,
      eligibility: "verified_account", start_at: null, end_at: null
    },
    {
      utility_id: "community_premium",
      name: "Premium community area",
      description: "Working sessions with the people building NOLMT apps.",
      cost: 75, category: "Community", enabled: true,
      eligibility: "verified_account", start_at: null, end_at: null
    },
    {
      utility_id: "subtoken_lab",
      name: "Subtoken design lab",
      description: "A guided session on designing utility for your own community token.",
      cost: 100, category: "Tokenization", enabled: true,
      eligibility: "verified_account", start_at: null, end_at: null
    }
  ],

  /* The seven stages of the journey the website itself demonstrates. */
  journey: [
    { id: "discover", label: "Discover" },
    { id: "participate", label: "Participate" },
    { id: "earn", label: "Earn" },
    { id: "accumulate", label: "Accumulate" },
    { id: "wallet", label: "Connect wallet" },
    { id: "claim", label: "Claim" },
    { id: "use", label: "Use NOLMT" }
  ]
};
