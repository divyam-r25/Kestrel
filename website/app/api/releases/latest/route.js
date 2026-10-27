/**
 * GET /api/releases/latest
 * Returns the latest release metadata. In production, read from a DB or static manifest.
 */
import { NextResponse } from 'next/server';

const LATEST = {
  version: '0.5.0-beta',
  channel: 'beta',
  date: '2026-10-27',
  checksumSHA256: '4b3e1d2c9f0a8b7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e',
  installerUrl: 'https://releases.kestrel.app/kestrel-0.5.0-beta-setup.exe',
  releaseNotesUrl: 'https://github.com/kestrel-app/kestrel/releases/tag/v0.5.0-beta',
  minOS: 'Windows 10 22H2',
  sizeMB: 48,
};

export async function GET() {
  return NextResponse.json(LATEST);
}
