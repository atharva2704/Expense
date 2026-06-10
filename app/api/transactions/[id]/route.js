import { apiError, json } from '../../../../lib/api';
import { requireWorkspaceFromRequest } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';
import { transactionSchema } from '../../../../lib/validators';
import { toPaise } from '../../../../lib/money';
import { createNotice } from '../../../../lib/notification';

export async function PATCH(request, context) {
  const { id } = await context.params;
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);
    const existing = await prisma.transaction.findUnique({ where: { id: id } });
    if (!existing || existing.workspaceId !== workspace.id || existing.deletedAt) return apiError('Not found', 404);

    const body = await request.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || 'Invalid request', 400);

    const person = await prisma.person.findFirst({
      where: { id: parsed.data.personId, workspaceId: workspace.id, archivedAt: null }
    });
    if (!person) return apiError('Person not found', 404);

    const amountPaise = toPaise(parsed.data.amount);
    if (amountPaise <= 0) return apiError('Amount must be greater than zero', 400);

    const isPending = parsed.data.type === 'EXPENSE' ? (parsed.data.isPending ?? !String(parsed.data.remarks || '').trim()) : false;

    const tx = await prisma.transaction.update({
      where: { id: id },
      data: {
        personId: person.id,
        type: parsed.data.type,
        amountPaise,
        itemPurpose: parsed.data.itemPurpose?.trim() || null,
        category: parsed.data.category?.trim() || null,
        remarks: parsed.data.remarks?.trim() || null,
        isPending,
        entryAt: parsed.data.entryAt ? new Date(parsed.data.entryAt) : existing.entryAt
      }
    });

    await createNotice({
      workspaceId: workspace.id,
      type: 'TRANSACTION_EDITED',
      title: 'Record updated',
      body: `Updated ${person.name}'s record.`,
      meta: { transactionId: tx.id, personId: person.id }
    });

    return json({ transaction: tx });
  } catch (error) {
    return apiError(error.message || 'Unable to update transaction', 500);
  }
}

export async function DELETE(request, context) {
  const { id } = await context.params;
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);
    const tx = await prisma.transaction.findUnique({ where: { id: id } });
    if (!tx || tx.workspaceId !== workspace.id || tx.deletedAt) return apiError('Not found', 404);

    await prisma.transaction.update({
      where: { id: id },
      data: { deletedAt: new Date() }
    });

    await createNotice({
      workspaceId: workspace.id,
      type: 'RECORD_DELETED',
      title: 'Record deleted',
      body: `Deleted a ${tx.type.toLowerCase()} record.`,
      meta: { transactionId: tx.id, personId: tx.personId }
    });

    return json({ ok: true });
  } catch (error) {
    return apiError(error.message || 'Unable to delete transaction', 500);
  }
}
