import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/mysql';
import { mongoDb } from '@/lib/mongo';
export async function GET(){
 const s=await getSession();if(!s)return NextResponse.json({error:'Login required'},{status:401});
 const rows=await query(`SELECT t.* FROM Trade t JOIN Portfolio p ON t.Portfolio_ID=p.Portfolio_ID ${s.role==='ADMIN'?'':'WHERE p.Investor_ID=?'} ORDER BY t.Txn_Date DESC`,s.role==='ADMIN'?[]:[s.investorId]);
 return NextResponse.json(rows);
}
export async function POST(req){
 const s=await getSession();if(!s)return NextResponse.json({error:'Login required'},{status:401});
 if(s.role!=='INVESTOR')return NextResponse.json({error:'Investor only'},{status:403});
 let b;try{b=await req.json();}catch{return NextResponse.json({error:'Invalid JSON'},{status:400});}
 const entry={portfolio_id:Number(b.portfolio),symbol:String(b.symbol||'').toUpperCase(),type:b.type,qty:Number(b.qty),price:Number(b.price),at:new Date()};
 if(!Number.isInteger(entry.portfolio_id)||!Number.isInteger(entry.qty)||entry.qty<=0||!Number.isFinite(entry.price)||entry.price<=0||!['BUY','SELL'].includes(entry.type)||!/^\d{4}-\d{2}-\d{2}$/.test(b.date||''))return NextResponse.json({error:'Invalid trade details'},{status:400});
 const owned=await query('SELECT Portfolio_ID FROM Portfolio WHERE Portfolio_ID=? AND Investor_ID=?',[entry.portfolio_id,s.investorId]);
 if(!owned.length)return NextResponse.json({error:'Portfolio not found or not owned'},{status:403});
 try{
  await query('CALL sp_place_trade(?,?,?,?,?,?,?)',[entry.portfolio_id,entry.symbol,Number(b.broker),entry.type,entry.qty,entry.price,b.date]);
  await audit({...entry,status:'OK'});return NextResponse.json({ok:true});
 }catch(e){const error=e.sqlMessage||e.message;await audit({...entry,status:'FAILED',error});return NextResponse.json({error},{status:400});}
}
async function audit(entry){try{const db=await mongoDb();await db.collection('trade_audit').insertOne(entry);}catch(e){console.error('Audit write failed',e);}}
