import { query, inr } from '@/lib/mysql';
import { requireSession } from '@/lib/auth';
export const dynamic='force-dynamic';
export default async function Holdings(){
 const s=await requireSession();
 const rows=await query(`SELECT i.Name AS Investor,v.* FROM v_holding_pnl v JOIN Investor i ON i.Investor_ID=v.Investor_ID ${s.role==='ADMIN'?'':'WHERE v.Investor_ID=?'} ORDER BY v.Investor_ID,v.Portfolio_Name`,s.role==='ADMIN'?[]:[s.investorId]);
 return <><h1>Holdings &amp; Unrealised P&amp;L</h1><table><thead><tr>{['Investor','Portfolio','Symbol','Qty','Avg Buy','Market','Invested','Value','P&L','%'].map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td>{r.Investor}</td><td>{r.Portfolio_Name}</td><td>{r.Symbol}</td><td>{r.Quantity}</td><td>{inr(r.Avg_Buy_Price)}</td><td>{inr(r.Market_Price)}</td><td>{inr(r.Invested)}</td><td>{inr(r.Current_Value)}</td><td className={Number(r.Unrealised_PnL)>=0?'good':'bad'}>{inr(r.Unrealised_PnL)}</td><td>{r.PnL_Pct}%</td></tr>)}</tbody></table></>;
}
