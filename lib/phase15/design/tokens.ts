export const DESIGN_KERNEL_VERSION = "15.3.0-foundation" as const;

export const CERTIFIED_WIDTHS = [390, 430, 768, 1024, 1440] as const;

export type ColorMode = "light" | "dark";
export type SurfaceContext = "personal" | "business" | "spiritual";

export type ContextPalette = {
  paper: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  attention: string;
};

export const PALETTES: Record<SurfaceContext, Record<ColorMode, ContextPalette>> = {
  personal: {
    light: { paper: "#f6f1ea", ink: "#1c1917", muted: "#6b625b", line: "#e4d9cc", accent: "#8c4a32", attention: "#8a5a12" },
    dark: { paper: "#141210", ink: "#f3ece4", muted: "#b5a89c", line: "#2c2622", accent: "#e0b089", attention: "#e2c27a" },
  },
  business: {
    light: { paper: "#f3f6f8", ink: "#101820", muted: "#52606d", line: "#d5dee6", accent: "#1d4e73", attention: "#8a3d12" },
    dark: { paper: "#0c1218", ink: "#e7eef3", muted: "#9aafbf", line: "#1d2a35", accent: "#8eb7d6", attention: "#e0b089" },
  },
  spiritual: {
    light: { paper: "#f7f5f2", ink: "#1c1917", muted: "#6f675f", line: "#e6e0d8", accent: "#5c534c", attention: "#6f675f" },
    dark: { paper: "#121110", ink: "#f4efe8", muted: "#b7aea4", line: "#2a2623", accent: "#d9c7b0", attention: "#b7aea4" },
  },
};

export const TYPE = {
  personal: '"Iowan Old Style", Palatino, "Palatino Linotype", Georgia, serif',
  business: '"Avenir Next", "Segoe UI", sans-serif',
  ui: 'ui-sans-serif, system-ui, sans-serif',
} as const;

export const SPACE = {
  page: "clamp(1.25rem, 2vw, 2.5rem)",
  section: "1.75rem",
  card: "1.25rem",
  tight: "0.5rem",
} as const;

export const DENSITY = {
  homePrimaryModules: 1,
  supportingRecords: 3,
  maxAccentTints: 2,
} as const;

export type EmptyStateCopy = {
  title: string;
  body: string;
  action: string;
};

export function emptyStateCopy(input: { belongs: string; whyEmpty: string; nextAction: string }): EmptyStateCopy {
  return {
    title: input.belongs,
    body: input.whyEmpty,
    action: input.nextAction,
  };
}

export const FORBIDDEN_VISUAL_PATTERNS = [
  "purple-gradient-hero",
  "equal-card-grid",
  "fake-metric",
  "database-name-in-navigation",
  "emoji-as-only-affordance",
] as const;
