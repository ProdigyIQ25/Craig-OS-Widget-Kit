export type AccentTheme = "personal-warm" | "business-precise";

export type EnabledModules = {
  spiritual: boolean;
  growth: boolean;
  brand: boolean;
  workforce: boolean;
  media: boolean;
  metrics: boolean;
  digitalWorkers: boolean;
};

export type CommercialConfig = {
  ownerName: string;
  companyName: string;
  productName: string;
  accentTheme: AccentTheme;
  logo: string | null;
  currency: string;
  reviewDay: "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  dateFormat: string;
  timeFormat: "12h" | "24h";
  enabledModules: EnabledModules;
  productOperationsLabel: string;
};

/** Instance values. Architecture must read this object, not embed these strings in types or routes. */
export const davidCraigInstance: CommercialConfig = {
  ownerName: "David Craig",
  companyName: "ProdigyIQ Technologies",
  productName: "Craig OS",
  accentTheme: "business-precise",
  logo: null,
  currency: "USD",
  reviewDay: "Sunday",
  dateFormat: "MMM d, yyyy",
  timeFormat: "12h",
  enabledModules: {
    spiritual: false,
    growth: true,
    brand: true,
    workforce: false,
    media: false,
    metrics: false,
    digitalWorkers: false,
  },
  productOperationsLabel: "Product Operations",
};
