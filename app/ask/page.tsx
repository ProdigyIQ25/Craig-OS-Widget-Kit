import { AskCommand } from "@/components/phase15/ask-command";
import { CaptureCommand } from "@/components/phase15/capture-command";
import { AppShell, CommandHeader, ContextSwitcher } from "@/components/phase15/shell";

export default function AskPage() {
  return (
    <AppShell context="home">
      <CommandHeader
        eyebrow="Craig OS"
        title="Ask Craig OS"
        subtitle="Grounded answers from your operating system. Mutations only through Capture authorization."
        actions={
          <div className="p15-header-actions">
            <AskCommand surface="home" />
            <CaptureCommand surface="home" />
          </div>
        }
      />
      <ContextSwitcher current="home" />
      <section className="p15-ask-page-copy p15-enter">
        <p className="p15-eyebrow">Operating principle</p>
        <h2>Ask → retrieve → reason → propose → authorize</h2>
        <p>
          Ask Craig OS defaults to read-only retrieval across canonical Personal and Business sources. Spiritual stores
          stay excluded unless you ask explicitly. Any create request becomes a BU-15.7 Capture proposal — never a silent write.
        </p>
      </section>
    </AppShell>
  );
}
