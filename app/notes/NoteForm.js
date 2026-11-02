'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NoteForm({ investors }) {
  const router = useRouter();
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    const form = e.target;
    const res = await fetch('/api/notes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const data = await res.json();
    setMsg({ ok: res.ok, text: res.ok ? 'Note saved.' : data.error });
    if (res.ok) { form.reset(); router.refresh(); }
  }

  return (
    <form className="card" onSubmit={submit}>
      <label>Investor
        <select name="investor_id">{investors.map((i) => <option key={i.Investor_ID} value={i.Investor_ID}>{i.Name}</option>)}</select></label>
      <label>Title<input name="title" required /></label>
      <label>Symbol (optional)<input name="symbol" /></label>
      <label>Tags (comma separated)<input name="tags" /></label>
      <label style={{ gridColumn: '1/-1' }}>Note<textarea name="body" rows="3" /></label>
      <button type="submit">Save Note</button>
      {msg && <div className={`msg ${msg.ok ? 'good' : 'bad'}`}>{msg.text}</div>}
    </form>
  );
}
