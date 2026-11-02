'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TradeForm({ portfolios, brokers, stocks }) {
  const router = useRouter();
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    const res = await fetch('/api/trades', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json();
    setMsg({ ok: res.ok, text: res.ok ? 'Trade placed.' : data.error });
    if (res.ok) router.refresh();
  }

  return (
    <form className="card" onSubmit={submit}>
      <label>Portfolio
        <select name="portfolio" required>
          {portfolios.map((p) => <option key={p.Portfolio_ID} value={p.Portfolio_ID}>{p.Portfolio_Name}</option>)}
        </select></label>
      <label>Stock
        <select name="symbol" required>{stocks.map((s) => <option key={s.Symbol}>{s.Symbol}</option>)}</select></label>
      <label>Type
        <select name="type"><option>BUY</option><option>SELL</option></select></label>
      <label>Quantity<input name="qty" type="number" min="1" required /></label>
      <label>Price<input name="price" type="number" step="0.01" min="0.01" required /></label>
      <label>Broker
        <select name="broker">{brokers.map((b) => <option key={b.Broker_ID} value={b.Broker_ID}>{b.Broker_Name}</option>)}</select></label>
      <label>Date<input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
      <button type="submit">Place Trade</button>
      {msg && <div className={`msg ${msg.ok ? 'good' : 'bad'}`}>{msg.text}</div>}
    </form>
  );
}
