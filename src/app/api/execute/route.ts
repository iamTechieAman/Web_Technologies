import { NextRequest, NextResponse } from 'next/server';
import { executeCode } from '@/lib/execution';
import type { SupportedLanguage } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { language, code, stdin } = body as {
      language: SupportedLanguage;
      code: string;
      stdin?: string;
    };

    // ── ACTIVE DEBUG LOG — remove after confirming stdin arrives ──
    console.log('[API /execute] ▶ language:', language);
    console.log('[API /execute] ▶ stdin received:', JSON.stringify(stdin));
    // ─────────────────────────────────────────────────────────────

    if (!language || !code) {
      return NextResponse.json(
        { success: false, error: 'Language and code are required' },
        { status: 400 },
      );
    }

    // Pass stdin explicitly; executeCode normalises to '' if undefined
    const result = await executeCode(language, code, stdin);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[API /execute] ✗ Fatal Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal Server Error during execution',
        engine: 'piston',
      },
      { status: 500 },
    );
  }
}
