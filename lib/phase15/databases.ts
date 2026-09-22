import type { OsContext } from "./semantic";

export type PropertyClass = "USER-FACING" | "SYSTEM" | "RELATIONSHIP" | "ADMIN";

export type PropertyMap = {
  name: string;
  notionType: string;
  required: boolean;
  classification: PropertyClass;
};

export type DatabaseBinding = "UNBOUND";

export type CanonicalDatabase = {
  number: number;
  key: string;
  name: string;
  context: OsContext;
  sensitivity: "standard" | "spiritual";
  notionDataSourceId: null;
  binding: DatabaseBinding;
  titleProperty: string;
  properties: readonly PropertyMap[];
  relations: readonly { property: string; targetKey: string }[];
  dedup: string;
  emptyState: { belongs: string; whyEmpty: string; nextAction: string };
};

const archived: PropertyMap = { name: "Archived", notionType: "checkbox", required: false, classification: "SYSTEM" };
const created: PropertyMap = { name: "Created time", notionType: "created_time", required: false, classification: "SYSTEM" };

function props(...items: PropertyMap[]): readonly PropertyMap[] {
  return items;
}

export const CANONICAL_DATABASES: readonly CanonicalDatabase[] = [
  {
    number: 1,
    key: "personal.goals",
    name: "Personal Goals",
    context: "personal",
    sensitivity: "standard",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Goal",
    properties: props(
      { name: "Goal", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "Status", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Target Date", notionType: "date", required: false, classification: "USER-FACING" },
      { name: "Measure of Success", notionType: "text", required: false, classification: "USER-FACING" },
      archived,
      created,
    ),
    relations: [],
    dedup: "personal + normalized goal title",
    emptyState: { belongs: "A personal outcome you intend to reach.", whyEmpty: "No personal goals are loaded.", nextAction: "Add a goal when you can name the outcome." },
  },
  {
    number: 2,
    key: "personal.projects",
    name: "Personal Projects",
    context: "personal",
    sensitivity: "standard",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Project",
    properties: props(
      { name: "Project", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "Status", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Goal", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Start Date", notionType: "date", required: false, classification: "USER-FACING" },
      { name: "Target Date", notionType: "date", required: false, classification: "USER-FACING" },
      { name: "Completed Date", notionType: "date", required: false, classification: "SYSTEM" },
      archived,
      created,
    ),
    relations: [{ property: "Goal", targetKey: "personal.goals" }],
    dedup: "personal + normalized project title",
    emptyState: { belongs: "A multi-step personal effort.", whyEmpty: "No personal projects are loaded.", nextAction: "Add a project only when the work has more than one step." },
  },
  {
    number: 3,
    key: "personal.tasks",
    name: "Personal Tasks",
    context: "personal",
    sensitivity: "standard",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Task",
    properties: props(
      { name: "Task", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "Status", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Due Date", notionType: "date", required: false, classification: "USER-FACING" },
      { name: "Priority", notionType: "select", required: false, classification: "USER-FACING" },
      { name: "Project", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Goal", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Completed Date", notionType: "date", required: false, classification: "SYSTEM" },
      archived,
      created,
    ),
    relations: [
      { property: "Project", targetKey: "personal.projects" },
      { property: "Goal", targetKey: "personal.goals" },
    ],
    dedup: "personal + normalized task title + related project",
    emptyState: { belongs: "One personal commitment you can finish.", whyEmpty: "Nothing is due in this view.", nextAction: "Add the first task you want to finish." },
  },
  {
    number: 4,
    key: "personal.decisions",
    name: "Personal Decisions",
    context: "personal",
    sensitivity: "standard",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Decision",
    properties: props(
      { name: "Decision", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "Status", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Outcome", notionType: "text", required: false, classification: "USER-FACING" },
      { name: "Rationale", notionType: "text", required: false, classification: "USER-FACING" },
      { name: "Decision Date", notionType: "date", required: false, classification: "USER-FACING" },
      { name: "Project", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Source", notionType: "url", required: false, classification: "SYSTEM" },
      archived,
      created,
    ),
    relations: [{ property: "Project", targetKey: "personal.projects" }],
    dedup: "personal + normalized decision title",
    emptyState: { belongs: "A choice you made or still need to make.", whyEmpty: "No personal decisions are open.", nextAction: "Capture a decision only when you are choosing." },
  },
  {
    number: 5,
    key: "personal.knowledge",
    name: "Personal Knowledge",
    context: "personal",
    sensitivity: "standard",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Title",
    properties: props(
      { name: "Title", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "Type", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Summary", notionType: "text", required: false, classification: "USER-FACING" },
      { name: "Project", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Goal", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Source", notionType: "url", required: false, classification: "SYSTEM" },
      { name: "Observed Date", notionType: "date", required: false, classification: "USER-FACING" },
      archived,
      created,
    ),
    relations: [
      { property: "Project", targetKey: "personal.projects" },
      { property: "Goal", targetKey: "personal.goals" },
    ],
    dedup: "personal + type + normalized title",
    emptyState: { belongs: "A note, insight, or reference you want to keep.", whyEmpty: "No personal knowledge is loaded.", nextAction: "Capture an insight when you actually learned something." },
  },
  {
    number: 6,
    key: "personal.prayer",
    name: "Prayer",
    context: "personal",
    sensitivity: "spiritual",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Prayer",
    properties: props(
      { name: "Prayer", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "State", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Reflection", notionType: "text", required: false, classification: "USER-FACING" },
      { name: "Date", notionType: "date", required: false, classification: "USER-FACING" },
      archived,
      created,
    ),
    relations: [],
    dedup: "explicit prayer intent + normalized title; never matched from general capture",
    emptyState: { belongs: "An intentional prayer.", whyEmpty: "Prayer stays empty until you choose to write one.", nextAction: "Open Spiritual and save only with explicit intent." },
  },
  {
    number: 7,
    key: "personal.spiritual-journal",
    name: "Spiritual Journal",
    context: "personal",
    sensitivity: "spiritual",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Entry",
    properties: props(
      { name: "Entry", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "Entry Date", notionType: "date", required: false, classification: "USER-FACING" },
      { name: "Theme", notionType: "text", required: false, classification: "USER-FACING" },
      archived,
      created,
    ),
    relations: [],
    dedup: "explicit journal intent + normalized entry title",
    emptyState: { belongs: "A deliberate spiritual reflection.", whyEmpty: "The journal is private and empty until you write.", nextAction: "Open Spiritual and save only with explicit intent." },
  },
  {
    number: 8,
    key: "business.goals",
    name: "Business Goals",
    context: "business",
    sensitivity: "standard",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Goal",
    properties: props(
      { name: "Goal", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "Status", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Target Date", notionType: "date", required: false, classification: "USER-FACING" },
      { name: "Measure of Success", notionType: "text", required: false, classification: "USER-FACING" },
      { name: "Owner", notionType: "person", required: false, classification: "USER-FACING" },
      archived,
      created,
    ),
    relations: [],
    dedup: "business + normalized goal title",
    emptyState: { belongs: "A business outcome.", whyEmpty: "No business goals are loaded.", nextAction: "Add a goal only when the result is explicit." },
  },
  {
    number: 9,
    key: "business.projects",
    name: "Business Projects",
    context: "business",
    sensitivity: "standard",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Project",
    properties: props(
      { name: "Project", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "Status", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Goal", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Company", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Owner", notionType: "person", required: false, classification: "USER-FACING" },
      { name: "Start Date", notionType: "date", required: false, classification: "USER-FACING" },
      { name: "Target Date", notionType: "date", required: false, classification: "USER-FACING" },
      { name: "Completed Date", notionType: "date", required: false, classification: "SYSTEM" },
      archived,
      created,
    ),
    relations: [
      { property: "Goal", targetKey: "business.goals" },
      { property: "Company", targetKey: "business.companies" },
    ],
    dedup: "business + normalized project title + company",
    emptyState: { belongs: "Current business delivery.", whyEmpty: "No business projects are loaded.", nextAction: "Add a project when the work is a real delivery container." },
  },
  {
    number: 10,
    key: "business.tasks",
    name: "Business Tasks",
    context: "business",
    sensitivity: "standard",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Task",
    properties: props(
      { name: "Task", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "Status", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Due Date", notionType: "date", required: false, classification: "USER-FACING" },
      { name: "Owner", notionType: "person", required: false, classification: "USER-FACING" },
      { name: "Priority", notionType: "select", required: false, classification: "USER-FACING" },
      { name: "Project", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Opportunity", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Issue", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Completed Date", notionType: "date", required: false, classification: "SYSTEM" },
      archived,
      created,
    ),
    relations: [
      { property: "Project", targetKey: "business.projects" },
      { property: "Opportunity", targetKey: "business.opportunities" },
      { property: "Issue", targetKey: "business.issues" },
    ],
    dedup: "business + normalized task title + related project or opportunity",
    emptyState: { belongs: "A business commitment.", whyEmpty: "No business tasks are loaded.", nextAction: "Add a task only for an explicit next action." },
  },
  {
    number: 11,
    key: "business.decisions",
    name: "Business Decisions",
    context: "business",
    sensitivity: "standard",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Decision",
    properties: props(
      { name: "Decision", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "Status", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Outcome", notionType: "text", required: false, classification: "USER-FACING" },
      { name: "Rationale", notionType: "text", required: false, classification: "USER-FACING" },
      { name: "Decision Date", notionType: "date", required: false, classification: "USER-FACING" },
      { name: "Decision Maker", notionType: "person", required: false, classification: "USER-FACING" },
      { name: "Project", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Opportunity", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Source", notionType: "url", required: false, classification: "SYSTEM" },
      archived,
      created,
    ),
    relations: [
      { property: "Project", targetKey: "business.projects" },
      { property: "Opportunity", targetKey: "business.opportunities" },
    ],
    dedup: "business + normalized decision title",
    emptyState: { belongs: "A business choice.", whyEmpty: "No business decisions are waiting.", nextAction: "Record a decision only after the choice is explicit." },
  },
  {
    number: 12,
    key: "business.knowledge",
    name: "Business Knowledge",
    context: "business",
    sensitivity: "standard",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Title",
    properties: props(
      { name: "Title", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "Type", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Summary", notionType: "text", required: false, classification: "USER-FACING" },
      { name: "Project", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Company", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Source", notionType: "url", required: false, classification: "SYSTEM" },
      { name: "Observed Date", notionType: "date", required: false, classification: "USER-FACING" },
      archived,
      created,
    ),
    relations: [
      { property: "Project", targetKey: "business.projects" },
      { property: "Company", targetKey: "business.companies" },
    ],
    dedup: "business + type + normalized title",
    emptyState: { belongs: "A meeting note, insight, or reference.", whyEmpty: "No business knowledge is loaded.", nextAction: "Capture a note when there is a source to preserve." },
  },
  {
    number: 13,
    key: "business.companies",
    name: "Companies",
    context: "business",
    sensitivity: "standard",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Company",
    properties: props(
      { name: "Company", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "Domain", notionType: "url", required: false, classification: "USER-FACING" },
      { name: "Relationship", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Status", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Notes", notionType: "text", required: false, classification: "USER-FACING" },
      archived,
      created,
    ),
    relations: [],
    dedup: "normalized domain, else normalized company name",
    emptyState: { belongs: "An organization you work with.", whyEmpty: "No companies are loaded.", nextAction: "Add a company from a stated name or domain." },
  },
  {
    number: 14,
    key: "business.people",
    name: "People",
    context: "business",
    sensitivity: "standard",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Person",
    properties: props(
      { name: "Person", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "Email", notionType: "email", required: false, classification: "USER-FACING" },
      { name: "Role", notionType: "text", required: false, classification: "USER-FACING" },
      { name: "Company", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Status", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Follow-Up Date", notionType: "date", required: false, classification: "USER-FACING" },
      archived,
      created,
    ),
    relations: [{ property: "Company", targetKey: "business.companies" }],
    dedup: "normalized email, else normalized person name",
    emptyState: { belongs: "A person you need to remember.", whyEmpty: "No people are loaded.", nextAction: "Add a person only with a supplied name." },
  },
  {
    number: 15,
    key: "business.opportunities",
    name: "Opportunities",
    context: "business",
    sensitivity: "standard",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Opportunity",
    properties: props(
      { name: "Opportunity", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "Stage", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Company", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Primary Contact", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Value", notionType: "number", required: false, classification: "USER-FACING" },
      { name: "Next Action", notionType: "text", required: false, classification: "USER-FACING" },
      { name: "Follow-Up Date", notionType: "date", required: false, classification: "USER-FACING" },
      { name: "Owner", notionType: "person", required: false, classification: "USER-FACING" },
      archived,
      created,
    ),
    relations: [
      { property: "Company", targetKey: "business.companies" },
      { property: "Primary Contact", targetKey: "business.people" },
    ],
    dedup: "business + company + normalized opportunity title",
    emptyState: { belongs: "A possible commercial conversation.", whyEmpty: "No opportunities are loaded.", nextAction: "Add an opportunity only when the commercial intent is stated." },
  },
  {
    number: 16,
    key: "business.issues",
    name: "Issues",
    context: "business",
    sensitivity: "standard",
    notionDataSourceId: null,
    binding: "UNBOUND",
    titleProperty: "Issue",
    properties: props(
      { name: "Issue", notionType: "title", required: true, classification: "USER-FACING" },
      { name: "Type", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Status", notionType: "select", required: true, classification: "USER-FACING" },
      { name: "Severity", notionType: "select", required: false, classification: "USER-FACING" },
      { name: "Owner", notionType: "person", required: false, classification: "USER-FACING" },
      { name: "Project", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Company", notionType: "relation", required: false, classification: "RELATIONSHIP" },
      { name: "Resolution", notionType: "text", required: false, classification: "USER-FACING" },
      archived,
      created,
    ),
    relations: [
      { property: "Project", targetKey: "business.projects" },
      { property: "Company", targetKey: "business.companies" },
    ],
    dedup: "business + type + normalized issue title + related project",
    emptyState: { belongs: "A problem, risk, blocker, or escalation.", whyEmpty: "No issues are open.", nextAction: "Add an issue only for a stated problem." },
  },
];

const byKey = new Map(CANONICAL_DATABASES.map((database) => [database.key, database]));

export function databaseByKey(key: string): CanonicalDatabase | undefined {
  return byKey.get(key);
}

export function relationTargetsStayInsideContext(database: CanonicalDatabase): boolean {
  return database.relations.every((relation) => {
    const target = byKey.get(relation.targetKey);
    return Boolean(target) && target?.context === database.context && target.sensitivity !== "spiritual";
  });
}

export function spiritualDatabases(): readonly CanonicalDatabase[] {
  return CANONICAL_DATABASES.filter((database) => database.sensitivity === "spiritual");
}

export function databasesForContext(context: OsContext, includeSpiritual = false): readonly CanonicalDatabase[] {
  return CANONICAL_DATABASES.filter((database) => {
    if (database.context !== context) return false;
    if (!includeSpiritual && database.sensitivity === "spiritual") return false;
    return true;
  });
}
