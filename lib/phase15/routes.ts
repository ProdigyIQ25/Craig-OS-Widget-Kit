export const COMMAND_SURFACE_ROUTES = {
  home: "/",
  personal: "/personal",
  personalToday: "/personal/today",
  personalFocus: "/personal/focus",
  personalGoals: "/personal/goals",
  personalProjects: "/personal/projects",
  personalGrowth: "/personal/growth",
  personalBrand: "/personal/brand",
  personalWeeklyReset: "/personal/weekly-reset",
  personalKnowledge: "/personal/knowledge",
  personalSpiritual: "/personal/spiritual",
  business: "/business",
  businessExecutive: "/business/executive",
  businessRevenue: "/business/revenue",
  businessProjects: "/business/projects",
  businessClients: "/business/clients",
  businessDecisions: "/business/decisions",
  businessIssues: "/business/issues",
  businessKnowledge: "/business/knowledge",
  businessWorkforce: "/business/workforce",
} as const;

export const AGGREGATE_API_ROUTES = [
  "/api/os/home",
  "/api/os/personal",
  "/api/os/personal/today",
  "/api/os/personal/focus",
  "/api/os/business",
  "/api/os/business/executive",
  "/api/os/business/revenue",
  "/api/os/business/clients",
  "/api/os/business/projects",
  "/api/os/capture",
] as const;

export type AggregateApiRoute = (typeof AGGREGATE_API_ROUTES)[number];

export const RESPONSIVE_WIDTHS = [390, 430, 768, 1024, 1440] as const;

const PERSONAL_PREFIX = "/personal";
const BUSINESS_PREFIX = "/business";
const SPIRITUAL_ROUTE = COMMAND_SURFACE_ROUTES.personalSpiritual;

export function routeContext(pathname: string): "home" | "personal" | "business" | "spiritual" | "unknown" {
  if (pathname === SPIRITUAL_ROUTE) return "spiritual";
  if (pathname === COMMAND_SURFACE_ROUTES.home) return "home";
  if (pathname === PERSONAL_PREFIX || pathname.startsWith(`${PERSONAL_PREFIX}/`)) return "personal";
  if (pathname === BUSINESS_PREFIX || pathname.startsWith(`${BUSINESS_PREFIX}/`)) return "business";
  return "unknown";
}

export function isAggregateRoute(pathname: string): pathname is AggregateApiRoute {
  return (AGGREGATE_API_ROUTES as readonly string[]).includes(pathname);
}
