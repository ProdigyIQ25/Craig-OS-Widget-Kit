export type PersonalMode = "command" | "focus" | "spiritual" | "brand" | "growth" | "reset";
export type BusinessMode = "executive" | "revenue" | "worktelli" | "engineering" | "clients" | "workforce";
export type OperatingMode = PersonalMode | BusinessMode;
export type ModeAction = { label: string; href: string; primary?: boolean; actionId?: ActionId; preset?: Record<string,string> };
export type ModeDefinition<T extends OperatingMode> = {
  mode: T;
  label: string;
  theme: string;
  heading: string;
  subheading: string;
  primaryAction: ModeAction;
  secondaryActions: ModeAction[];
  mediaContext: { label: string; mode: string; href: string };
  navigation: { label: string; href: string };
  moduleOrder: readonly string[];
  emptyState: string;
};

export const notion = {
  personalCommand: "https://www.notion.so/3da42c9f9e5f8107a4b7d4056fa6d8ff",
  businessCommand: "https://www.notion.so/3da42c9f9e5f81ca95c2c17aa2470cca",
  today: "https://www.notion.so/3da42c9f9e5f8161a132d3fc348d050c",
  focus: "https://www.notion.so/3da42c9f9e5f8174a46be4bbf198497d",
  spiritual: "https://www.notion.so/3da42c9f9e5f81b681e2ea1b47674c1b",
  brand: "https://www.notion.so/3da42c9f9e5f81e7aad9ef24244b6c82",
  growth: "https://www.notion.so/3da42c9f9e5f81f2b73df164fa9f0722",
  reset: "https://www.notion.so/3da42c9f9e5f819ca5a6ec72b0cd2c1c",
  revenue: "https://www.notion.so/3da42c9f9e5f81569dfeeb41ea185a5c",
  worktelli: "https://www.notion.so/3da42c9f9e5f81ff9582cbc1edc7d00e",
  engineering: "https://www.notion.so/3da42c9f9e5f811ab596d16e08496ec8",
  clients: "https://www.notion.so/3da42c9f9e5f819fbadec40c7e9fd976",
  workforce: "https://www.notion.so/3da42c9f9e5f8155b6abebca2bc35536",
  prayer: "https://www.notion.so/a2e100b81b534d9daf930c442c00281c",
  journal: "https://www.notion.so/a9b86e2046a4499b96618bf91d0e0d35",
  personalDecision: "https://www.notion.so/4c11a712c39a4176ba7a41a8a96c236c",
  brandIdea: "https://www.notion.so/fc7b4765360e47b48d6063f3837038ee",
  knowledge: "https://www.notion.so/e7075ed9959141d89382b515a0c09397",
  mediaLibrary: "https://www.notion.so/d5c978173aab4da9b6ae4f075d3b21e2",
  commitment: "https://www.notion.so/fc64e6a23d2a4065a28a6da487f23a67",
  personalSignal: "https://www.notion.so/b37baae9772d4581b39149217c142050",
  opportunity: "https://www.notion.so/4955ac345ac748e3b54128019a0a716a",
  businessSignal: "https://www.notion.so/3ce532354e3b4dd2891608083f988005",
  businessDecision: "https://www.notion.so/bbbee0957be8415ca52332df564bd85d",
  exception: "https://www.notion.so/87983ed749614694ba6bd0f0dfc6b586",
  initiative: "https://www.notion.so/2d3d81c2e6544444a8ae92ee4a6590bd",
} as const;

const media = (mode: string, label: string) => ({ label, mode, href: `/widgets/media?mode=${mode}&theme=personal` });

