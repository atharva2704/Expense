import { prisma } from './db';

export async function createNotice({ workspaceId, type, title, body, meta = null }) {
  return prisma.notification.create({
    data: {
      workspaceId,
      type,
      title,
      body,
      meta
    }
  });
}

export async function bumpNotice(workspaceId, type, title, body, meta) {
  return createNotice({ workspaceId, type, title, body, meta });
}
