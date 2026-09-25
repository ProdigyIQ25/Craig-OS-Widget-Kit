import { CANONICAL_DATABASES, type CanonicalDatabase } from "./databases";

export type SchemaClass = "MATCH" | "SAFE ADAPTER DIFFERENCE" | "CONTRACT DRIFT" | "BLOCKER";

export type TemplateSource = {
  key: string;
  zone: "personal" | "business";
  sensitivity: "standard" | "spiritual";
  logicalName: string;
  liveName: string;
  databaseId: string;
  dataSourceId: string;
  notionUrl: string;
  envName: string;
  properties: Readonly<Record<string, string>>;
  relations: readonly { property: string; targetDataSourceId: string }[];
};

const personal = "personal" as const;
const business = "business" as const;

export const TEMPLATE_SOURCES: readonly TemplateSource[] = [
  source("personal.goals", personal, "standard", "Personal Goals", "Personal Goals", "b804300cf67244df8af65735c6cc2222", "f99ee6eb-df19-4603-802c-c7d3315415f9", "CRAIG_OS_NOTION_PERSONAL_GOALS_DATA_SOURCE_ID", { Goal: "title", Status: "select", "Target Date": "date", "Measure of Success": "text", Archived: "checkbox", "Created time": "created_time" }, []),
  source("personal.projects", personal, "standard", "Personal Projects", "Personal Projects", "e46e14c928294d4cbcaf88306dc8cf8e", "e86a6328-da0b-4b94-a2be-cd307a0614c1", "CRAIG_OS_NOTION_PERSONAL_PROJECTS_DATA_SOURCE_ID", { Project: "title", Status: "select", Goal: "relation", "Start Date": "date", "Target Date": "date", "Completed Date": "date", Archived: "checkbox", "Created time": "created_time" }, [{ property: "Goal", targetDataSourceId: "f99ee6eb-df19-4603-802c-c7d3315415f9" }]),
  source("personal.tasks", personal, "standard", "Personal Tasks", "Personal Tasks", "72b2e2a442c34eeb86030e1f59c98af5", "747b3158-78c0-488d-a2ab-89b00e14cd45", "CRAIG_OS_NOTION_PERSONAL_TASKS_DATA_SOURCE_ID", { Task: "title", Status: "select", "Due Date": "date", Priority: "select", Project: "relation", Goal: "relation", "Completed Date": "date", Archived: "checkbox", "Created time": "created_time" }, [{ property: "Project", targetDataSourceId: "e86a6328-da0b-4b94-a2be-cd307a0614c1" }, { property: "Goal", targetDataSourceId: "f99ee6eb-df19-4603-802c-c7d3315415f9" }]),
  source("personal.decisions", personal, "standard", "Personal Decisions", "Personal Decisions", "0424439ea2104a758b5a79abeb9d46cb", "84d61312-9c36-43f0-9a3e-4ccb0a6161a1", "CRAIG_OS_NOTION_PERSONAL_DECISIONS_DATA_SOURCE_ID", { Decision: "title", Status: "select", Outcome: "text", Rationale: "text", "Decision Date": "date", Project: "relation", Source: "url", Archived: "checkbox", "Created time": "created_time" }, [{ property: "Project", targetDataSourceId: "e86a6328-da0b-4b94-a2be-cd307a0614c1" }]),
  source("personal.knowledge", personal, "standard", "Personal Knowledge", "Personal Knowledge", "c25542a0685f49aa9069341e115286b5", "54c5c401-ae05-4ae5-a66a-2924b7a22ee1", "CRAIG_OS_NOTION_PERSONAL_KNOWLEDGE_DATA_SOURCE_ID", { Title: "title", Type: "select", Summary: "text", Project: "relation", Goal: "relation", Source: "url", "Observed Date": "date", Archived: "checkbox", "Created time": "created_time", Area: "select" }, [{ property: "Project", targetDataSourceId: "e86a6328-da0b-4b94-a2be-cd307a0614c1" }, { property: "Goal", targetDataSourceId: "f99ee6eb-df19-4603-802c-c7d3315415f9" }]),
  source("personal.prayer", personal, "spiritual", "Prayer", "Personal Prayer", "b14bf3229a2e499296fa8e20b0739f80", "5526319d-76c2-4697-96be-b04e792fdd3f", "CRAIG_OS_NOTION_PRAYER_DATA_SOURCE_ID", { Prayer: "title", State: "select", Reflection: "text", Date: "date", Archived: "checkbox", "Created time": "created_time" }, []),
  source("personal.spiritual-journal", personal, "spiritual", "Spiritual Journal", "Personal Spiritual Journal", "132c84e3bb124716a9932d862b5b6ea8", "07e4a7d3-b06b-4916-8459-b76218456f6c", "CRAIG_OS_NOTION_SPIRITUAL_JOURNAL_DATA_SOURCE_ID", { Entry: "title", "Entry Date": "date", Theme: "text", Archived: "checkbox", "Created time": "created_time" }, []),
  source("business.goals", business, "standard", "Business Goals", "Business Goals", "2cbf8bf3fd2f4a25b80787a52deb7d02", "5c60027f-d546-454a-955b-4de60329685f", "CRAIG_OS_NOTION_BUSINESS_GOALS_DATA_SOURCE_ID", { Goal: "title", Status: "select", "Target Date": "date", "Measure of Success": "text", Owner: "person", Archived: "checkbox", "Created time": "created_time" }, []),
  source("business.projects", business, "standard", "Business Projects", "Business Projects", "5e43289249cb455a81625b1e4f6a375f", "cbeb016e-a2b8-466b-b347-ce12edca2043", "CRAIG_OS_NOTION_BUSINESS_PROJECTS_DATA_SOURCE_ID", { Project: "title", Status: "select", Goal: "relation", Company: "relation", Owner: "person", "Start Date": "date", "Target Date": "date", "Completed Date": "date", Archived: "checkbox", "Created time": "created_time" }, [{ property: "Goal", targetDataSourceId: "5c60027f-d546-454a-955b-4de60329685f" }, { property: "Company", targetDataSourceId: "f271c688-b136-4be1-9059-2d084a3cdbd9" }]),
  source("business.tasks", business, "standard", "Business Tasks", "Business Tasks", "9362138422cf455f8082821418f93e3a", "45152c50-15cc-469d-94c9-094d93db2273", "CRAIG_OS_NOTION_BUSINESS_TASKS_DATA_SOURCE_ID", { Task: "title", Status: "select", "Due Date": "date", Owner: "person", Priority: "select", Project: "relation", Opportunity: "relation", Issue: "relation", "Completed Date": "date", Archived: "checkbox", "Created time": "created_time" }, [{ property: "Project", targetDataSourceId: "cbeb016e-a2b8-466b-b347-ce12edca2043" }, { property: "Opportunity", targetDataSourceId: "efc699fe-33b8-487d-b261-d8e5999ed7be" }, { property: "Issue", targetDataSourceId: "5d3d344d-de22-4d91-a89e-199805942f86" }]),
  source("business.decisions", business, "standard", "Business Decisions", "Business Decisions", "d00896468c104ae4a01a4251faa594bb", "074bb890-98b7-44a7-906d-9707cd3e832f", "CRAIG_OS_NOTION_BUSINESS_DECISIONS_DATA_SOURCE_ID", { Decision: "title", Status: "select", Outcome: "text", Rationale: "text", "Decision Date": "date", "Decision Maker": "person", Project: "relation", Opportunity: "relation", Source: "url", Archived: "checkbox", "Created time": "created_time" }, [{ property: "Project", targetDataSourceId: "cbeb016e-a2b8-466b-b347-ce12edca2043" }, { property: "Opportunity", targetDataSourceId: "efc699fe-33b8-487d-b261-d8e5999ed7be" }]),
  source("business.knowledge", business, "standard", "Business Knowledge", "Business Knowledge", "42d350be705843b0b8c19e65def27369", "afb86199-09d2-4e55-9dc8-ec9d2c792135", "CRAIG_OS_NOTION_BUSINESS_KNOWLEDGE_DATA_SOURCE_ID", { Title: "title", Type: "select", Summary: "text", Project: "relation", Company: "relation", Source: "url", "Observed Date": "date", Archived: "checkbox", "Created time": "created_time" }, [{ property: "Project", targetDataSourceId: "cbeb016e-a2b8-466b-b347-ce12edca2043" }, { property: "Company", targetDataSourceId: "f271c688-b136-4be1-9059-2d084a3cdbd9" }]),
  source("business.companies", business, "standard", "Companies", "Companies", "51c644a92e094ad18aeb26141bf12ce8", "f271c688-b136-4be1-9059-2d084a3cdbd9", "CRAIG_OS_NOTION_COMPANIES_DATA_SOURCE_ID", { Company: "title", Domain: "url", Relationship: "select", Status: "select", Notes: "text", Archived: "checkbox", "Created time": "created_time" }, []),
  source("business.people", business, "standard", "People", "People", "8c91090411514f6ebafcb10c206a7645", "8d61c25b-8aa9-4b5c-8676-67af5b786914", "CRAIG_OS_NOTION_PEOPLE_DATA_SOURCE_ID", { Person: "title", Email: "email", Role: "text", Company: "relation", Status: "select", "Follow-Up Date": "date", Archived: "checkbox", "Created time": "created_time" }, [{ property: "Company", targetDataSourceId: "f271c688-b136-4be1-9059-2d084a3cdbd9" }]),
  source("business.opportunities", business, "standard", "Opportunities", "Opportunities", "195ce3f2d75843ae9a8e9ad90227bad8", "efc699fe-33b8-487d-b261-d8e5999ed7be", "CRAIG_OS_NOTION_OPPORTUNITIES_DATA_SOURCE_ID", { Opportunity: "title", Stage: "select", Company: "relation", "Primary Contact": "relation", Value: "number", "Next Action": "text", "Follow-Up Date": "date", Owner: "person", Archived: "checkbox", "Created time": "created_time" }, [{ property: "Company", targetDataSourceId: "f271c688-b136-4be1-9059-2d084a3cdbd9" }, { property: "Primary Contact", targetDataSourceId: "8d61c25b-8aa9-4b5c-8676-67af5b786914" }]),
  source("business.issues", business, "standard", "Issues", "Issues", "1ee94c0b54e64716af2e822e9bf71092", "5d3d344d-de22-4d91-a89e-199805942f86", "CRAIG_OS_NOTION_ISSUES_DATA_SOURCE_ID", { Issue: "title", Type: "select", Status: "select", Severity: "select", Owner: "person", Project: "relation", Company: "relation", Resolution: "text", Archived: "checkbox", "Created time": "created_time" }, [{ property: "Project", targetDataSourceId: "cbeb016e-a2b8-466b-b347-ce12edca2043" }, { property: "Company", targetDataSourceId: "f271c688-b136-4be1-9059-2d084a3cdbd9" }]),
];

