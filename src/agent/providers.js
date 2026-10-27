// Provider interface: chat({messages, tools}) -> {text} | {toolCall:{name,args}}
// Swappable so users can pick local (Ollama) or cloud models.

/** Deterministic provider for tests and demos. */
export class ScriptedProvider {
  constructor(steps) { this.steps = [...steps]; this.seen = []; }
  async chat(req) {
    this.seen.push(req);
    const next = this.steps.shift();
    if (!next) return { text: '(script finished)' };
    return typeof next === 'function' ? next(req) : next;
  }
}

// Many chat models only accept [a-zA-Z0-9_-] in tool names, so we map "files.search" <-> "files__search".
const enc = (n) => n.replaceAll('.', '__');
const dec = (n) => n.replaceAll('__', '.');

/** Local models via Ollama (http://localhost:11434). NOTE: written against the documented /api/chat
 *  tool-calling format but not yet exercised against a live Ollama in this repo's CI. */
export class OllamaProvider {
  constructor({ model = 'llama3.1:8b', host = 'http://127.0.0.1:11434', fetchImpl = fetch } = {}) {
    Object.assign(this, { model, host, fetchImpl });
  }
  async chat({ messages, tools }) {
    const body = {
      model: this.model, stream: false,
      messages: messages.map((m) => m.toolCall
        ? { role: 'assistant', content: '', tool_calls: [{ function: { name: enc(m.toolCall.name), arguments: m.toolCall.args ?? {} } }] }
        : { role: m.role, content: m.content, ...(m.role === 'tool' ? { tool_name: enc(m.name) } : {}) }),
      tools: tools.map((t) => ({ type: 'function', function: { name: enc(t.name), description: t.description ?? '', parameters: t.inputSchema } })),
    };
    const res = await this.fetchImpl(`${this.host}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`ollama ${res.status}`);
    const data = await res.json();
    const call = data.message?.tool_calls?.[0]?.function;
    return call ? { toolCall: { name: dec(call.name), args: call.arguments ?? {} } } : { text: data.message?.content ?? '' };
  }
}
