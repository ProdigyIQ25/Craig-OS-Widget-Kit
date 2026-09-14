import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-shell">
      <p className="eyebrow">CRAIG OS · PLATFORM FOUNDATION</p>
      <h1>Widget Kit</h1>
      <p className="lede">Twenty focused, embed-safe operating surfaces for Craig OS.</p>
      <div className="landing-actions">
        <Link className="primary-link" href="/widgets/clock">Open Live Clock</Link>
        <Link className="secondary-link" href="/api/health">View health response</Link>
      </div>
      <dl className="platform-facts">
        <div><dt>Version</dt><dd>0.3.0</dd></div>
        <div><dt>Data</dt><dd>Scoped Business reads only</dd></div>
        <div><dt>Writes</dt><dd>Disabled by design</dd></div>
      </dl>
    </main>
  );
}
