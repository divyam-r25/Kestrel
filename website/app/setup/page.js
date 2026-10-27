'use client';
import { useState } from 'react';
import Link from 'next/link';

const STEPS = [
  { id: 'name', label: 'Name your assistant' },
  { id: 'role', label: 'Your role' },
  { id: 'tone', label: 'Tone & style' },
  { id: 'privacy', label: 'Privacy mode' },
  { id: 'strictness', label: 'Approval level' },
  { id: 'done', label: 'Your config' },
];

const ROLES = [
  { value: 'student', label: 'Student', icon: '🎓', desc: 'Notes, deadlines, file search, study help' },
  { value: 'developer', label: 'Developer', icon: '💻', desc: 'Git summaries, port checks, error explanation' },
  { value: 'general', label: 'General', icon: '🏠', desc: 'Everyday tasks, reminders, file management' },
  { value: 'tutor', label: 'Tutor', icon: '📖', desc: 'Student management, schedules, materials' },
];

const TONES = [
  { value: 'concise', label: 'Concise', icon: '⚡', desc: 'Short and direct answers' },
  { value: 'friendly', label: 'Friendly', icon: '😊', desc: 'Warm and conversational' },
  { value: 'formal', label: 'Formal', icon: '🎩', desc: 'Precise and professional' },
];

const PRIVACY = [
  { value: 'offline', label: 'Fully offline', icon: '🔒', desc: 'Nothing ever leaves your device. Local models only.' },
  { value: 'hybrid', label: 'Hybrid', icon: '🌐', desc: 'Local by default; you can optionally add your own cloud API key for harder tasks.' },
];

const STRICTNESS = [
  { value: 'cautious', label: 'Cautious', icon: '🛡️', desc: 'Ask for approval on almost everything. Maximum safety.' },
  { value: 'balanced', label: 'Balanced', icon: '⚖️', desc: 'Ask for risky actions; allow safe read-only skills without prompting.' },
  { value: 'relaxed', label: 'Relaxed', icon: '🌊', desc: 'Pre-approve low-risk memory operations. Fewer interruptions.' },
];

function validateAnswers(a) {
  const errors = {};
  const name = String(a?.assistantName ?? '').trim();
  if (!/^[\p{L}\p{N} _-]{2,24}$/u.test(name)) errors.assistantName = 'Name must be 2-24 letters, numbers, spaces, _ or -';
  if (!['student', 'developer', 'general', 'tutor'].includes(a?.role)) errors.role = 'Please select a role';
  if (!['concise', 'friendly', 'formal'].includes(a?.tone)) errors.tone = 'Please select a tone';
  if (!['offline', 'hybrid'].includes(a?.privacy)) errors.privacy = 'Please select a privacy mode';
  if (!['cautious', 'balanced', 'relaxed'].includes(a?.strictness)) errors.strictness = 'Please select an approval level';
  return errors;
}

function generateConfig(answers) {
  const ROLE_PACKS = { student: ['core', 'student'], developer: ['core', 'dev'], general: ['core'], tutor: ['core', 'student'] };
  const packs = ROLE_PACKS[answers.role];
  const warnings = [];
  if (/jarvis|friday|ultron/i.test(answers.assistantName)) warnings.push('That name is a Marvel trademark; fine privately, but pick an original name before publishing.');
  return {
    version: 1,
    assistant: {
      name: answers.assistantName.trim(),
      tone: answers.tone,
      persona: `You are ${answers.assistantName.trim()}. ${answers.role === 'student' ? 'You help a college student study, plan, and stay organised.' : answers.role === 'developer' ? 'You help a software engineer with their local dev environment.' : 'You help with everyday computer tasks.'} ${answers.tone === 'concise' ? 'Answer briefly and directly.' : answers.tone === 'friendly' ? 'Be warm and conversational.' : 'Use a formal, precise register.'}`,
    },
    packs,
    skills: {
      enabled: packs.includes('dev') ? ['system.info','files.search','files.read_text','memory.remember','memory.recall','reminders.add','reminders.due','apps.launch','web.search','dev.port_lookup','dev.git_summary','dev.explain_error'] : packs.includes('student') ? ['system.info','files.search','files.read_text','memory.remember','memory.recall','reminders.add','reminders.due','apps.launch','web.search','study.notes_add','study.notes_search','study.deadlines'] : ['system.info','files.search','files.read_text','memory.remember','memory.recall','reminders.add','reminders.due','apps.launch','web.search'],
      autoApprove: answers.strictness === 'relaxed' ? ['memory.remember'] : [],
      unlockedBlocked: [],
    },
    privacy: { mode: answers.privacy, cloudModelAllowed: answers.privacy === 'hybrid' },
    hardware: { tier: 'auto', schemaProfile: 'compact', cloudFallback: 'optional' },
    warnings,
  };
}

