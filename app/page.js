import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '../lib/cookies';
import { prisma } from '../lib/db';

export default async function HomePage() {
  const cookieStore = await cookies();  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) redirect('/login');
  const session = await prisma.session.findUnique({ where: { token } });
  redirect(session ? '/dashboard' : '/login');
}