function source(
  key: string,
  zone: "personal" | "business",
  sensitivity: "standard" | "spiritual",
  logicalName: string,
  liveName: string,
  databaseId: string,
  dataSourceId: string,
  envName: string,
  properties: Record<string, string>,
  relations: { property: string; targetDataSourceId: string }[],
): TemplateSource {
  return {
    key,
    zone,
    sensitivity,
    logicalName,
    liveName,
    databaseId,
    dataSourceId,
    notionUrl: `https://app.notion.com/p/${databaseId}`,
    envName,
    properties,
    relations,
  };
}

const byKey = new Map(TEMPLATE_SOURCES.map((item) => [item.key, item]));
const zoneBySource = new Map(TEMPLATE_SOURCES.map((item) => [item.dataSourceId, item.zone]));

export function templateSource(key: string): TemplateSource | undefined {
  return byKey.get(key);
}

export function resolveDataSourceId(key: string, env: Record<string, string | undefined> = process.env): string | null {
  const item = byKey.get(key);
  if (!item) return null;
  if (Object.prototype.hasOwnProperty.call(env, item.envName) && env[item.envName] === "") return null;
  const override = env[item.envName];
  if (override) return override;
  return item.dataSourceId;
}

export function boundSourceCount(env: Record<string, string | undefined> = process.env): number {
  return TEMPLATE_SOURCES.filter((item) => resolveDataSourceId(item.key, env)).length;
}

