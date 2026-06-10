import { apiError, json } from '../../../lib/api';
import { requireWorkspaceFromRequest } from '../../../lib/auth';
import { prisma } from '../../../lib/db';
import { personSchema } from '../../../lib/validators';
import { createNotice } from '../../../lib/notification';

export async function GET(request) {
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);
    const people = await prisma.person.findMany({
      where: { workspaceId: workspace.id },
      orderBy: [{ archivedAt: 'asc' }, { isDefault: 'desc' }, { name: 'asc' }]
    });
    return json({ people });
  } catch (error) {
    return apiError(error.message || 'Unauthorized', error.status || 500);
  }
}

export async function POST(request) {
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);
    const body = await request.json();
    const parsed = personSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || 'Invalid request', 400);

    const person = await prisma.person.create({
      data: {
        workspaceId: workspace.id,
        name: parsed.data.name.trim()
      }
    });

    await createNotice({
      workspaceId: workspace.id,
      type: 'PERSON_ADDED',
      title: 'Person added',
      body: `${person.name} added to the workspace.`,
      meta: { personId: person.id }
    });

    return json({ person });
  } catch (error) {
    return apiError(error.message || 'Unable to create person', 500);
  }
}
