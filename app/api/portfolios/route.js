import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/mysql';
export async function GET(){
 const s=await getSession();if(!s)return NextResponse.json({error:'Login required'},{status:401});
 const rows=await query(`SELECT Portfolio_ID,Portfolio_Name,fn_portfolio_value(Portfolio_ID) AS Total_Value FROM Portfolio ${s.role==='ADMIN'?'':'WHERE Investor_ID=?'}`,s.role==='ADMIN'?[]:[s.investorId]);
 return NextResponse.json(rows);
}
