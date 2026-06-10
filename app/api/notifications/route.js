import { apiError, json } from '../../../lib/api';
import { requireWorkspaceFromRequest } from '../../../lib/auth';
import { prisma } from '../../../lib/db';

export async function GET(request) {
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const unreadOnly = searchParams.get('unreadOnly') === '1';

    const where = {
      workspaceId: workspace.id,
      ...(type !== 'all' ? { type } : {}),
      ...(unreadOnly ? { isRead: false } : {}),
      ...(q ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { body: { contains: q, mode: 'insensitive' } }
        ]
      } : {})
    };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    const unreadCount = await prisma.notification.count({
      where: { workspaceId: workspace.id, isRead: false }
    });
    return json({ notifications, unreadCount });
  } catch (error) {
    return apiError(error.message || 'Unable to load notifications', error.status || 500);
  }
}

export async function DELETE(request) {
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);
    const body = await request.json().catch(() => ({}));
    if (body?.all) {
      const result = await prisma.notification.deleteMany({ where: { workspaceId: workspace.id } });
      return json({ ok: true, deleted: result.count });
    }
    if (Array.isArray(body.ids) && body.ids.length) {
      const result = await prisma.notification.deleteMany({
        where: { workspaceId: workspace.id, id: { in: body.ids } }
      });
      return json({ ok: true, deleted: result.count });
    }
    return apiError('Nothing to delete', 400);
  } catch (error) {
    return apiError(error.message || 'Unable to delete notifications', 500);
  }
}
