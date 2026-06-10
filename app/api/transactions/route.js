import { apiError, json } from '../../../lib/api';
import { requireWorkspaceFromRequest } from '../../../lib/auth';
import { prisma } from '../../../lib/db';
import { transactionSchema } from '../../../lib/validators';
import { toPaise } from '../../../lib/money';
import { createNotice } from '../../../lib/notification';
import { buildTransactionWhere, serializeTransaction } from '../../../lib/service';
import { getBalanceMap } from '../../../lib/transaction-utils';

export async function GET(request) {
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);
    const { searchParams } = new URL(request.url);
    const filters = {
      q: searchParams.get('q') || '',
      personId: searchParams.get('personId') || '',
      category: searchParams.get('category') || '',
      status: searchParams.get('status') || 'all',
      type: searchParams.get('type') || 'all',
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || ''
    };

    const [people, allTransactions] = await Promise.all([
      prisma.person.findMany({ where: { workspaceId: workspace.id, archivedAt: null } }),
      prisma.transaction.findMany({
        where: { workspaceId: workspace.id, deletedAt: null },
        orderBy: { entryAt: 'desc' }
      })
    ]);

    const peopleMap = new Map(people.map((p) => [p.id, p]));
    const where = buildTransactionWhere(workspace.id, filters);
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { entryAt: 'desc' },
      take: Math.min(Number(searchParams.get('limit') || 1000), 5000)
    });

    const balanceMap = getBalanceMap(allTransactions);
    const balances = people.map((person) => ({
      id: person.id,
      name: person.name,
      balancePaise: balanceMap.get(person.id) || 0,
      pendingPaise: Math.max(balanceMap.get(person.id) || 0, 0),
      paidPaise: Math.max(-(balanceMap.get(person.id) || 0), 0)
    })).sort((a, b) => b.pendingPaise - a.pendingPaise);

    return json({
      transactions: transactions.map((tx) => serializeTransaction(tx, peopleMap)),
      balances
    });
  } catch (error) {
    return apiError(error.message || 'Unable to load transactions', error.status || 500);
  }
}

export async function POST(request) {
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);
    const body = await request.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || 'Invalid request', 400);

    const person = await prisma.person.findFirst({
      where: { id: parsed.data.personId, workspaceId: workspace.id, archivedAt: null }
    });
    if (!person) return apiError('Person not found', 404);

    const amountPaise = toPaise(parsed.data.amount);
    if (amountPaise <= 0) return apiError('Amount must be greater than zero', 400);

    const entryAt = parsed.data.entryAt ? new Date(parsed.data.entryAt) : new Date();
    const isPending = parsed.data.type === 'EXPENSE' ? (parsed.data.isPending ?? !String(parsed.data.remarks || '').trim()) : false;

    const currentTransactions = await prisma.transaction.findMany({
      where: { workspaceId: workspace.id, deletedAt: null },
      orderBy: { entryAt: 'desc' }
    });
    const beforeBalanceMap = getBalanceMap(currentTransactions);
    const balanceBefore = beforeBalanceMap.get(person.id) || 0;

    const tx = await prisma.transaction.create({
      data: {
        workspaceId: workspace.id,
        personId: person.id,
        type: parsed.data.type,
        amountPaise,
        itemPurpose: parsed.data.itemPurpose?.trim() || null,
        category: parsed.data.category?.trim() || null,
        remarks: parsed.data.remarks?.trim() || null,
        isPending,
        entryAt
      }
    });

    const afterTransactions = [tx, ...currentTransactions];
    const balanceMap = getBalanceMap(afterTransactions);
    const balanceAfter = balanceMap.get(person.id) || 0;

    await createNotice({
      workspaceId: workspace.id,
      type: parsed.data.type === 'PAYMENT' ? 'PAYMENT_RECEIVED' : 'PENDING_ADDED',
      title: parsed.data.type === 'PAYMENT'
        ? `Payment received from ${person.name}`
        : `Pending added for ${person.name}`,
      body: `${person.name} • ₹${(amountPaise / 100).toFixed(2)}`,
      meta: { transactionId: tx.id, personId: person.id, balanceBefore, balanceAfter }
    });

    return json({
      transaction: serializeTransaction(tx, new Map([[person.id, person]])),
      balanceAfter,
      balanceBefore
    });
  } catch (error) {
    return apiError(error.message || 'Unable to create transaction', 500);
  }
}
