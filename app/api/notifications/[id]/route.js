import { apiError, json } from '../../../../lib/api';
import { requireWorkspaceFromRequest } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';

export async function PATCH(request, context) {
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);

    const { id } = await context.params;

    if (!id) {
      return apiError('Notification ID missing', 400);
    }

    const note = await prisma.notification.findUnique({
      where: { id }
    });

    if (!note || note.workspaceId !== workspace.id) {
      return apiError('Not found', 404);
    }

    const body = await request.json().catch(() => ({}));

    const nextRead =
      typeof body.isRead === 'boolean'
        ? body.isRead
        : !note.isRead;

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: nextRead
      }
    });

    return json({
      notification: updated
    });
  } catch (error) {
    return apiError(
      error.message || 'Unable to update notification',
      500
    );
  }
}

export async function DELETE(request, context) {
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);

    const { id } = await context.params;

    if (!id) {
      return apiError('Notification ID missing', 400);
    }

    const note = await prisma.notification.findUnique({
      where: { id }
    });

    if (!note || note.workspaceId !== workspace.id) {
      return apiError('Not found', 404);
    }

    await prisma.notification.delete({
      where: { id }
    });

    return json({ ok: true });
  } catch (error) {
    return apiError(
      error.message || 'Unable to delete notification',
      500
    );
  }
}