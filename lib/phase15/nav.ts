import { COMMAND_SURFACE_ROUTES } from "./routes";
import { davidCraigInstance } from "./config";

export type NavItem = {
  id: string;
  label: string;
  href: string;
};

export const HOME_UTILITY: NavItem[] = [
  { id: "media", label: "Media Theater", href: "/os/media" },
  { id: "widgets", label: "Widgets", href: "/widgets/demo" },
];

export const PERSONAL_NAV: NavItem[] = [
  { id: "command", label: "Command", href: COMMAND_SURFACE_ROUTES.personal },
  { id: "today", label: "Today", href: COMMAND_SURFACE_ROUTES.personalToday },
  { id: "focus", label: "Focus", href: COMMAND_SURFACE_ROUTES.personalFocus },
  { id: "goals", label: "Goals", href: COMMAND_SURFACE_ROUTES.personalGoals },
  { id: "projects", label: "Projects", href: COMMAND_SURFACE_ROUTES.personalProjects },
  { id: "growth", label: "Growth", href: COMMAND_SURFACE_ROUTES.personalGrowth },
  { id: "brand", label: "Brand", href: COMMAND_SURFACE_ROUTES.personalBrand },
  { id: "reset", label: "Weekly Reset", href: COMMAND_SURFACE_ROUTES.personalWeeklyReset },
  { id: "knowledge", label: "Knowledge", href: COMMAND_SURFACE_ROUTES.personalKnowledge },
  { id: "spiritual", label: "Spiritual", href: COMMAND_SURFACE_ROUTES.personalSpiritual },
];

export const BUSINESS_NAV: NavItem[] = [
  { id: "command", label: "Command", href: COMMAND_SURFACE_ROUTES.business },
  { id: "executive", label: "Executive", href: COMMAND_SURFACE_ROUTES.businessExecutive },
  { id: "revenue", label: "Revenue", href: COMMAND_SURFACE_ROUTES.businessRevenue },
  { id: "projects", label: davidCraigInstance.productOperationsLabel, href: COMMAND_SURFACE_ROUTES.businessProjects },
  { id: "clients", label: "Clients", href: COMMAND_SURFACE_ROUTES.businessClients },
  { id: "decisions", label: "Decisions", href: COMMAND_SURFACE_ROUTES.businessDecisions },
  { id: "issues", label: "Issues", href: COMMAND_SURFACE_ROUTES.businessIssues },
  { id: "knowledge", label: "Knowledge", href: COMMAND_SURFACE_ROUTES.businessKnowledge },
  { id: "workforce", label: "Workforce", href: COMMAND_SURFACE_ROUTES.businessWorkforce },
];

export const CONTEXT_SWITCH = [
  { id: "home", label: "Home", href: COMMAND_SURFACE_ROUTES.home },
  { id: "personal", label: "Personal", href: COMMAND_SURFACE_ROUTES.personal },
  { id: "business", label: "Business", href: COMMAND_SURFACE_ROUTES.business },
] as const;