export const personalModeRegistry: Record<PersonalMode, ModeDefinition<PersonalMode>> = {
  command: { mode:"command", label:"COMMAND", theme:"command", heading:"David Command", subheading:"Operate with alignment. Protect what matters.", primaryAction:{label:"Protect today",href:notion.today,primary:true}, secondaryActions:[{label:"Add commitment",href:notion.commitment,actionId:"A-P01"},{label:"Capture signal",href:notion.personalSignal,actionId:"A-P03"}], mediaContext:media("deep-work","Current media"), navigation:{label:"Personal Command",href:notion.personalCommand}, moduleOrder:["attention","focus","capture","decisions","signals","rhythms","media"], emptyState:"Nothing currently requires attention." },
  focus: { mode:"focus", label:"FOCUS", theme:"focus", heading:"Focus", subheading:"One objective. Everything else gets quieter.", primaryAction:{label:"Start focus",href:"/widgets/focus?theme=personal&compact=true&mode=focus",primary:true}, secondaryActions:[{label:"+ Note",href:notion.knowledge},{label:"+ Insight",href:notion.knowledge,actionId:"A-P04"},{label:"Commitment",href:notion.commitment,actionId:"A-P01"},{label:"Exit focus",href:"?mode=command"}], mediaContext:media("focus","Focus audio"), navigation:{label:"Focus workspace",href:notion.focus}, moduleOrder:["objective","timer","media","capture","exit"], emptyState:"Choose one current outcome, then protect the session." },
  spiritual: { mode:"spiritual", label:"SPIRITUAL", theme:"spiritual", heading:"Spiritual Center", subheading:"Be still. Listen well.", primaryAction:{label:"Begin prayer session",href:"/widgets/session?theme=spiritual-minimal&compact=true&mode=prayer",primary:true}, secondaryActions:[{label:"+ Prayer",href:notion.prayer},{label:"+ Reflection",href:notion.journal},{label:"Scripture note",href:notion.spiritual}], mediaContext:media("spiritual","Worship / teaching"), navigation:{label:"Spiritual Center",href:notion.spiritual}, moduleOrder:["scripture","prayer","session","worship","teaching","reflection"], emptyState:"Prayer and journal entries are kept private. Open your journal when you are ready." },
  brand: { mode:"brand", label:"BRAND", theme:"brand", heading:"Brand Studio", subheading:"Create with conviction. Publish with authority.", primaryAction:{label:"Capture brand idea",href:notion.brandIdea,primary:true,actionId:"A-P05"}, secondaryActions:[{label:"+ Hook",href:notion.brandIdea},{label:"+ Insight",href:notion.knowledge,actionId:"A-P04"},{label:"Creation timer",href:"/widgets/focus?theme=personal&compact=true&mode=writing"}], mediaContext:media("writing","Reference media"), navigation:{label:"Brand Studio",href:notion.brand}, moduleOrder:["asset","pipeline","timer","reference","capture","ready"], emptyState:"Your active brand work will appear here as it takes shape." },
  growth: { mode:"growth", label:"GROWTH", theme:"growth", heading:"Growth Lab", subheading:"Turn insight into practice.", primaryAction:{label:"Capture knowledge",href:notion.knowledge,primary:true,actionId:"A-P04"}, secondaryActions:[{label:"+ Insight",href:notion.knowledge,actionId:"A-P04"},{label:"Enter focus",href:"?mode=focus"}], mediaContext:media("learning","Learning media"), navigation:{label:"Growth Lab",href:notion.growth}, moduleOrder:["study","media","capture","frameworks","focus"], emptyState:"Choose a topic to make this learning session count." },
  reset: { mode:"reset", label:"RESET", theme:"reset", heading:"Weekly Reset", subheading:"Close loops. Begin clean.", primaryAction:{label:"Open weekly review",href:notion.reset,primary:true}, secondaryActions:[{label:"+ Commitment",href:notion.commitment,actionId:"A-P01"},{label:"+ Decision",href:notion.personalDecision,actionId:"A-P02"},{label:"+ Signal",href:notion.personalSignal,actionId:"A-P03"}], mediaContext:media("reflection","Reflection media"), navigation:{label:"Reset workspace",href:notion.reset}, moduleOrder:["outcomes","commitments","rhythms","decisions","signals","reflection","next-week"], emptyState:"The week is clear. Prepare the next one deliberately." },
};

