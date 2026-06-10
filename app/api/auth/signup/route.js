import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { hashPassword, createSession } from '../../../../lib/auth';
import { seedWorkspaceDefaults } from '../../../../lib/service';
import { signupSchema } from '../../../../lib/validators';
import { apiError } from '../../../../lib/api';

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || 'Invalid request', 400);

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return apiError('Email already registered', 409);

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
        workspaces: {
          create: {
            name: `${name || email.split('@')[0]}'s workspace`
          }
        }
      },
      include: { workspaces: true }
    });

    const workspace = user.workspaces[0];
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
    return apiError(error.message || 'Signup failed', 500);
  }
}
