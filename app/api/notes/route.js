import { NextResponse } from 'next/server';
import { Int32 } from 'mongodb';
import { mongoDb } from '@/lib/mongo';
import { getSession } from '@/lib/auth';
export async function GET(){
 const s=await getSession();if(!s)return NextResponse.json({error:'Login required'},{status:401});
 const db=await mongoDb();const notes=await db.collection('investor_notes').find(s.role==='ADMIN'?{}:{investor_id:s.investorId}).sort({created_at:-1}).toArray();
 return NextResponse.json(notes);
}
export async function POST(req){
 const s=await getSession();if(!s)return NextResponse.json({error:'Login required'},{status:401});
 if(s.role!=='INVESTOR')return NextResponse.json({error:'Investor only'},{status:403});
 try{
  const b=await req.json();if(!String(b.title||'').trim())return NextResponse.json({error:'Title required'},{status:400});
  const doc={investor_id:new Int32(s.investorId),title:String(b.title).trim(),body:String(b.body||''),tags:String(b.tags||'').split(',').map(t=>t.trim()).filter(Boolean),created_at:new Date()};
  if(b.symbol)doc.symbol=String(b.symbol).toUpperCase();
  const db=await mongoDb();await db.collection('investor_notes').insertOne(doc);return NextResponse.json({ok:true});
 }catch(e){return NextResponse.json({error:'Could not save note'},{status:500});}
}
