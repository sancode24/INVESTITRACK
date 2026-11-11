'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function PriceEditor({ stocks }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  async function submit(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch('/api/admin/prices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await res.json();
    setMessage(res.ok ? 'Price updated.' : result.error || 'Update failed');
    if (res.ok) router.refresh();
  }
  return <form className="card" onSubmit={submit}>
    <h2>Update stock price</h2>
    <label>Stock<select name="symbol">{stocks.map(s => <option key={s.Symbol} value={s.Symbol}>{s.Symbol} — ₹{s.Price}</option>)}</select></label>
    <label>New price (₹)<input name="price" type="number" step="0.01" min="0.01" required /></label>
    <button type="submit">Update price</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