export default function SetupPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ assistantName: '', role: '', tone: 'concise', privacy: 'offline', strictness: 'balanced' });
  const [errors, setErrors] = useState({});
  const [config, setConfig] = useState(null);

  const set = (key, val) => setAnswers((a) => ({ ...a, [key]: val }));

  const next = () => {
    const errs = validateAnswers(answers);
    const relevantKeys = { 0: ['assistantName'], 1: ['role'], 2: ['tone'], 3: ['privacy'], 4: ['strictness'] }[step] ?? [];
    const stepErrs = Object.fromEntries(Object.entries(errs).filter(([k]) => relevantKeys.includes(k)));
    setErrors(stepErrs);
    if (Object.keys(stepErrs).length) return;
    if (step === 4) {
      const cfg = generateConfig(answers);
      setConfig(cfg);
      setStep(5);
    } else {
      setStep((s) => s + 1);
    }
  };

  const downloadConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kestrel-config.json';
    a.click();
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: '6rem', paddingBottom: '4rem' }}>
      {/* Simple nav */}
      <nav className="navbar">
        <div className="container">
          <div className="navbar-inner">
            <Link href="/" className="logo">
              <span className="logo-icon">🦅</span>
              <span className="logo-text">Kestrel</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="questionnaire">
          {/* Progress */}
          <div className="q-progress" style={{ marginBottom: '2.5rem' }}>
            {STEPS.slice(0, -1).map((s, i) => (
              <div key={s.id} className={`q-progress-dot${i <= step - 1 ? ' done' : ''}`} />
            ))}
          </div>

          {step < 5 && (
            <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Step {step + 1} of {STEPS.length - 1} — {STEPS[step].label}
            </div>
          )}

          {/* Step 0: Name */}
          {step === 0 && (
            <div className="animate-fade-up">
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Name your assistant</h1>
              <p>Choose a name that feels natural to you. Avoid trademarked names like Jarvis or Friday.</p>
              <div className="form-group">
                <label className="form-label" htmlFor="assistant-name">Assistant name</label>
                <input id="assistant-name" type="text" className="form-input" placeholder="e.g. Nova, Aria, Kai..." value={answers.assistantName} onChange={(e) => set('assistantName', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && next()} maxLength={24} />
                {errors.assistantName && <div className="form-error">{errors.assistantName}</div>}
              </div>
            </div>
          )}

          {/* Step 1: Role */}
          {step === 1 && (
            <div className="animate-fade-up">
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>What best describes you?</h1>
              <p>This determines which skill packs are enabled by default.</p>
              <div className="radio-group">
                {ROLES.map((r) => (
                  <label key={r.value} className="radio-card" htmlFor={`role-${r.value}`}>
                    <input id={`role-${r.value}`} type="radio" name="role" value={r.value} checked={answers.role === r.value} onChange={() => set('role', r.value)} />
                    <div className="radio-label">
                      <span className="radio-icon">{r.icon}</span>
                      <strong>{r.label}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
              {errors.role && <div className="form-error" style={{ marginTop: '0.5rem' }}>{errors.role}</div>}
            </div>
          )}

          {/* Step 2: Tone */}
          {step === 2 && (
            <div className="animate-fade-up">
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>How should {answers.assistantName || 'it'} talk to you?</h1>
              <p>This sets the assistant's communication style.</p>
              <div className="radio-group">
                {TONES.map((t) => (
                  <label key={t.value} className="radio-card" htmlFor={`tone-${t.value}`}>
                    <input id={`tone-${t.value}`} type="radio" name="tone" value={t.value} checked={answers.tone === t.value} onChange={() => set('tone', t.value)} />
                    <div className="radio-label">
                      <span className="radio-icon">{t.icon}</span>
                      <strong>{t.label}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Privacy */}
          {step === 3 && (
            <div className="animate-fade-up">
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Privacy mode</h1>
              <p>How should Kestrel handle network access? You can change this later in settings.</p>
              <div className="radio-group" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {PRIVACY.map((p) => (
                  <label key={p.value} className="radio-card" htmlFor={`privacy-${p.value}`}>
                    <input id={`privacy-${p.value}`} type="radio" name="privacy" value={p.value} checked={answers.privacy === p.value} onChange={() => set('privacy', p.value)} />
                    <div className="radio-label">
                      <span className="radio-icon">{p.icon}</span>
                      <strong>{p.label}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Strictness */}
          {step === 4 && (
            <div className="animate-fade-up">
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Approval level</h1>
              <p>How often should Kestrel ask before taking action? Fail-closed always applies: if in doubt, it stops and asks.</p>
              <div className="radio-group">
                {STRICTNESS.map((s) => (
                  <label key={s.value} className="radio-card" htmlFor={`strict-${s.value}`}>
                    <input id={`strict-${s.value}`} type="radio" name="strictness" value={s.value} checked={answers.strictness === s.value} onChange={() => set('strictness', s.value)} />
                    <div className="radio-label">
                      <span className="radio-icon">{s.icon}</span>
                      <strong>{s.label}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Done */}
          {step === 5 && config && (
            <div className="animate-fade-up">
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Your config is ready</h1>
                <p>Download <strong>kestrel-config.json</strong> and place it in your Kestrel data folder during first-run setup.</p>
                {config.warnings?.length > 0 && (
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.75rem', padding: '1rem', margin: '1rem 0', textAlign: 'left' }}>
                    <strong style={{ color: 'var(--accent-warn)' }}>⚠️ Warning</strong>
                    <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                      {config.warnings.map((w, i) => <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              <div className="terminal" style={{ marginBottom: '1.5rem' }}>
                <div className="terminal-header">
                  <span className="t-dot t-red" /><span className="t-dot t-yellow" /><span className="t-dot t-green" />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>kestrel-config.json</span>
                </div>
                <div className="terminal-body" style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <pre style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{JSON.stringify({ ...config, assistant: { ...config.assistant, persona: '[generated persona string]' } }, null, 2)}</pre>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={downloadConfig} id="btn-download-config">⬇️ Download config.json</button>
                <Link href="/download" className="btn btn-secondary" id="btn-go-download">Continue to download →</Link>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 5 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
              {step > 0
                ? <button className="btn btn-secondary" onClick={() => setStep((s) => s - 1)}>← Back</button>
                : <div />
              }
              <button className="btn btn-primary" onClick={next} id={`btn-next-step-${step}`}>
                {step === 4 ? '✨ Generate config' : 'Next →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
