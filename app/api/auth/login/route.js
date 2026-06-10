import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { verifyPassword, createSession } from '../../../../lib/auth';
import { seedWorkspaceDefaults } from '../../../../lib/service';
import { loginSchema } from '../../../../lib/validators';
import { apiError } from '../../../../lib/api';

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || 'Invalid request', 400);

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { workspaces: true }
    });

    if (!user) return apiError('Invalid email or password', 401);
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return apiError('Invalid email or password', 401);

    const workspace = user.workspaces[0] || await prisma.workspace.create({
      data: { ownerId: user.id, name: `${user.name || email.split('@')[0]}'s workspace` }
    });

    await seedWorkspaceDefaults(workspace.id);

    const { token, expiresAt } = await createSession(user.id);
    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email },
      workspace: { id: workspace.id, name: workspace.name }
    });
    res.cookies.set('expense_tracker_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt
    });
    return res;
  } catch (error) {
    return apiError(error.message || 'Login failed', 500);
  }
}
