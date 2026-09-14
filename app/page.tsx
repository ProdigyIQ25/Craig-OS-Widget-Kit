import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-shell">
      <p className="eyebrow">CRAIG OS · PLATFORM FOUNDATION</p>
      <h1>Widget Kit</h1>
      <p className="lede">Independent, server-bound infrastructure for future Notion-embedded widgets.</p>
      <div className="landing-actions">
        <Link className="primary-link" href="/widgets/demo">Open foundation demo</Link>
        <Link className="secondary-link" href="/api/health">View health response</Link>
      </div>
      <dl className="platform-facts">
        <div><dt>Version</dt><dd>0.1.0</dd></div>
        <div><dt>Data</dt><dd>No production access</dd></div>
        <div><dt>Writes</dt><dd>Disabled by design</dd></div>
      </dl>
    </main>
  );
}
