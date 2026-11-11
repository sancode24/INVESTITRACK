import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/mysql';
import { createSession, sessionCookie } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    const rows = await query('SELECT User_ID, Email, Password_Hash, Role, Investor_ID FROM User_Account WHERE Email = ? LIMIT 1', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.Password_Hash))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    const token = await createSession(user);
    const response = NextResponse.json({ ok: true, role: user.Role });
    response.cookies.set(sessionCookie, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 8 });
    return response;
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Login unavailable' }, { status: 500 });
  }
}
