import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { mongoDb } from '@/lib/mongo';

export async function GET() {
  const rows = await query('SELECT * FROM Trade ORDER BY Txn_Date DESC');
  return NextResponse.json(rows);
}

// Places a trade via the stored procedure. MySQL triggers validate the SELL
// and update Holding; the outcome is logged to MongoDB (trade_audit).
export async function POST(req) {
  const b = await req.json();
  const entry = {
    portfolio_id: Number(b.portfolio), symbol: b.symbol, type: b.type,
    qty: Number(b.qty), price: Number(b.price), at: new Date(),
  };
  try {
    await query('CALL sp_place_trade(?,?,?,?,?,?,?)',
      [entry.portfolio_id, entry.symbol, Number(b.broker), entry.type, entry.qty, entry.price, b.date]);
    entry.status = 'OK';
    await logAudit(entry);
    return NextResponse.json({ ok: true });
  } catch (e) {
    entry.status = 'FAILED';
    entry.error = e.sqlMessage || e.message;
    await logAudit(entry);
    return NextResponse.json({ error: entry.error }, { status: 400 });
  }
}

async function logAudit(entry) {
  try {
    const db = await mongoDb();
    await db.collection('trade_audit').insertOne(entry);
  } catch (_) { /* audit log must never break a trade */ }
}