export function crossZoneRelationCount(): { personalToBusiness: number; businessToPersonal: number } {
  let personalToBusiness = 0;
  let businessToPersonal = 0;
  for (const item of TEMPLATE_SOURCES) {
    for (const relation of item.relations) {
      const targetZone = zoneBySource.get(relation.targetDataSourceId);
      if (!targetZone || targetZone === item.zone) continue;
      if (item.zone === "personal") personalToBusiness += 1;
      else businessToPersonal += 1;
    }
  }
  return { personalToBusiness, businessToPersonal };
}

export function reconcileSchema(): { database: string; status: SchemaClass; safe: string[] }[] {
  return CANONICAL_DATABASES.map((database) => reconcileOne(database));
}

function reconcileOne(database: CanonicalDatabase): { database: string; status: SchemaClass; safe: string[] } {
  const live = byKey.get(database.key);
  if (!live) return { database: database.name, status: "BLOCKER", safe: ["missing live source"] };
  const safe: string[] = [];
  if (live.liveName !== database.name) safe.push(`live name ${live.liveName}`);
  for (const property of database.properties) {
    const actual = live.properties[property.name];
    if (!actual) return { database: database.name, status: "BLOCKER", safe };
    if (actual !== property.notionType) return { database: database.name, status: "CONTRACT DRIFT", safe: [...safe, property.name] };
  }
  for (const name of Object.keys(live.properties)) {
    if (!database.properties.some((property) => property.name === name)) safe.push(`ignored extra property ${name}`);
  }
  for (const relation of live.relations) {
    if (zoneBySource.get(relation.targetDataSourceId) !== live.zone) {
      return { database: database.name, status: "BLOCKER", safe: [...safe, relation.property] };
    }
  }
  return { database: database.name, status: safe.length ? "SAFE ADAPTER DIFFERENCE" : "MATCH", safe };
}

export function schemaScore(rows = reconcileSchema()) {
  return {
    pass: rows.filter((row) => row.status === "MATCH").length,
    safe: rows.filter((row) => row.status === "SAFE ADAPTER DIFFERENCE").length,
    drift: rows.filter((row) => row.status === "CONTRACT DRIFT").length,
    blocker: rows.filter((row) => row.status === "BLOCKER").length,
  };
}
