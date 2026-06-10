import { apiError, json } from '../../../../lib/api';
import { requireWorkspaceFromRequest } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';
import { buildSummary } from '../../../../lib/summary';

export async function GET(request) {
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'month';

    const [people, transactions, categories] = await Promise.all([
      prisma.person.findMany({ where: { workspaceId: workspace.id, archivedAt: null } }),
      prisma.transaction.findMany({
        where: { workspaceId: workspace.id, deletedAt: null },
        orderBy: { entryAt: 'desc' }
      }),
      prisma.transaction.groupBy({
        by: ['category'],
        where: { workspaceId: workspace.id, deletedAt: null },
        _sum: { amountPaise: true }
      })
    ]);

    const peopleMap = new Map(people.map((p) => [p.id, p]));
    const summary = buildSummary(transactions, peopleMap);

    const perPerson = people.map((person) => {
      const personTx = transactions.filter((tx) => tx.personId === person.id);
      const expense = personTx.filter((tx) => tx.type === 'EXPENSE').reduce((a, t) => a + t.amountPaise, 0);
      const payment = personTx.filter((tx) => tx.type === 'PAYMENT').reduce((a, t) => a + t.amountPaise, 0);
      return {
        id: person.id,
        name: person.name,
        expensePaise: expense,
        paymentPaise: payment,
        pendingPaise: Math.max(expense - payment, 0)
      };
    }).sort((a, b) => b.pendingPaise - a.pendingPaise);

    const perCategory = categories
      .filter((row) => row.category)
      .map((row) => ({
        category: row.category,
        amountPaise: row._sum.amountPaise || 0
      }))
      .sort((a, b) => b.amountPaise - a.amountPaise);

    return json({
      mode,
      totals: summary.totals,
      balances: summary.balances,
      perPerson,
      perCategory
    });
  } catch (error) {
    return apiError(error.message || 'Unable to load report', error.status || 500);
  }
}
