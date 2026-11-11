import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/mysql';
export async function POST(req) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'Login required' }, { status: 401 });
  if (s.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  try {
    const b = await req.json();
    const price = Number(b.price);
    const symbol = String(b.symbol || '').trim().toUpperCase();
    if (!symbol || !Number.isFinite(price) || price <= 0) return NextResponse.json({ error: 'Invalid symbol or price' }, { status: 400 });
    const result = await query('UPDATE Stock SET Price = ? WHERE Symbol = ?', [price, symbol]);
    if (!result.affectedRows) return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Could not update price' }, { status: 500 }); }
}
