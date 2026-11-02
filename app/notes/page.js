import { query } from '@/lib/mysql';
import { mongoDb } from '@/lib/mongo';
import NoteForm from './NoteForm';

export const dynamic = 'force-dynamic';

export default async function Notes() {
  const investors = await query('SELECT Investor_ID, Name FROM Investor ORDER BY Name');
  let notes = [];
  let error = null;
  try {
    const db = await mongoDb();
    notes = await db.collection('investor_notes').find().sort({ created_at: -1 }).toArray();
  } catch (e) {
    error = 'MongoDB is not reachable: ' + e.message;
  }
  const names = Object.fromEntries(investors.map((i) => [i.Investor_ID, i.Name]));

  return (
    <>
      <h1>Research Notes <small style={{ fontWeight: 400, fontSize: 14 }}>(MongoDB)</small></h1>
      <NoteForm investors={investors} />
      {error && <p className="bad">{error}</p>}
      <h2>Notes</h2>
      {notes.map((n) => (
        <div className="card note" key={String(n._id)}>
          <strong>{n.title}</strong> · {names[Number(n.investor_id)] ?? `Investor ${n.investor_id}`}
          {n.symbol && <> · {n.symbol}</>}
          <p>{n.body}</p>
          {(n.tags || []).map((t) => <span className="tag" key={t}>{t}</span>)}
        </div>
      ))}
    </>
  );
}
