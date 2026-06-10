import { NextResponse } from 'next/server';
import { deleteSession } from '../../../../lib/auth';
import { SESSION_COOKIE, parseCookieHeader } from '../../../../lib/cookies';

export async function POST(request) {
  const cookies = parseCookieHeader(request.headers.get('cookie') || '');
  const token = cookies[SESSION_COOKIE];
  await deleteSession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0)
  });
  return res;
}
