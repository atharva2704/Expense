import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from './db';
import { SESSION_COOKIE, parseCookieHeader } from './cookies';

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function createToken() {
  return crypto.randomUUID();
}

export async function createSession(userId, days = 30) {
  const token = createToken();
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { token, userId, expiresAt }
  });
  return { token, expiresAt };
}

export async function deleteSession(token) {
  if (!token) return;
  await prisma.session.deleteMany({ where: { token } });
}

export async function getSessionFromToken(token) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { token } }).catch(() => {});
    return null;
  }
  return session;
}

export async function getSessionFromRequest(request) {
  const cookies = parseCookieHeader(request.headers.get('cookie') || '');
  const session = await getSessionFromToken(cookies[SESSION_COOKIE]);
  return session;
}

export async function getSessionFromCookies(store) {
  const token = store?.get?.(SESSION_COOKIE)?.value;
  return getSessionFromToken(token);
}

export async function requireWorkspaceFromRequest(request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    const error = new Error('Unauthorized');
    error.status = 401;
    throw error;
  }
  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: session.userId },
    include: { owner: true }
  });
  if (!workspace) {
    const error = new Error('Workspace not found');
    error.status = 404;
    throw error;
  }
  return { session, workspace };
}

export async function ensureDefaultPeople(workspaceId) {
  const defaults = ['Me', 'Vedant', 'Sachin'];
  for (const name of defaults) {
    const existing = await prisma.person.findFirst({ where: { workspaceId, name, archivedAt: null } });
    if (!existing) {
      await prisma.person.create({
        data: {
          workspaceId,
          name,
          isDefault: true
        }
      });
    }
  }
}
