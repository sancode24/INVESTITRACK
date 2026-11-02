import { NextResponse } from 'next/server';
import { Int32 } from 'mongodb';
import { mongoDb } from '@/lib/mongo';

export async function GET() {
  const db = await mongoDb();
  const notes = await db.collection('investor_notes').find().sort({ created_at: -1 }).toArray();
  return NextResponse.json(notes);
}

export async function POST(req) {
  const b = await req.json();
  if (!b.title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  try {
    const db = await mongoDb();
    const doc = {
      investor_id: new Int32(Number(b.investor_id)),
      title: b.title,
      body: b.body || '',
      tags: (b.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      created_at: new Date(),
    };
    if (b.symbol) doc.symbol = b.symbol.toUpperCase();
    await db.collection('investor_notes').insertOne(doc);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
