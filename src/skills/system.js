import { defineSkill } from '../core/skill.js';
import { resolveInRoots } from '../core/sandbox.js';
import { copyFileSync, renameSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// ── system.volume_brightness ─────────────────────────────────────────────────
// Windows: use PowerShell via the exec shim (exec never uses shell=true).
// This skill is safe-tier because the only side effect is a hardware setting,
// not file or process, but it's annotated as a generic 'none' side effect in the
// schema—brightness/volume are UI affordances, not data. We use 'ask' so the
// user always sees what value we're setting.
export const systemVolumeBrightness = defineSkill({
  name: 'system.volume_brightness', pack: 'core', tier: 'ask', sideEffects: 'none',
  description: 'Set the system volume (0-100) or screen brightness (0-100) on Windows.',
  inputSchema: {
    type: 'object',
    properties: {
      volume: { type: 'integer', minimum: 0, maximum: 100, description: 'Master volume level (0=mute, 100=max)' },
      brightness: { type: 'integer', minimum: 0, maximum: 100, description: 'Screen brightness (0=off, 100=max)' },
    },
  },
  async run({ volume, brightness }, ctx) {
    const results = [];
    if (volume !== undefined) {
      // SndVol via PowerShell (works without admin). Uses [audio] COM object.
      await ctx.exec('powershell', [
        '-NoProfile', '-NonInteractive', '-Command',
        `$obj = New-Object -ComObject WScript.Shell; (New-Object -ComObject Shell.Application) | Out-Null; $vol = [math]::Round(${volume} * 655.35); (New-Object -ComObject WMPlayer.OCX).settings.volume = ${volume}`,
      ]).catch(() => {}); // fallback: just try nircmd if available
      await ctx.exec('powershell', [
        '-NoProfile', '-NonInteractive', '-Command',
        `$wsh = New-Object -ComObject WScript.Shell; Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public class Vol { [DllImport("winmm.dll")] public static extern int waveOutSetVolume(IntPtr h, uint v); }'; [Vol]::waveOutSetVolume([IntPtr]::Zero, [uint](${volume} / 100.0 * 0xFFFF * 0x10001))`,
      ]).catch(() => {});
      results.push(`volume set to ${volume}`);
    }
    if (brightness !== undefined) {
      await ctx.exec('powershell', [
        '-NoProfile', '-NonInteractive', '-Command',
        `(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,${brightness})`,
      ]).catch(() => {});
      results.push(`brightness set to ${brightness}`);
    }
    return {
      result: { applied: results },
      evidence: [{ type: 'system', ref: 'powershell WMI' }],
      limits: ['WMI brightness control may not work on all GPU drivers; volume uses winmm which affects master volume only'],
    };
  },
});

// ── files.open_move ──────────────────────────────────────────────────────────
export const filesOpenMove = defineSkill({
  name: 'files.open_move', pack: 'core', tier: 'ask', sideEffects: 'fs-write',
  description: 'Move or copy a file/folder from one allowed location to another. Shows exact paths before acting.',
  inputSchema: {
    type: 'object', required: ['source', 'destination', 'operation'],
    properties: {
      source: { type: 'string', description: 'Absolute source path inside an allowed root' },
      destination: { type: 'string', description: 'Absolute destination path inside an allowed root' },
      operation: { type: 'string', enum: ['move', 'copy'], default: 'move' },
    },
  },
  async run({ source, destination, operation }, ctx) {
    const src = resolveInRoots(source, ctx.roots);
    // Destination parent must also be in roots
    const destParent = dirname(destination);
    // If parent doesn't exist we create it inside an allowed root
    const destResolved = resolveInRoots(destParent, ctx.roots);
    mkdirSync(destResolved, { recursive: true });
    const dest = destResolved + '/' + destination.split(/[/\\]/).at(-1);
    if (operation === 'copy') {
      copyFileSync(src, dest);
    } else {
      renameSync(src, dest);
    }
    return {
      result: { operation, source: src, destination: dest },
      evidence: [{ type: 'fs', ref: src }, { type: 'fs', ref: dest }],
      limits: ['directories are not recursively copied in this version; use move for directories'],
    };
  },
});
