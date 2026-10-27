import Link from 'next/link';

export const metadata = {
  title: 'Download Kestrel — Windows 64-bit',
  description: 'Download the Kestrel installer for Windows 10/11 64-bit. SHA-256 checksum shown.',
};

// In production this would come from a real release endpoint.
const RELEASE = {
  version: '0.5.0-beta',
  channel: 'Private Beta',
  date: '2026-10-27',
  checksum: 'sha256:4b3e1d2c9f0a8b7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e',
  size: '48 MB (installer, models downloaded separately)',
  notes: [
    '20+ built-in skills with permission tiers',
    'Hash-chained audit log with verify command',
    'Prompt injection containment and taint tracking',
    'Local SQLite memory with FTS5 full-text search',
    'Hardware tier auto-detection',
  ],
  requirements: 'Windows 10 22H2+ or Windows 11, x64',
};

export default function DownloadPage() {
  return (
    <div style={{ minHeight: '100vh', paddingTop: '6rem', paddingBottom: '4rem' }}>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-inner">
            <Link href="/" className="logo">
              <span className="logo-icon">🦅</span>
              <span className="logo-text">Kestrel</span>
            </Link>
            <div className="nav-links">
              <Link href="/setup" className="nav-link">Set up assistant</Link>
              <Link href="/docs" className="nav-link">Docs</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ paddingTop: '2rem' }}>
          <div className="hero-eyebrow" style={{ marginBottom: '1.5rem' }}>
            <span>🪟</span> Windows 10/11 x64 only
          </div>
          <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', marginBottom: '1rem' }}>Download Kestrel</h1>
          <p>No admin rights needed. Per-user installation. First run downloads models with resume support.</p>

          {/* OS check banner */}
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '0.75rem', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
            <div>
              <strong style={{ fontSize: '0.9rem' }}>Windows 10 22H2+ or Windows 11 required.</strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginLeft: '0.5rem' }}>macOS and Linux support is planned but not available yet.</span>
            </div>
          </div>

          {/* Release card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Kestrel {RELEASE.version}</h2>
                  <span className="badge badge-warn">{RELEASE.channel}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Released {RELEASE.date} · {RELEASE.size}</div>
              </div>
              <a href="#" className="btn btn-primary" id="btn-download-installer" aria-label="Download Kestrel installer">
                ⬇️ Download .exe
              </a>
            </div>

            {/* What's in this release */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Included in this release</div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {RELEASE.notes.map((n) => (
                  <li key={n} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{n}</li>
                ))}
              </ul>
            </div>

            {/* Checksum */}
            <div style={{ background: 'var(--surface-3)', borderRadius: '0.5rem', padding: '0.75rem 1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>SHA-256 CHECKSUM — verify before installing</div>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-secondary)', wordBreak: 'break-all' }}>{RELEASE.checksum}</code>
            </div>
          </div>

          {/* Verify instructions */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Verify the installer (recommended)</h3>
            <div className="terminal">
              <div className="terminal-header">
                <span className="t-dot t-red" /><span className="t-dot t-yellow" /><span className="t-dot t-green" />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>PowerShell</span>
              </div>
              <div className="terminal-body">
                <div><span className="t-prompt">PS&gt; </span><span className="t-cmd">{`Get-FileHash .\\kestrel-setup.exe -Algorithm SHA256`}</span></div>
                <div className="t-out">{`# Compare the output Hash with the checksum above`}</div>
                <div className="t-out">{`# They must match exactly — if not, do not install`}</div>
              </div>
            </div>
          </div>

          {/* System requirements */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>System requirements</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['OS', RELEASE.requirements],
                  ['RAM', '8 GB minimum (16 GB recommended for the standard model tier)'],
                  ['Storage', '4 GB for the installer + 2–8 GB per model (downloaded at first run)'],
                  ['GPU', 'Optional — NVIDIA/AMD GPU with 8+ GB VRAM enables the pro tier'],
                  ['Internet', 'Required only for the initial model download; offline after that'],
                  ['Permissions', 'No administrator rights needed. Per-user installation under AppData.'],
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.6rem 0', fontWeight: 600, fontSize: '0.875rem', width: '120px', color: 'var(--text-primary)', verticalAlign: 'top' }}>{k}</td>
                    <td style={{ padding: '0.6rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem' }}>Don&apos;t have a config yet? <Link href="/setup" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Set up your assistant →</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
