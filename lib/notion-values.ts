export type Property = Record<string, unknown> & { type?: string };
export type NotionRow = { id: string; last_edited_time?: string; properties: Record<string, Property> };

export function value(row: NotionRow, name: string): string | number | boolean | null {
  const property = row.properties[name] as Record<string, unknown> | undefined;
  if (!property) return null;
  const type = property.type as string;
  if (type === "title" || type === "rich_text") {
    const parts = property[type] as Array<{ plain_text?: string }> | undefined;
    return parts?.map(part => part.plain_text ?? "").join("") || null;
  }
  if (type === "select" || type === "status") return (property[type] as { name?: string } | null)?.name ?? null;
  if (type === "number" || type === "checkbox") return property[type] as number | boolean | null;
  if (type === "date") return (property.date as { start?: string } | null)?.start ?? null;
  if (type === "people") return ((property.people as Array<{ name?: string }> | undefined) ?? []).map(person => person.name).filter(Boolean).join(", ") || null;
  if (type === "formula") {
    const formula = property.formula as Record<string, unknown> | undefined;
    return formula ? (formula[formula.type as string] as string | number | boolean | null) : null;
  }
  return null;
}

export function textValue(row: NotionRow, name: string, fallback = "NOT YET POPULATED"): string {
  const found = value(row, name); return found === null || found === "" ? fallback : String(found);
}
