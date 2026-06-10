import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '../../lib/cookies';
import { prisma } from '../../lib/db';
import { AuthForm } from '../../components/auth-form';

export default async function LoginPage() {
  const cookieStore = await cookies();  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const session = await prisma.session.findUnique({ where: { token } });
    if (session) redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold">Expense Tracker Pro</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Fast expense, pending balance, and payment tracking.</p>
        </div>
        <AuthForm mode="login" />
        <div className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          New here? <Link className="font-medium text-zinc-900 underline dark:text-white" href="/signup">Create account</Link>
        </div>
      </div>
    </div>
  );
}
