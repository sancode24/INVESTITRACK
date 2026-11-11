import { requireSession } from '@/lib/auth';
import { query, inr } from '@/lib/mysql';
import PriceEditor from './PriceEditor';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function Admin() {
  const session = await requireSession();
  if (session.role !== 'ADMIN') redirect('/');
  const investors = await query('SELECT Investor_ID, Name, Email FROM Investor ORDER BY Investor_ID');
  const stocks = await query('SELECT Symbol, Price FROM Stock ORDER BY Symbol');
  const [count] = await query('SELECT COUNT(*) AS total FROM Trade');
  return <><h1>Admin Dashboard</h1><p>Manage stock prices and view platform records.</p>
    <div className="kpis"><div className="card"><div className="label">Investors</div><div className="value">{investors.length}</div></div>
    <div className="card"><div className="label">Trades</div><div className="value">{count.total}</div></div></div>
    <PriceEditor stocks={stocks} />
    <h2>Investors</h2><table><thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead><tbody>{investors.map(i => <tr key={i.Investor_ID}><td>{i.Investor_ID}</td><td>{i.Name}</td><td>{i.Email}</td></tr>)}</tbody></table>
    <h2>Stock prices</h2><table><thead><tr><th>Symbol</th><th>Market price</th></tr></thead><tbody>{stocks.map(s => <tr key={s.Symbol}><td>{s.Symbol}</td><td>{inr(s.Price)}</td></tr>)}</tbody></table>
  </>;
}
