import "server-only";
import type { NotionRow } from "@/lib/notion-values";
export type { NotionRow } from "@/lib/notion-values";

export const SOURCES = {
  B03: "04d61791-c4f1-4306-a781-c1ce86f88009",
  B05: "d6a48c06-9b0c-4a5d-a929-d055f9d281a0",
  B07: "f109259e-dbc5-49d3-89d2-50a2ecf54d3b",
  B08: "60e4d094-16a2-4912-ab62-308d2f5da5c7",
  B09: "521e6076-5d6c-4f50-8b69-92908f37782b",
  B10: "c1e6281e-dc06-4ddf-b2d9-00402126975b",
  B11: "6114a1d8-4a6d-48d2-9cf0-4389fadef721",
} as const;

export class NotionConfigurationError extends Error {}

export async function queryActive(source: keyof typeof SOURCES, pageSize = 50): Promise<NotionRow[]> {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new NotionConfigurationError("Read-only Notion access is not configured.");
  const rows: NotionRow[]=[]; let cursor: string | undefined;
  do {
    const response = await fetch(`https://api.notion.com/v1/data_sources/${SOURCES[source]}/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2025-09-03", "Content-Type": "application/json" },
      body: JSON.stringify({ filter: { property: "Archive", checkbox: { equals: false } }, page_size: Math.min(pageSize, 100), ...(cursor ? { start_cursor: cursor } : {}) }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Canonical source ${source} returned ${response.status}.`);
    const payload = await response.json() as { results?: NotionRow[]; has_more?: boolean; next_cursor?: string | null };
    rows.push(...(payload.results ?? [])); cursor = payload.has_more && payload.next_cursor ? payload.next_cursor : undefined;
  } while(cursor);
  return rows;
}
