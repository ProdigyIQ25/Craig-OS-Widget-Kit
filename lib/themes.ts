import type { WidgetTheme } from "@/types/widget";

export const themes: ReadonlyArray<{ id: WidgetTheme; label: string; description: string }> = [
  { id: "business", label: "Business", description: "Executive charcoal with restrained blue signal." },
  { id: "personal", label: "Personal", description: "Warm neutral surface with quiet bronze accent." },
  { id: "compact", label: "Compact", description: "Dense embed treatment for narrow Notion columns." }
];
