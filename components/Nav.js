import Link from 'next/link';
import { getSession } from '@/lib/auth';
import LogoutButton from './LogoutButton';
export default async function Nav() {
 const s=await getSession();
 return <nav className="nav"><strong>InvestiTrack</strong>{s ? <>
 <Link href="/">Dashboard</Link><Link href="/holdings">Holdings</Link><Link href="/trades">Trades</Link><Link href="/analytics">Analytics</Link><Link href="/notes">Notes</Link>
 {s.role==='ADMIN' && <Link href="/admin">Admin</Link>}<span>{s.role}</span><LogoutButton/></> : <Link href="/login">Login</Link>}</nav>;
}
