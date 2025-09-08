import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof File))
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const records = parse(buf, { columns: true, skip_empty_lines: true });
  return NextResponse.json({ count: records.length, sample: records.slice(0, 5) });
}
