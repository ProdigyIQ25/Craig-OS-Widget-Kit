import type { WidgetTheme } from "@/types/widget";

export type WidgetConfig = {
  theme: WidgetTheme;
  compact: boolean;
  mode?: string;
  context?: string;
  label?: string;
  target?: string;
  value?: number;
  targetTotal?: number;
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
    label: clean(searchParams.get("label")),
    target: cleanDate(searchParams.get("target")),
    value: cleanNumber(searchParams.get("value")),
    targetTotal: cleanNumber(searchParams.get("targetTotal")),
  };
}

function cleanDate(value:string|null):string|undefined { if(!value)return undefined; return value.replace(/[^0-9TZ:+.\-]/g,"").slice(0,40)||undefined; }
function cleanNumber(value:string|null):number|undefined { if(value===null||value.trim()==="")return undefined;const found=Number(value);return Number.isFinite(found)?found:undefined; }

function clean(value: string | null): string | undefined {
  if (!value) return undefined;
  return value.replace(/[^a-zA-Z0-9 _/-]/g, "").slice(0, 80) || undefined;
}
