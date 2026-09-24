import { COMMAND_SURFACE_ROUTES } from "./routes";
import { davidCraigInstance } from "./config";
import { PHASE15_CONTRACT_VERSION } from "./semantic";
import type {
  AggregateEnvelope,
  BusinessCommandData,
  CommandRecord,
  HomeCommandData,
  PersonalCommandData,
} from "./ui-models";
import { emptyModule, populatedModule, unavailableModule } from "./ui-models";

const NOTION_HOME = "https://www.notion.so";

function record(
  id: string,
  title: string,
  kind: string,
  context: "personal" | "business",
  detail?: string,
  tone: CommandRecord["tone"] = "neutral",
): CommandRecord {
  return {
    id,
    title,
    kind,
    detail,
    tone,
    status: tone === "attention" ? "Needs attention" : "Active",
    notionUrl: `${NOTION_HOME}/${id}`,
    context,
  };
}

/** Test-only fixtures. Never used as production fallback. */
export const HOME_FIXTURE_EMPTY: HomeCommandData = {
  context: "home",
  ownerPrivate: true,
  today: emptyModule("Today is clear.", "No personal tasks require attention right now."),
  focus: emptyModule("No active focus.", "Choose one objective when you are ready to work deeply."),
  requiresAttention: emptyModule("Nothing requires attention.", "When commitments or issues appear, they will surface here."),
  quickCapture: {
    state: "empty",
    title: "Quick capture",
    body: "Capture stays fail-closed until governed writes are authorized (BU-15.7).",
    items: [
      { kind: "task", label: "Capture task", href: "" },
      { kind: "decision", label: "Capture decision", href: "" },
      { kind: "opportunity", label: "Capture opportunity", href: "" },
    ],
  },
  personalCommand: emptyModule("Personal Command", "Open Personal OS when you need today's work."),
  businessCommand: emptyModule("Business Command", `Open ${davidCraigInstance.companyName} when you need executive context.`),
  activeProjects: emptyModule("No active projects.", "Projects appear here once they are in motion."),
  openDecisions: emptyModule("No open decisions or issues.", "Decision and issue pressure stays empty until live records exist."),
  revenueMovement: emptyModule("No revenue movement.", "Opportunities appear here without inventing forecasts."),
  weeklyReset: emptyModule("Weekly Reset", `Next review day is ${davidCraigInstance.reviewDay}.`),
  askCraigOs: {
    state: "populated",
    title: "Ask Craig OS",
    body: "Conversational operating intelligence with governed Capture handoff.",
    items: [{ label: "Ask Craig OS", href: COMMAND_SURFACE_ROUTES.ask, available: true }],
  },
  utility: {
    state: "empty",
    title: "Utilities",
    items: [
      { label: "Media Theater", href: "/os/media" },
      { label: "Legacy Personal shell", href: "/os/personal?mode=command" },
      { label: "Legacy Business shell", href: "/os/business?mode=executive" },
    ],
  },
};

export const HOME_FIXTURE_POPULATED: HomeCommandData = {
  ...HOME_FIXTURE_EMPTY,
  today: populatedModule("Today", [
    record("t1", "Protect the priority", "Task", "personal", "Due today", "attention"),
    record("t2", "Send weekly note", "Task", "personal", "Due this afternoon"),
  ]),
  focus: populatedModule("Current focus", [
    record("f1", "Worktelli Strategy", "Focus", "personal", "One current objective", "healthy"),
  ]),
  requiresAttention: populatedModule("Requires attention", [
    record("a1", "Approve proposal framing", "Decision", "business", "HIGH · IMMEDIATE", "attention"),
    record("a2", "Production constraint", "Issue", "business", "HIGH · TRIAGE", "critical"),
  ]),
  activeProjects: populatedModule("Active projects", [
    record("p1", "Craig OS Phase 15", "Project", "personal", "In progress"),
    record("p2", "Client onboarding", "Project", "business", "Active"),
  ]),
  openDecisions: populatedModule("Open decisions / issues", [
    record("d1", "Approve proposal framing", "Decision", "business", "Needs David", "attention"),
  ]),
  revenueMovement: populatedModule("Revenue movement", [
    record("o1", "Priority account", "Opportunity", "business", "PROPOSAL · $125,000", "healthy"),
  ]),
};

