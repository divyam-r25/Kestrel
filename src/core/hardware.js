import os from 'node:os';

// Planning thresholds (assumptions; verify with a real latency benchmark on target laptops).
// GPU VRAM is optional input because reliable GPU detection is OS/vendor-specific.
export function classify({ totalMemGB, cpuCores = 4, vramGB = 0 }) {
  let tier = 'lite';
  if (totalMemGB >= 32 || (vramGB >= 8 && totalMemGB >= 16)) tier = 'pro';
  else if (totalMemGB >= 16) tier = 'standard';

  const plans = {
    lite: { llm: { sizeClass: '1-3B', quant: 'Q4', contextTokens: 4096 }, stt: 'tiny/base', tts: 'piper-small', schemaProfile: 'compact', cloudFallback: 'recommended' },
    standard: { llm: { sizeClass: '7-8B', quant: 'Q4', contextTokens: 8192 }, stt: 'base/small', tts: 'piper-medium', schemaProfile: 'compact', cloudFallback: 'optional' },
    pro: { llm: { sizeClass: '8-14B', quant: 'Q4-Q5', contextTokens: 16384 }, stt: 'small/medium', tts: 'piper-high', schemaProfile: 'full', cloudFallback: 'optional' },
  };
  const warnings = [];
  if (cpuCores < 4) warnings.push('fewer than 4 CPU cores: expect slow voice latency');
  if (totalMemGB < 8) warnings.push('under 8 GB RAM: use cloud fallback or a 1B model only');
  return { tier, ...plans[tier], warnings };
}

export function detect() {
  return classify({ totalMemGB: Math.round((os.totalmem() / 2 ** 30) * 10) / 10, cpuCores: os.cpus().length });
}
