import { classify } from './hardware.js';
import { SYSTEM_RULES } from './taint.js';

// The website questionnaire produces `answers`; this turns them into the config the desktop app loads.
// One signed installer for everyone + a generated config (NOT a custom build per user).

const ROLES = ['student', 'developer', 'general', 'tutor'];
const STRICTNESS = ['cautious', 'balanced', 'relaxed'];
const PRIVACY = ['offline', 'hybrid'];
const TONES = ['concise', 'friendly', 'formal'];
const ROLE_PACKS = { student: ['core', 'student'], developer: ['core', 'dev'], general: ['core'], tutor: ['core', 'student'] };

export function validateAnswers(a) {
  const errors = [];
  const name = String(a?.assistantName ?? '').trim();
  if (!/^[\p{L}\p{N} _-]{2,24}$/u.test(name)) errors.push('assistantName: 2-24 letters/numbers');
  if (!ROLES.includes(a?.role)) errors.push(`role: one of ${ROLES}`);
  if (!STRICTNESS.includes(a?.strictness ?? 'balanced')) errors.push(`strictness: one of ${STRICTNESS}`);
  if (!PRIVACY.includes(a?.privacy ?? 'offline')) errors.push(`privacy: one of ${PRIVACY}`);
  if (!TONES.includes(a?.tone ?? 'concise')) errors.push(`tone: one of ${TONES}`);
  if (a?.extraPacks && !a.extraPacks.every((p) => ['dev', 'student'].includes(p))) errors.push('extraPacks: dev|student');
  return errors;
}

export function generateConfig(answers, skills, hardware = { totalMemGB: 8 }) {
  const errors = validateAnswers(answers);
  if (errors.length) throw new Error(`invalid answers: ${errors.join('; ')}`);

  const warnings = [];
  const name = answers.assistantName.trim();
  if (/jarvis|friday|ultron/i.test(name)) warnings.push('That name is a Marvel trademark; fine privately, but pick an original name before publishing.');

  const strictness = answers.strictness ?? 'balanced';
  const tone = answers.tone ?? 'concise';
  const privacy = answers.privacy ?? 'offline';
  const packs = new Set([...ROLE_PACKS[answers.role], ...(answers.extraPacks ?? [])]);
  const hw = classify(hardware);

  const enabledSkills = skills.filter((s) => packs.has(s.pack) && s.tier !== 'blocked').map((s) => s.name);
  // Only 'relaxed' users pre-approve anything, and only low-blast-radius ask-tier skills.
  const autoApprove = strictness === 'relaxed'
    ? skills.filter((s) => s.tier === 'ask' && s.sideEffects === 'memory' && enabledSkills.includes(s.name)).map((s) => s.name)
    : [];

  const toneLine = { concise: 'Answer briefly and directly.', friendly: 'Be warm and conversational.', formal: 'Use a formal, precise register.' }[tone];
  const roleLine = { student: 'You help a college student study, plan, and stay organised.', developer: 'You help a software engineer with their local dev environment and projects.', general: 'You help with everyday computer tasks.', tutor: 'You help a tutor manage students, schedules, and materials.' }[answers.role];

  return {
    version: 1,
    assistant: { name, tone, persona: `You are ${name}. ${roleLine} ${toneLine} ${SYSTEM_RULES}` },
    packs: [...packs],
    skills: { enabled: enabledSkills, autoApprove, unlockedBlocked: [] },
    privacy: { mode: privacy, cloudModelAllowed: privacy === 'hybrid' },
    hardware: hw,
    warnings,
  };
}