export const PERSONAL_FIXTURE_EMPTY: PersonalCommandData = {
  context: "personal",
  today: emptyModule("Today is clear.", "No personal tasks require attention.") as unknown as PersonalCommandData["today"],
  focus: {
    state: "empty",
    title: "Focus is quiet.",
    body: "Set one goal, one project, and the tasks that matter.",
    items: { goal: null, project: null, tasks: [] },
  },
  goals: emptyModule("No personal goals.", "Name an outcome before opening a project.") as unknown as PersonalCommandData["goals"],
  projects: emptyModule("No personal projects.", "Projects belong to multi-step work.") as unknown as PersonalCommandData["projects"],
  growth: emptyModule("Growth is empty.", "Learning notes appear from Personal Knowledge.") as unknown as PersonalCommandData["growth"],
  brand: emptyModule("Brand is empty.", "Brand notes appear from Personal Knowledge.") as unknown as PersonalCommandData["brand"],
  weeklyReset: emptyModule("Weekly Reset", "Clear. Reorient. Resolve. Choose."),
  knowledge: emptyModule("No knowledge records.", "Capture insights when they change how you operate.") as unknown as PersonalCommandData["knowledge"],
  spiritualEntry: {
    state: "empty",
    title: "Spiritual entry",
    body: "Prayer and Journal stay private. This surface only opens the protected entry.",
    items: [{ label: "Open Spiritual Center", href: COMMAND_SURFACE_ROUTES.personalSpiritual }],
  },
};

export const PERSONAL_FIXTURE_POPULATED: PersonalCommandData = {
  ...PERSONAL_FIXTURE_EMPTY,
  today: {
    state: "populated",
    title: "Today",
    items: [
      {
        id: "pt1",
        title: "Protect the priority",
        context: "personal",
        notionUrl: `${NOTION_HOME}/pt1`,
        status: "Active",
        dueDate: "2026-09-21",
        priority: "High",
      },
    ],
  },
  focus: {
    state: "populated",
    title: "Focus",
    items: {
      goal: {
        id: "g1",
        title: "Ship Phase 15",
        context: "personal",
        notionUrl: `${NOTION_HOME}/g1`,
        status: "Active",
      },
      project: {
        id: "pp1",
        title: "Command surface",
        context: "personal",
        notionUrl: `${NOTION_HOME}/pp1`,
        status: "In progress",
        relatedGoalId: "g1",
      },
      tasks: [
        {
          id: "pt1",
          title: "Protect the priority",
          context: "personal",
          notionUrl: `${NOTION_HOME}/pt1`,
          status: "Active",
        },
      ],
    },
  },
  goals: {
    state: "populated",
    title: "Goals",
    items: [
      {
        id: "g1",
        title: "Ship Phase 15",
        context: "personal",
        notionUrl: `${NOTION_HOME}/g1`,
        status: "Active",
        measureOfSuccess: "Home, Personal, and Business certified",
      },
    ],
  },
  projects: {
    state: "populated",
    title: "Projects",
    items: [
      {
        id: "pp1",
        title: "Command surface",
        context: "personal",
        notionUrl: `${NOTION_HOME}/pp1`,
        status: "In progress",
        relatedGoalId: "g1",
      },
    ],
  },
};

