import { json, apiError } from '../../../lib/api';
import { requireWorkspaceFromRequest } from '../../../lib/auth';
import { getWorkspaceSnapshot } from '../../../lib/service';

export async function GET(request) {
  try {
    const { workspace, session } = await requireWorkspaceFromRequest(request);
    const snapshot = await getWorkspaceSnapshot(workspace.id);
    return json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      },
      workspace: {
        id: workspace.id,
        name: workspace.name
      },
      ...snapshot
    });
  } catch (error) {
    return apiError(error.message || 'Unauthorized', error.status || 500);
  }
}
