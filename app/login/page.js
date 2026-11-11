'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function Login() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const values = Object.fromEntries(new FormData(e.currentTarget));
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      router.push(data.role === 'ADMIN' ? '/admin' : '/');
      router.refresh();
    } catch { setError('Could not connect to server'); }
    finally { setBusy(false); }
  }
  return <div className="card" style={{ maxWidth: 440, margin: '60px auto', padding: 24 }}>
    <h1>InvestiTrack Login</h1>
    <p>Sign in as an Investor or Admin.</p>
    <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
      <label>Email<input name="email" type="email" autoComplete="username" required /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
      <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      {error && <p className="bad" role="alert">{error}</p>}
    </form>
  </div>;
}