export const BUSINESS_FIXTURE_EMPTY: BusinessCommandData = {
  context: "business",
  executive: emptyModule("Executive is clear.", "Decisions, issues, and project pressure will appear here."),
  revenue: emptyModule("No opportunities.", "Stage visibility appears without inventing forecasts.") as unknown as BusinessCommandData["revenue"],
  projects: emptyModule("No business projects.", "Product operations stay empty until live work exists.") as unknown as BusinessCommandData["projects"],
  clients: emptyModule("No clients loaded.", "Companies and People share one relationship model.") as unknown as BusinessCommandData["clients"],
  decisions: emptyModule("No business decisions.", "Open decisions appear when they need judgment.") as unknown as BusinessCommandData["decisions"],
  issues: emptyModule("No issues.", "Operational issues appear with resolution state.") as unknown as BusinessCommandData["issues"],
  knowledge: emptyModule("No business knowledge.", "Operating notes stay in Business Knowledge.") as unknown as BusinessCommandData["knowledge"],
  workforce: emptyModule(
    "Workforce is not authorized yet.",
    "Digital Workers remains a placeholder until that module is enabled.",
  ),
};

export const BUSINESS_FIXTURE_POPULATED: BusinessCommandData = {
  ...BUSINESS_FIXTURE_EMPTY,
  executive: populatedModule("Requires attention", [
    record("bd1", "Approve proposal framing", "Decision", "business", "HIGH · IMMEDIATE", "attention"),
    record("bi1", "Production constraint", "Issue", "business", "HIGH · TRIAGE", "critical"),
    record("bp1", "Client onboarding", "Project", "business", "Active"),
  ]),
  revenue: {
    state: "populated",
    title: "Revenue",
    items: [
      {
        id: "bo1",
        title: "Priority account",
        context: "business",
        notionUrl: `${NOTION_HOME}/bo1`,
        stage: "PROPOSAL",
        value: 125000,
        followUpDate: "2026-09-22",
      },
      {
        id: "bo2",
        title: "Expansion conversation",
        context: "business",
        notionUrl: `${NOTION_HOME}/bo2`,
        stage: "QUALIFY",
        value: 48000,
        followUpDate: "2026-09-24",
      },
    ],
  },
  decisions: {
    state: "populated",
    title: "Decisions",
    items: [
      {
        id: "bd1",
        title: "Approve proposal framing",
        context: "business",
        notionUrl: `${NOTION_HOME}/bd1`,
        status: "Open",
        evidenceClass: "DAVID_DECISION",
      },
    ],
  },
  issues: {
    state: "populated",
    title: "Issues",
    items: [
      {
        id: "bi1",
        title: "Production constraint",
        context: "business",
        notionUrl: `${NOTION_HOME}/bi1`,
        type: "Blocker",
        status: "Open",
        severity: "HIGH",
      },
    ],
  },
  clients: {
    state: "populated",
    title: "Clients",
    items: [
      {
        id: "bc1",
        title: "Acme Holdings",
        context: "business",
        notionUrl: `${NOTION_HOME}/bc1`,
        relationship: "Active client",
        status: "Active",
      },
      {
        id: "bppl1",
        title: "Jordan Lee",
        context: "business",
        notionUrl: `${NOTION_HOME}/bppl1`,
        role: "Champion",
        relatedCompanyId: "bc1",
        status: "Active",
      },
    ],
  },
};

export function envelope<T>(data: T, source: "fixture" | "notion" = "fixture"): AggregateEnvelope<T> {
  return {
    ok: true,
    data,
    source,
    version: PHASE15_CONTRACT_VERSION,
    generatedAt: "2026-09-21T16:00:00.000Z",
    upstream: "AVAILABLE",
    error: null,
  };
}

export function unavailableEnvelope(): AggregateEnvelope<never> {
  return {
    ok: false,
    data: null,
    source: "system",
    version: PHASE15_CONTRACT_VERSION,
    generatedAt: "2026-09-21T16:00:00.000Z",
    upstream: "UPSTREAM_UNAVAILABLE",
    error: {
      code: "UPSTREAM_UNAVAILABLE",
      message: "Canonical source unavailable. Live records were not invented.",
    },
  };
}

export { unavailableModule };
