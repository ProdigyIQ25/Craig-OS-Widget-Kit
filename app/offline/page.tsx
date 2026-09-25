import Link from "next/link";
import { COMMAND_SURFACE_ROUTES } from "@/lib/phase15/routes";

export const metadata = {
  title: "Offline · Craig OS",
  robots: { index: false, follow: false },
};

/**
 * Intentional degraded offline surface — not a cached operating state.
 */
export default function OfflinePage() {
  return (
    <main className="p15-shell p15-offline" data-context="home" data-offline="true">
      <header className="p15-header">
        <div>
          <p className="p15-brand">Craig OS</p>
          <h1>You are offline</h1>
          <p className="p15-lede">
            The command surface shell is available, but live Craig OS state cannot be verified. Nothing will be written while
            disconnected.
          </p>
        </div>
      </header>
      <section className="p15-primary">
        <p className="p15-eyebrow">Degraded</p>
        <h2>Reconnect to resume governed operation.</h2>
        <p className="p15-lead">
          Capture, Ask mutations, and record edits stay blocked offline. Notion deep edit remains available only when the
          network returns.
        </p>
        <div className="p15-actions" style={{ marginTop: "1.25rem" }}>
          <Link href={COMMAND_SURFACE_ROUTES.home}>Return to Home</Link>
        </div>
      </section>
    </main>
  );
}
