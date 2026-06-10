import { apiError, json } from '../../../../lib/api';
import { requireWorkspaceFromRequest } from '../../../../lib/auth';

export async function GET(request) {
  try {
    const { session, workspace } = await requireWorkspaceFromRequest(request);
    return json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      },
      workspace: {
        id: workspace.id,
        name: workspace.name
      }
    });
  } catch (error) {
    return apiError(error.message || 'Unauthorized', error.status || 500);
  }
}
