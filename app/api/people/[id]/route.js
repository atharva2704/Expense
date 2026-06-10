import { apiError, json } from '../../../../lib/api';
import { requireWorkspaceFromRequest } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';
import { personSchema } from '../../../../lib/validators';
import { createNotice } from '../../../../lib/notification';

export async function PATCH(request, context) {
  const { id } = await context.params;
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);
    const body = await request.json();
    const parsed = personSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || 'Invalid request', 400);

    const existing = await prisma.person.findUnique({ where: { id: id } });
    if (!existing || existing.workspaceId !== workspace.id) return apiError('Forbidden', 403);

    const person = await prisma.person.update({
      where: { id: id },
      data: { name: parsed.data.name.trim() }
    });

    await createNotice({
      workspaceId: workspace.id,
      type: 'PERSON_EDITED',
      title: 'Person edited',
      body: `Person renamed to ${person.name}.`,
      meta: { personId: person.id }
    });

    return json({ person });
  } catch (error) {
    return apiError(error.message || 'Unable to update person', 500);
  }
}

export async function DELETE(request, context) {
  const { id } = await context.params;
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);
    const person = await prisma.person.findUnique({ where: { id: id } });
    if (!person || person.workspaceId !== workspace.id) return apiError('Not found', 404);

    await prisma.person.update({
      where: { id: id },
      data: { archivedAt: new Date() }
    });

    await createNotice({
      workspaceId: workspace.id,
      type: 'PERSON_DELETED',
      title: 'Person archived',
      body: `${person.name} was archived. Existing history is preserved.`,
      meta: { personId: person.id }
    });

    return json({ ok: true });
  } catch (error) {
    return apiError(error.message || 'Unable to delete person', 500);
  }
}
