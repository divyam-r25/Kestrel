import { fence } from '../core/taint.js';

// Render a tool result for the model. Untrusted payloads are fenced so the model can tell DATA from instructions.
export function renderToolResult(env) {
  if (!env.ok) return JSON.stringify({ ok: false, error: env.error, limits: env.limits });
  const { result, ...meta } = env;
  const body = env.untrusted ? fence(JSON.stringify(result), env.skill) : JSON.stringify(result);
  return JSON.stringify({ ok: true, skill: meta.skill, limits: meta.limits, evidenceCount: meta.evidence.length }) + '\n' + body;
}

export async function runAgent({ provider, registry, session, userText, systemPrompt, profile = 'full', maxSteps = 6, onEvent = () => {} }) {
  const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userText }];
  const trace = [];
  for (let step = 0; step < maxSteps; step++) {
    const reply = await provider.chat({ messages, tools: registry.list({ profile }) });
    if (!reply.toolCall) { onEvent({ type: 'final' }); return { text: reply.text, trace, messages }; }
    const { name, args } = reply.toolCall;
    messages.push({ role: 'assistant', toolCall: reply.toolCall });
    const env = await registry.invoke(name, args, session);
    trace.push({ name, ok: env.ok, error: env.error?.code ?? null });
    onEvent({ type: 'tool', name, ok: env.ok });
    messages.push({ role: 'tool', name, content: renderToolResult(env) });
  }
  return { text: 'Stopped: too many tool steps.', trace, messages };
}
