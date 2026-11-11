import { query, inr } from '@/lib/mysql';
import { requireSession } from '@/lib/auth';
export const dynamic='force-dynamic';
export default async function Dashboard() {
 const s=await requireSession();
 const filter=s.role==='ADMIN'?'':'WHERE p.Investor_ID = ?';
 const args=s.role==='ADMIN'?[]:[s.investorId];
 const portfolios=await query(`SELECT p.Portfolio_ID,p.Portfolio_Name,i.Name AS Investor,fn_portfolio_value(p.Portfolio_ID) AS Total_Value FROM Portfolio p JOIN Investor i ON p.Investor_ID=i.Investor_ID ${filter} ORDER BY Total_Value DESC`,args);
 const [counts]=await query(`SELECT (SELECT COUNT(*) FROM Investor ${s.role==='ADMIN'?'':'WHERE Investor_ID = ?'}) AS investors,(SELECT COUNT(*) FROM Trade t JOIN Portfolio p ON p.Portfolio_ID=t.Portfolio_ID ${filter}) AS trades,(SELECT COUNT(*) FROM Stock) AS stocks`,s.role==='ADMIN'?[]:[s.investorId,s.investorId]);
 const total=portfolios.reduce((n,p)=>n+Number(p.Total_Value),0);
 return <><h1>{s.role==='ADMIN'?'Platform Dashboard':'My Dashboard'}</h1><div className="kpis"><div className="card"><div className="label">Total Portfolio Value</div><div className="value">{inr(total)}</div></div><div className="card"><div className="label">Investors</div><div className="value">{counts.investors}</div></div><div className="card"><div className="label">Trades</div><div className="value">{counts.trades}</div></div><div className="card"><div className="label">Stocks Tracked</div><div className="value">{counts.stocks}</div></div></div><h2>Portfolio Values</h2><table><thead><tr><th>Portfolio</th><th>Investor</th><th>Current Value</th></tr></thead><tbody>{portfolios.map(p=><tr key={p.Portfolio_ID}><td>{p.Portfolio_Name}</td><td>{p.Investor}</td><td>{inr(p.Total_Value)}</td></tr>)}</tbody></table></>;
}
