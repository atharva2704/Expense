import { prisma } from './db';
import { createNotice } from './notification';

export async function assertTransactionBelongsToWorkspace(transactionId, workspaceId) {
  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!tx || tx.workspaceId !== workspaceId) return null;
  return tx;
}

export async function updateBalanceNotification(workspaceId, personName, balanceBefore, balanceAfter, amountPaise, type) {
  if (type === 'PAYMENT') {
    await createNotice({
      workspaceId,
      type: 'PAYMENT_RECEIVED',
      title: `Payment ₹${(amountPaise / 100).toFixed(2)} received`,
      body: `Payment received from ${personName}.`,
      meta: { personName, amountPaise, balanceBefore, balanceAfter }
    });
    if (balanceAfter <= 0 && balanceBefore > 0) {
      await createNotice({
        workspaceId,
        type: 'BALANCE_CLEARED',
        title: `${personName} balance cleared`,
        body: `${personName} has no pending balance now.`,
        meta: { personName, balanceBefore, balanceAfter }
      });
    } else {
      await createNotice({
        workspaceId,
        type: 'BALANCE_REDUCED',
        title: `${personName} pending reduced`,
        body: `${personName} pending reduced by ₹${(amountPaise / 100).toFixed(2)}.`,
        meta: { personName, amountPaise, balanceBefore, balanceAfter }
      });
    }
  } else if (type === 'EXPENSE') {
    await createNotice({
      workspaceId,
      type: 'PENDING_ADDED',
      title: 'Pending added',
      body: `${personName} pending increased by ₹${(amountPaise / 100).toFixed(2)}.`,
      meta: { personName, amountPaise, balanceBefore, balanceAfter }
    });
  }
}

export function getBalanceMap(transactions) {
  const map = new Map();
  for (const tx of transactions) {
    const prev = map.get(tx.personId) || 0;
    map.set(tx.personId, prev + (tx.type === 'EXPENSE' ? tx.amountPaise : -tx.amountPaise));
  }
  return map;
}
