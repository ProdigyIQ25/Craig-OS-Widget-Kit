import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-shell craig-os-entry">
      <p className="eyebrow">CRAIG OS · DIRECT APP</p>
      <h1>Your operating system, without the container.</h1>
      <p className="lede">Choose the context you need. Notion remains the canonical source for deep editing and administration.</p>
      <div className="landing-actions">
        <Link className="primary-link" href="/os/personal?mode=command">Open Personal OS</Link>
        <Link className="secondary-link" href="/os/business?mode=executive">Open ProdigyIQ OS</Link>
      </div>
      <dl className="platform-facts">
        <div><dt>Modes</dt><dd>12 direct operating modes</dd></div>
        <div><dt>Media</dt><dd>Live P11 playback</dd></div>
        <div><dt>Deep editing</dt><dd>Intentional Notion exit</dd></div>
      </dl>
    </main>
  );
}
