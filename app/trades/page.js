import { query, inr } from '@/lib/mysql';
import { requireSession } from '@/lib/auth';
import TradeForm from './TradeForm';
export const dynamic='force-dynamic';
export default async function Trades(){
 const s=await requireSession();const admin=s.role==='ADMIN';
 const trades=await query(`SELECT t.Transaction_ID,t.Txn_Date,p.Portfolio_Name,s.Symbol,t.Txn_Type,t.Quantity,t.Price,b.Broker_Name,ROUND(t.Quantity*t.Price*b.Commission_Rate/100,2) AS Commission FROM Trade t JOIN Portfolio p ON t.Portfolio_ID=p.Portfolio_ID JOIN Stock s ON t.Stock_ID=s.Stock_ID JOIN Broker b ON t.Broker_ID=b.Broker_ID ${admin?'':'WHERE p.Investor_ID=?'} ORDER BY t.Txn_Date DESC,t.Transaction_ID DESC`,admin?[]:[s.investorId]);
 const portfolios=await query(`SELECT Portfolio_ID,Portfolio_Name FROM Portfolio ${admin?'':'WHERE Investor_ID=?'} ORDER BY Portfolio_Name`,admin?[]:[s.investorId]);
 const brokers=await query('SELECT Broker_ID,Broker_Name FROM Broker');
 const stocks=await query('SELECT Symbol FROM Stock ORDER BY Symbol');
 return <><h1>Trades</h1>{!admin&&<TradeForm portfolios={portfolios} brokers={brokers} stocks={stocks}/>}<h2>Trade History</h2><table><thead><tr>{['Date','Portfolio','Symbol','Type','Qty','Price','Broker','Commission'].map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{trades.map(t=><tr key={t.Transaction_ID}><td>{t.Txn_Date}</td><td>{t.Portfolio_Name}</td><td>{t.Symbol}</td><td>{t.Txn_Type}</td><td>{t.Quantity}</td><td>{inr(t.Price)}</td><td>{t.Broker_Name}</td><td>{inr(t.Commission)}</td></tr>)}</tbody></table></>;
}
