import { query } from '@/lib/mysql';
import { mongoDb } from '@/lib/mongo';
import { requireSession } from '@/lib/auth';
import NoteForm from './NoteForm';
export const dynamic='force-dynamic';
export default async function Notes(){
 const s=await requireSession();const admin=s.role==='ADMIN';
 const investors=await query(`SELECT Investor_ID,Name FROM Investor ${admin?'':'WHERE Investor_ID=?'} ORDER BY Name`,admin?[]:[s.investorId]);
 let notes=[],error=null;
 try {const db=await mongoDb();notes=await db.collection('investor_notes').find(admin?{}:{investor_id:s.investorId}).sort({created_at:-1}).toArray();}
 catch(e){error='MongoDB unavailable: '+e.message;}
 const names=Object.fromEntries(investors.map(i=>[i.Investor_ID,i.Name]));
 return <><h1>Research Notes (MongoDB)</h1>{!admin&&<NoteForm investors={investors}/>}
 {error&&<p className="bad">{error}</p>}<h2>Notes</h2>{notes.map(n=><div className="card note" key={String(n._id)}><strong>{n.title}</strong> · {names[Number(n.investor_id)]||'Investor'}{n.symbol&&' · '+n.symbol}<p>{n.body}</p>{(n.tags||[]).map(t=><span className="tag" key={t}>{t}</span>)}</div>)}</>;
}
