export type WidgetTheme = "personal" | "business" | "spiritual-minimal" | "compact";

export type WidgetState =
  | "success"
  | "loading"
  | "empty"
  | "error"
  | "unauthorized"
  | "not-configured";

export type OperationalState = "default" | "loading" | "empty" | "error" | "disabled";
