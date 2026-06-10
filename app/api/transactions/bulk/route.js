import { apiError, json } from '../../../../lib/api';
import { requireWorkspaceFromRequest } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';
import { bulkSchema } from '../../../../lib/validators';
import { createNotice } from '../../../../lib/notification';
import { buildTransactionWhere } from '../../../../lib/service';

export async function POST(request) {
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);
    const body = await request.json();
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || 'Invalid request', 400);

    const { action, ids, filters = {} } = parsed.data;
    if (!ids.length && action !== 'deleteAll') return apiError('Select at least one record', 400);

    const scopedWhere = action === 'deleteAll'
      ? buildTransactionWhere(workspace.id, filters)
      : {
          workspaceId: workspace.id,
          deletedAt: null,
          ...(ids.length ? { id: { in: ids } } : {})
        };

    if (action === 'delete' || action === 'deleteAll') {
      const result = await prisma.transaction.updateMany({
        where: scopedWhere,
        data: { deletedAt: new Date() }
      });

      await createNotice({
        workspaceId: workspace.id,
        type: 'BULK_DELETE',
        title: 'Bulk delete completed',
        body: `${result.count} records deleted.`,
        meta: { count: result.count, ids }
      });

      return json({ ok: true, deleted: result.count });
    }

    if (action === 'moveToPayment') {
      const records = await prisma.transaction.findMany({
        where: { ...scopedWhere, type: 'EXPENSE' }
      });

      const updated = [];
      for (const tx of records) {
        updated.push(await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            type: 'PAYMENT',
            isPending: false,
            remarks: tx.remarks || 'Moved to payment received'
          }
        }));
      }

      await createNotice({
        workspaceId: workspace.id,
        type: 'PAYMENT_RECEIVED',
        title: 'Moved to payment received',
        body: `${updated.length} expense records were converted to payment received.`,
        meta: { ids, count: updated.length }
      });

      return json({ ok: true, moved: updated.length });
    }

    return apiError('Unsupported action', 400);
  } catch (error) {
    return apiError(error.message || 'Bulk action failed', 500);
  }
}
