import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { redirect } from 'next/navigation';

const cookieName = 'investitrack_session';
function key() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}
export async function createSession(account) {
  return new SignJWT({ role: account.Role, investorId: account.Investor_ID ?? null })
    .setProtectedHeader({ alg: 'HS256' }).setSubject(String(account.User_ID))
    .setIssuedAt().setExpirationTime('8h').sign(key());
}
export async function getSession() {
  const token = cookies().get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    if (!['ADMIN','INVESTOR'].includes(payload.role)) return null;
    if (payload.role === 'INVESTOR' && !Number.isInteger(payload.investorId)) return null;
    return { userId: Number(payload.sub), role: payload.role, investorId: payload.investorId };
  } catch { return null; }
}
export async function requireSession() {
  const s = await getSession();
  if (!s) redirect('/login');
  return s;
}
export const sessionCookie = cookieName;
