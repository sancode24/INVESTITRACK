import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function GET() {
  const rows = await query(
    `SELECT Portfolio_ID, Portfolio_Name, fn_portfolio_value(Portfolio_ID) AS Total_Value FROM Portfolio`
  );
  return NextResponse.json(rows);
}
