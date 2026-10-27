'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <nav className="navbar" style={{ background: scrolled ? 'rgba(10,14,26,0.95)' : 'rgba(10,14,26,0.6)' }}>
      <div className="container">
        <div className="navbar-inner">
          <Link href="/" className="logo">
            <span className="logo-icon">🦅</span>
            <span className="logo-text">Kestrel</span>
          </Link>
          <div className="nav-links">
            <Link href="#features" className="nav-link">Features</Link>
            <Link href="#how-it-works" className="nav-link">How it works</Link>
            <Link href="#skills" className="nav-link">Skills</Link>
            <Link href="#security" className="nav-link">Security</Link>
            <Link href="/docs" className="nav-link">Docs</Link>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/setup" className="btn btn-secondary btn-sm">Get Started</Link>
            <Link href="/download" className="btn btn-primary btn-sm">Download</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="container">
        <div className="hero-content">
          <div className="hero-eyebrow animate-fade-up">
            <span>🔒</span> Everything runs on your laptop — nothing leaves
          </div>
          <h1 className="hero-title animate-fade-up delay-100">
            Your personal AI that<br />
            <span className="gradient-text">stays on your device</span>
          </h1>
          <p className="hero-sub animate-fade-up delay-200">
            Voice or text, local language models, private memory, and a tamper-evident audit log
            of every action. Kestrel asks before it acts — and can prove what it did.
          </p>
          <div className="hero-actions animate-fade-up delay-300">
            <Link href="/setup" className="btn btn-primary" id="cta-get-started">
              ✨ Set up my assistant
            </Link>
            <Link href="/download" className="btn btn-secondary" id="cta-download">
              ⬇️ Download for Windows
            </Link>
          </div>
          <div style={{ marginTop: '3rem' }} className="animate-fade-up delay-400">
            <TerminalDemo />
          </div>
        </div>
      </div>
    </section>
  );
}

const DEMO_LINES = [
  { type: 'prompt', text: '> kestrel run files.search \'{"query":"DBMS notes"}\'', delay: 200 },
  { type: 'out', text: '✔ files.search  tier=safe  decision=allow (no approval needed)', delay: 600 },
  { type: 'out', text: '  matches: DBMS_unit1.pdf  DBMS_unit2.pdf  dbms-lab-record.docx', delay: 900 },
  { type: 'out', text: '  evidence: [file:C:\\Users\\...\\sem5\\dbms\\DBMS_unit1.pdf]', delay: 1200 },
  { type: 'sep', text: '', delay: 1500 },
  { type: 'prompt', text: '> kestrel run memory.remember \'{"text":"DBMS exam is Dec 15"}\'', delay: 1700 },
  { type: 'out', text: '✔ memory.remember  sideEffects=memory  saved id=42', delay: 2100 },
  { type: 'sep', text: '', delay: 2400 },
  { type: 'prompt', text: '> kestrel audit verify', delay: 2600 },
  { type: 'ok', text: 'OK: 2 entries, chain intact (SHA-256)', delay: 3000 },
];

