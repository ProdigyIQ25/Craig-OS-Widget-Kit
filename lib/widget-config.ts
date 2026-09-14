import type { WidgetTheme } from "@/types/widget";

export type WidgetConfig = {
  theme: WidgetTheme;
  compact: boolean;
  mode?: string;
  context?: string;
};

const themes = new Set<WidgetTheme>(["personal", "business", "spiritual-minimal", "compact"]);

export function parseWidgetConfig(searchParams: URLSearchParams): WidgetConfig {
  const requestedTheme = searchParams.get("theme") as WidgetTheme | null;
  const compact = searchParams.get("compact") === "true";
  return {
    theme: compact ? "compact" : requestedTheme && themes.has(requestedTheme) ? requestedTheme : "business",
    compact,
    mode: clean(searchParams.get("mode")),
    context: clean(searchParams.get("context")),
  };
}

function clean(value: string | null): string | undefined {
  if (!value) return undefined;
  return value.replace(/[^a-zA-Z0-9 _/-]/g, "").slice(0, 80) || undefined;
}
