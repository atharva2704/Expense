import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '../../lib/cookies';
import { prisma } from '../../lib/db';
import { DashboardApp } from '../../components/dashboard-app';

export default async function NotificationsPage() {
  const cookieStore = await cookies();  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) redirect('/login');
  const session = await prisma.session.findUnique({ where: { token } });
  if (!session) redirect('/login');
  return <DashboardApp initialTab="notifications" />;
}
