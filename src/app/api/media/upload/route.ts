import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

// Supported mime types mapping to extension
const ALLOWED: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'video/mp4': 'mp4',
  'application/pdf': 'pdf',
};

const MAX_SIZE = 16 * 1024 * 1024; // 16 MB

export const runtime = 'nodejs';

/**
 * Handle media upload for templates of type twilio/media.
 * Returns JSON { url, filename, size, mime }
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo ausente' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Arquivo excede 16MB' }, { status: 400 });
    }
    const mime = file.type;
    const ext = ALLOWED[mime];
    if (!ext) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    // Compute deterministic-ish name: random + original sanitized tail
    const rand = randomBytes(6).toString('hex');
    const cleanOrig = path
      .basename(file.name)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_');
    const filename = `${Date.now()}_${rand}_${cleanOrig}`;
    const publicDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(publicDir, { recursive: true });
    const target = path.join(publicDir, filename);
  // Cast para any devido a tipos Node vs TS target
  await fs.writeFile(target, buf as any);
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url, filename, size: file.size, mime });
  } catch (e: any) {
    console.error('Upload error', e);
    return NextResponse.json({ error: 'Falha no upload', message: e.message }, { status: 500 });
  }
}