export const businessModeRegistry: Record<BusinessMode, ModeDefinition<BusinessMode>> = {
  executive: { mode:"executive", label:"EXECUTIVE", theme:"executive", heading:"Executive Command", subheading:"Make the next clear decision.", primaryAction:{label:"Review attention",href:notion.businessCommand,primary:true}, secondaryActions:[{label:"+ Decision",href:notion.businessDecision,actionId:"A-B02",preset:{category:"EXECUTIVE"}},{label:"+ Exception",href:notion.exception,actionId:"A-B03"},{label:"+ Signal",href:notion.businessSignal,actionId:"A-B04"}], mediaContext:media("general","Executive context"), navigation:{label:"Executive Command",href:notion.businessCommand}, moduleOrder:["requires-david","pulse","worktelli","revenue","workforce","decisions","exceptions","signals"], emptyState:"No executive decisions or exceptions require attention." },
  revenue: { mode:"revenue", label:"REVENUE", theme:"revenue", heading:"Revenue Command", subheading:"Move the right opportunity toward a clear next step.", primaryAction:{label:"Add opportunity",href:notion.opportunity,primary:true}, secondaryActions:[{label:"+ Opportunity",href:notion.opportunity,actionId:"A-B01"},{label:"+ Decision",href:notion.businessDecision,actionId:"A-B02",preset:{category:"COMMERCIAL"}},{label:"+ Signal",href:notion.businessSignal,actionId:"A-B04"}], mediaContext:media("general","Commercial context"), navigation:{label:"Revenue Command",href:notion.revenue}, moduleOrder:["radar","closing","follow-up","pipeline","signals","decisions","accounts"], emptyState:"Qualified opportunities will appear here when they enter the revenue pipeline." },
  worktelli: { mode:"worktelli", label:"WORKTELLI", theme:"worktelli", heading:"Worktelli Control", subheading:"See the product state. Decide the next move.", primaryAction:{label:"Manage product details",href:notion.worktelli,primary:true}, secondaryActions:[{label:"+ Capability",href:notion.worktelli,actionId:"A-B06"},{label:"+ Decision",href:notion.businessDecision,actionId:"A-B02",preset:{category:"WORKTELLI"}},{label:"+ Exception",href:notion.exception,actionId:"A-B03"},{label:"+ Signal",href:notion.businessSignal,actionId:"A-B04"}], mediaContext:media("general","Product context"), navigation:{label:"Worktelli Control",href:notion.worktelli}, moduleOrder:["state","constraint","qualification","packet","capabilities","decisions","exceptions","signals"], emptyState:"Product updates will appear here when they are ready to review." },
  engineering: { mode:"engineering", label:"ENGINEERING", theme:"engineering", heading:"Engineering Control", subheading:"Keep delivery, constraints, and release status aligned.", primaryAction:{label:"Manage engineering details",href:notion.engineering,primary:true}, secondaryActions:[{label:"+ Decision",href:notion.businessDecision,actionId:"A-B02",preset:{category:"ARCHITECTURE"}},{label:"+ Exception",href:notion.exception,actionId:"A-B03",preset:{exceptionType:"ENGINEERING FAILURE"}},{label:"+ Signal",href:notion.businessSignal,actionId:"A-B04",preset:{source:"ENGINEERING"}}], mediaContext:media("general","Technical context"), navigation:{label:"Engineering Control",href:notion.engineering}, moduleOrder:["packet","exceptions","qualification","constraints","decisions","navigation"], emptyState:"Engineering updates will appear here when a release is in motion." },
  clients: { mode:"clients", label:"CLIENTS", theme:"clients", heading:"Client Command", subheading:"Protect relationships. Surface service risk early.", primaryAction:{label:"Manage client details",href:notion.clients,primary:true}, secondaryActions:[{label:"+ Opportunity",href:notion.opportunity,actionId:"A-B01"},{label:"+ Signal",href:notion.businessSignal,actionId:"A-B04",preset:{source:"CLIENT"}},{label:"+ Exception",href:notion.exception,actionId:"A-B03",preset:{exceptionType:"CLIENT RISK"}}], mediaContext:media("general","Client context"), navigation:{label:"Client Command",href:notion.clients}, moduleOrder:["clients","risk","opportunities","signals","navigation"], emptyState:"Client detail is available when you need to work a relationship." },
  workforce: { mode:"workforce", label:"WORKFORCE", theme:"workforce", heading:"Workforce Control", subheading:"Direct capacity toward outcomes.", primaryAction:{label:"Manage workforce",href:notion.workforce,primary:true}, secondaryActions:[{label:"+ Digital Worker",href:notion.workforce,actionId:"A-B05"},{label:"+ Exception",href:notion.exception,actionId:"A-B03",preset:{exceptionType:"DIGITAL WORKER FAILURE"}},{label:"+ Signal",href:notion.businessSignal,actionId:"A-B04",preset:{source:"AGENT"}}], mediaContext:media("general","Operations context"), navigation:{label:"Workforce Control",href:notion.workforce}, moduleOrder:["status","attention","exceptions","metrics","executive-workers","functions"], emptyState:"Digital workers will appear here when they are active." },
};

export const personalModes = Object.keys(personalModeRegistry) as PersonalMode[];
export const businessModes = Object.keys(businessModeRegistry) as BusinessMode[];

export function parsePersonalMode(value: string | null): PersonalMode { return value && value in personalModeRegistry ? value as PersonalMode : "command"; }
export function parseBusinessMode(value: string | null): BusinessMode { return value && value in businessModeRegistry ? value as BusinessMode : "executive"; }
import type { ActionId } from "@/lib/actions/registry";