function TerminalDemo() {
  const [visible, setVisible] = useState([]);
  useEffect(() => {
    const timers = DEMO_LINES.map((l, i) =>
      setTimeout(() => setVisible((v) => [...v, i]), l.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <div className="terminal animate-float" style={{ maxWidth: '620px', margin: '0 auto', textAlign: 'left' }}>
      <div className="terminal-header">
        <span className="t-dot t-red" /><span className="t-dot t-yellow" /><span className="t-dot t-green" />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>kestrel — Windows PowerShell</span>
      </div>
      <div className="terminal-body">
        {DEMO_LINES.map((l, i) => (
          <div key={i} style={{ opacity: visible.includes(i) ? 1 : 0, transition: 'opacity 0.3s', minHeight: l.type === 'sep' ? '0.5rem' : undefined }}>
            {l.type === 'prompt' && <div><span className="t-prompt">PS&gt; </span><span className="t-cmd">{l.text.slice(4)}</span></div>}
            {l.type === 'out' && <div className="t-out">{l.text}</div>}
            {l.type === 'ok' && <div className="t-ok">{l.text}</div>}
          </div>
        ))}
        <span className="t-prompt">PS&gt; </span><span className="cursor-blink">▌</span>
      </div>
    </div>
  );
}

function StatsRow() {
  const stats = [
    { value: '0 bytes', label: 'sent to cloud by default' },
    { value: '<3s', label: 'voice wake to answer' },
    { value: '20+', label: 'built-in skills' },
    { value: '100%', label: 'audit-traceable' },
  ];
  return (
    <div className="container">
      <div className="stats-row">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-value gradient-text">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Features() {
  const features = [
    { icon: '🔒', title: 'Truly local by default', desc: 'All processing happens on your device. No API keys required. No data leaves your laptop unless you explicitly enable a cloud model.' },
    { icon: '🛡️', title: 'Ask before acting', desc: 'Every action that changes files, launches apps, or touches your system asks for your approval first. Fail-closed: no approver = no action.' },
    { icon: '📋', title: 'Tamper-evident audit log', desc: 'Every skill invocation is recorded in a hash-chained JSONL log. The chain breaks if anyone edits history, so you can always verify what happened.' },
    { icon: '🎯', title: 'Prompt injection defence', desc: 'Files, web pages and commit messages are treated as untrusted data. Injection attempts are detected, flagged, and can never silently trigger risky actions.' },
    { icon: '🧠', title: 'Private local memory', desc: 'Facts and notes are stored in an encrypted SQLite database. FTS5 full-text search with BM25 ranking. Forget any fact with a single command.' },
    { icon: '⚡', title: 'Hardware-aware model selection', desc: 'Kestrel profiles your RAM and GPU to auto-select the right model tier. Works on 8 GB laptops; uses larger models on 16+ GB machines.' },
    { icon: '🎙️', title: 'Local voice (STT + TTS)', desc: 'Whisper.cpp for speech-to-text and Piper for text-to-speech. Raw audio never leaves your device. Push-to-talk or wake-word activation.' },
    { icon: '🔧', title: 'Developer skills', desc: 'Port lookup, git summaries with injection-safe config, error explanation, environment checks — all running locally with full audit trails.' },
    { icon: '📚', title: 'Student skills', desc: 'Study notes, deadline tracking, file search, and reminders — all private and searchable with BM25 full-text ranking.' },
  ];
  return (
    <section className="section" id="features">
      <div className="container">
        <span className="section-label">Why Kestrel</span>
        <h2 className="section-title">Built for privacy, designed for trust</h2>
        <p className="section-sub">Every design decision starts with: what can go wrong, and how does the user stay in control?</p>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: '01', title: 'Answer the questionnaire', desc: 'Tell Kestrel your role (student/developer), tone preference, and privacy mode. This generates a personalized config.json — not a custom build, just data.' },
    { num: '02', title: 'Download the installer', desc: 'One signed Windows installer, no admin rights needed. The SHA-256 checksum is shown on the page. SmartScreen-safe after code signing.' },
    { num: '03', title: 'Kestrel profiles your hardware', desc: 'On first run, it measures your RAM, CPU cores, and GPU VRAM, then downloads the right model size with resume support. Works offline after that.' },
    { num: '04', title: 'Ask, approve, verify', desc: 'Voice or text. Safe-tier skills run instantly. Risky skills show a dialog with exact arguments and reason. Every action writes to the audit log.' },
  ];
  return (
    <section className="section" id="how-it-works" style={{ background: 'var(--surface-1)' }}>
      <div className="container">
        <span className="section-label">How it works</span>
        <h2 className="section-title">Install in 10 minutes, trust it forever</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1.5rem', marginTop: '3rem' }}>
          {steps.map((s) => (
            <div key={s.num} className="card" style={{ borderTop: '2px solid var(--accent-primary)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-primary)', marginBottom: '0.75rem' }}>{s.num}</div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.875rem' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SkillsSection() {
  const skills = [
    { name: 'system.info', tier: 'safe', pack: 'core', desc: 'OS, CPU, RAM, uptime' },
    { name: 'files.search', tier: 'safe', pack: 'core', desc: 'Find files by name in allowed folders' },
    { name: 'files.read_text', tier: 'safe', pack: 'core', desc: 'Read a text file (content treated as untrusted)' },
    { name: 'memory.remember', tier: 'safe', pack: 'core', desc: 'Save a fact to local memory' },
    { name: 'memory.recall', tier: 'safe', pack: 'core', desc: 'Search local memory with BM25 ranking' },
    { name: 'reminders.add', tier: 'safe', pack: 'core', desc: 'Create a timed reminder' },
    { name: 'reminders.due', tier: 'safe', pack: 'core', desc: 'List due reminders' },
    { name: 'apps.launch', tier: 'ask', pack: 'core', desc: 'Launch an application (always asks)' },
    { name: 'files.open_move', tier: 'ask', pack: 'core', desc: 'Move or copy files (asks with exact paths)' },
    { name: 'web.search', tier: 'safe', pack: 'core', desc: 'DuckDuckGo search (network, untrusted results)' },
    { name: 'dev.port_lookup', tier: 'safe', pack: 'dev', desc: 'Find what process uses a TCP port' },
    { name: 'dev.git_summary', tier: 'safe', pack: 'dev', desc: 'Branch, changes, recent commits (injection-safe)' },
    { name: 'dev.explain_error', tier: 'safe', pack: 'dev', desc: 'Parse error/stack trace for model reasoning' },
    { name: 'study.notes_add', tier: 'safe', pack: 'student', desc: 'Save a tagged study note' },
    { name: 'study.notes_search', tier: 'safe', pack: 'student', desc: 'Keyword search over notes' },
    { name: 'study.deadlines', tier: 'safe', pack: 'student', desc: 'Track and list exam/assignment deadlines' },
    { name: 'shell.run', tier: 'blocked', pack: 'core', desc: 'Run executable (off by default; asks every time)' },
  ];
  const tierColor = { safe: 'tag-safe', ask: 'tag-ask', blocked: 'tag-blocked' };
  return (
    <section className="section" id="skills">
      <div className="container">
        <span className="section-label">Skills catalog</span>
        <h2 className="section-title">What Kestrel can do</h2>
        <p className="section-sub">Every skill declares its tier, side effects, and network usage. Safe = runs without asking. Ask = approval dialog. Blocked = disabled until you unlock it.</p>
        <div style={{ overflowX: 'auto', marginTop: '2rem' }}>
          <table className="skills-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Tier</th>
                <th>Pack</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((s) => (
                <tr key={s.name}>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>{s.name}</code></td>
                  <td><span className={`tag ${tierColor[s.tier]}`}>{s.tier}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{s.pack}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{s.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  const threats = [
    { threat: 'Prompt injection', mitigation: 'Taint tracking, fencing, injection scan', status: '✅ Built' },
    { threat: 'Memory poisoning', mitigation: 'Provenance on every memory; untrusted recall re-taints session', status: '✅ Built' },
    { threat: 'Path escape', mitigation: 'realpath containment, symlinks not followed in search', status: '✅ Built' },
    { threat: 'Arbitrary command execution', mitigation: 'No shell, blocked tier, per-call approval, 15s timeout', status: '✅ Built' },
    { threat: 'Audit tampering', mitigation: 'SHA-256 hash chain; edit breaks verification', status: '✅ Built' },
    { threat: 'Malicious git repository', mitigation: 'fsmonitor, hooks and other exec-on-read configs disabled', status: '✅ Built' },
  ];
  return (
    <section className="section" id="security" style={{ background: 'var(--surface-1)' }}>
      <div className="container">
        <span className="section-label">Security model</span>
        <h2 className="section-title">Designed against the threats that matter</h2>
        <p className="section-sub">The permission policy is the security boundary — heuristics are defence-in-depth, not the primary control.</p>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '2.5rem' }}>
          {threats.map((t) => (
            <div key={t.threat} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '1rem', alignItems: 'center', padding: '1rem 1.5rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.threat}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t.mitigation}</div>
              <div className="badge badge-safe" style={{ whiteSpace: 'nowrap' }}>{t.status}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="section" style={{ textAlign: 'center', padding: '8rem 0' }}>
      <div className="container">
        <div className="hero-eyebrow" style={{ justifyContent: 'center' }}>🚀 Private beta — 30 seats</div>
        <h2 style={{ marginBottom: '1rem' }}>Ready to own your AI?</h2>
        <p style={{ maxWidth: '500px', margin: '0 auto 2.5rem' }}>
          Answer the questionnaire, download the installer, and have your private assistant running in under 10 minutes.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/setup" className="btn btn-primary" id="cta-bottom-setup">Set up my assistant →</Link>
          <Link href="/download" className="btn btn-secondary" id="cta-bottom-download">Download</Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="logo" style={{ marginBottom: '1rem' }}>
              <span className="logo-icon">🦅</span>
              <span className="logo-text">Kestrel</span>
            </div>
            <p style={{ fontSize: '0.875rem' }}>A local-first AI assistant for Windows. Private by design.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <Link href="/setup" className="footer-link">Get started</Link>
            <Link href="/download" className="footer-link">Download</Link>
            <Link href="#skills" className="footer-link">Skills</Link>
            <Link href="/docs" className="footer-link">Documentation</Link>
          </div>
          <div className="footer-col">
            <h4>Security</h4>
            <Link href="/docs/privacy" className="footer-link">Privacy policy</Link>
            <Link href="/docs/security" className="footer-link">Security model</Link>
            <Link href="https://github.com" className="footer-link">SECURITY.md</Link>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <Link href="/docs/terms" className="footer-link">Terms of use</Link>
            <Link href="/docs/licenses" className="footer-link">Licenses</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2026 Kestrel. MIT License for the core engine.</div>
          <div className="footer-copy">Built with care for privacy.</div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsRow />
        <Features />
        <HowItWorks />
        <SkillsSection />
        <SecuritySection />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
