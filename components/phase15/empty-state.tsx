import { emptyStateCopy, PALETTES, TYPE } from "@/lib/phase15/design/tokens";

type EmptyStateProps = {
  context: "personal" | "business" | "spiritual";
  mode?: "light" | "dark";
  belongs: string;
  whyEmpty: string;
  nextAction: string;
};

export function EmptyState({ context, mode = "light", belongs, whyEmpty, nextAction }: EmptyStateProps) {
  const palette = PALETTES[context][mode];
  const copy = emptyStateCopy({ belongs, whyEmpty, nextAction });
  return (
    <section
      aria-label={copy.title}
      style={{
        background: palette.paper,
        color: palette.ink,
        border: `1px solid ${palette.line}`,
        borderRadius: 18,
        padding: "1.25rem 1.35rem",
        fontFamily: context === "business" ? TYPE.business : TYPE.personal,
        maxWidth: 720,
      }}
    >
      <p style={{ margin: 0, fontSize: "1.15rem", lineHeight: 1.35 }}>{copy.title}</p>
      <p style={{ margin: "0.55rem 0 0", color: palette.muted, lineHeight: 1.5 }}>{copy.body}</p>
      <p style={{ margin: "0.9rem 0 0", fontFamily: TYPE.ui, fontSize: "0.92rem" }}>{copy.action}</p>
    </section>
  );
}
