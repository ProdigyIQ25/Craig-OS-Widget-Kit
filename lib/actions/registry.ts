export const ACTION_IDS = [
  "A-P01", "A-P02", "A-P03", "A-P04", "A-P05",
  "A-B01", "A-B02", "A-B03", "A-B04", "A-B05", "A-B06",
] as const;

export type ActionId = typeof ACTION_IDS[number];
export type ActionScope = "personal" | "business";
export type ActionField = {
  key: string;
  label: string;
  kind: "text" | "textarea" | "date" | "url" | "select";
  required?: boolean;
  maxLength?: number;
  options?: readonly string[];
  placeholder?: string;
};
export type ActionDefinition = {
  id: ActionId;
  scope: ActionScope;
  slug: string;
  displayName: string;
  shortLabel: string;
  destination: string;
  fields: readonly ActionField[];
};

const exceptionTypes = ["ENGINEERING FAILURE", "CLIENT RISK", "REVENUE RISK", "MISSED COMMITMENT", "SECURITY ISSUE", "FINANCIAL ANOMALY", "DIGITAL WORKER FAILURE", "PRODUCT CONSTRAINT", "STRATEGIC BLOCKER"] as const;
const severities = ["INFORMATIONAL", "ATTENTION", "HIGH", "CRITICAL"] as const;
const decisionCategories = ["EXECUTIVE", "COMMERCIAL", "ARCHITECTURE", "WORKTELLI"] as const;
const signalSources = ["MEETING", "EMAIL", "LINKEDIN", "CLIENT", "PROSPECT", "MARKET", "ENGINEERING", "AGENT", "RESEARCH", "SYSTEM", "OTHER"] as const;
const workerFunctions = ["EXECUTIVE", "REVENUE", "MARKETING", "PRODUCT", "ENGINEERING", "CLIENT SUCCESS", "OPERATIONS", "FINANCE", "KNOWLEDGE", "RESEARCH"] as const;
const capabilityDomains = ["AGENTS", "KNOWLEDGE", "INTEGRATIONS", "WORKFLOWS", "ARTIFACTS", "GOVERNANCE", "IDENTITY", "OBSERVABILITY", "COMPUTER CONTROL", "BUILDER FACTORY"] as const;

export const actionRegistry: Record<ActionId, ActionDefinition> = {
  "A-P01": { id:"A-P01", scope:"personal", slug:"commitment", displayName:"Commitment Capture", shortLabel:"Commitment", destination:"P03 Personal Commitments", fields:[{key:"title",label:"Commitment",kind:"textarea",required:true,maxLength:500,placeholder:"What are you committing to?"},{key:"dueDate",label:"Due date",kind:"date"}] },
  "A-P02": { id:"A-P02", scope:"personal", slug:"decision", displayName:"Decision Capture", shortLabel:"Decision", destination:"P09 Personal Decisions", fields:[{key:"title",label:"Decision / question",kind:"textarea",required:true,maxLength:500,placeholder:"What decision needs to be made?"},{key:"reviewDate",label:"Review date",kind:"date"}] },
  "A-P03": { id:"A-P03", scope:"personal", slug:"signal", displayName:"Signal Capture", shortLabel:"Signal", destination:"P10 Personal Signals", fields:[{key:"title",label:"Signal",kind:"textarea",required:true,maxLength:500,placeholder:"What did you notice?"},{key:"evidence",label:"Evidence / context",kind:"textarea",maxLength:2000,placeholder:"Optional supporting context"}] },
  "A-P04": { id:"A-P04", scope:"personal", slug:"insight", displayName:"Knowledge / Insight Capture", shortLabel:"Insight", destination:"P08 Personal Knowledge", fields:[{key:"title",label:"Title / insight",kind:"textarea",required:true,maxLength:500,placeholder:"What is worth keeping?"},{key:"sourceUrl",label:"Source URL",kind:"url",maxLength:2000,placeholder:"Optional https:// source"}] },
  "A-P05": { id:"A-P05", scope:"personal", slug:"brand-idea", displayName:"Brand Idea Capture", shortLabel:"Brand Idea", destination:"P07 Brand Assets", fields:[{key:"title",label:"Title / idea",kind:"textarea",required:true,maxLength:500,placeholder:"What is the idea?"},{key:"nextAction",label:"Next action",kind:"text",maxLength:500,placeholder:"Optional next move"}] },
  "A-B01": { id:"A-B01", scope:"business", slug:"opportunity", displayName:"Opportunity Capture", shortLabel:"Opportunity", destination:"B03 Opportunities", fields:[{key:"title",label:"Opportunity",kind:"textarea",required:true,maxLength:500,placeholder:"What opportunity should be evaluated?"},{key:"targetCloseDate",label:"Target close date",kind:"date"}] },
  "A-B02": { id:"A-B02", scope:"business", slug:"decision", displayName:"Business Decision Capture", shortLabel:"Decision", destination:"B05 Decisions", fields:[{key:"title",label:"Decision / question",kind:"textarea",required:true,maxLength:500,placeholder:"What decision is required?"},{key:"category",label:"Context",kind:"select",options:decisionCategories}] },
  "A-B03": { id:"A-B03", scope:"business", slug:"exception", displayName:"Exception Capture", shortLabel:"Exception", destination:"B07 Exceptions", fields:[{key:"title",label:"Exception",kind:"textarea",required:true,maxLength:500,placeholder:"What condition requires attention?"},{key:"exceptionType",label:"Type",kind:"select",required:true,options:exceptionTypes},{key:"severity",label:"Severity",kind:"select",options:severities}] },
  "A-B04": { id:"A-B04", scope:"business", slug:"signal", displayName:"Business Signal Capture", shortLabel:"Signal", destination:"B06 Signals", fields:[{key:"title",label:"Signal",kind:"textarea",required:true,maxLength:500,placeholder:"What changed or became visible?"},{key:"source",label:"Source",kind:"select",options:signalSources}] },
  "A-B05": { id:"A-B05", scope:"business", slug:"digital-worker", displayName:"Digital Worker Capture", shortLabel:"Digital Worker", destination:"B08 Digital Workers", fields:[{key:"title",label:"Name",kind:"text",required:true,maxLength:200,placeholder:"Digital worker name"},{key:"function",label:"Function",kind:"select",required:true,options:workerFunctions},{key:"mission",label:"Mission",kind:"textarea",maxLength:2000,placeholder:"Optional draft mission"}] },
  "A-B06": { id:"A-B06", scope:"business", slug:"worktelli-capability", displayName:"Worktelli Capability Capture", shortLabel:"Capability", destination:"B10 Worktelli Capabilities", fields:[{key:"title",label:"Capability",kind:"textarea",required:true,maxLength:500,placeholder:"What capability should be evaluated?"},{key:"capabilityDomain",label:"Capability domain",kind:"select",options:capabilityDomains}] },
};

export const actionByPath = new Map(Object.values(actionRegistry).map(action => [`${action.scope}/${action.slug}`, action]));
export const actionPath = (id: ActionId) => `/api/actions/${actionRegistry[id].scope}/${actionRegistry[id].slug}`;
