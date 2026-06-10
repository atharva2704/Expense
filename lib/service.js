import { prisma } from './db';
import { fromPaise, toPaise } from './money';
import { buildSummary } from './summary';

export function normalizeFilters(searchParams) {
  return {
    q: searchParams.get('q') || '',
    personId: searchParams.get('personId') || '',
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || 'all',
    type: searchParams.get('type') || 'all',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    unreadOnly: searchParams.get('unreadOnly') === '1',
    limit: Number(searchParams.get('limit') || 100)
  };
}

export function buildTransactionWhere(workspaceId, filters = {}) {
  const where = {
    workspaceId,
    deletedAt: null
  };

  if (filters.personId) where.personId = filters.personId;
  if (filters.category) where.category = filters.category;
  if (filters.type && filters.type !== 'all') where.type = filters.type;
  if (filters.status === 'pending') where.isPending = true;
  if (filters.status === 'paid') where.isPending = false;
  if (filters.from || filters.to) {
    where.entryAt = {};
    if (filters.from) where.entryAt.gte = new Date(filters.from);
    if (filters.to) {
      const to = new Date(filters.to);
      to.setHours(23, 59, 59, 999);
      where.entryAt.lte = to;
    }
  }
  if (filters.q) {
    where.OR = [
      { itemPurpose: { contains: filters.q, mode: 'insensitive' } },
      { category: { contains: filters.q, mode: 'insensitive' } },
      { remarks: { contains: filters.q, mode: 'insensitive' } },
      { person: { name: { contains: filters.q, mode: 'insensitive' } } },
      { amountPaise: { equals: toPaise(filters.q) } }
    ];
  }
  return where;
}

export function serializeTransaction(tx, peopleMap) {
  const personName = peopleMap.get(tx.personId)?.name || 'Unknown';
  return {
    id: tx.id,
    workspaceId: tx.workspaceId,
    personId: tx.personId,
    personName,
    type: tx.type,
    amountPaise: tx.amountPaise,
    amount: tx.amountPaise / 100,
    itemPurpose: tx.itemPurpose || '',
    category: tx.category || '',
    remarks: tx.remarks || '',
    isPending: tx.isPending,
    entryAt: tx.entryAt,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt
  };
}

export async function getWorkspaceSnapshot(workspaceId) {
  const [people, transactions, unreadCount, favorites, notifications] = await Promise.all([
    prisma.person.findMany({
      where: { workspaceId, archivedAt: null },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
    }),
    prisma.transaction.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { entryAt: 'desc' }
    }),
    prisma.notification.count({
      where: { workspaceId, isRead: false }
    }),
    prisma.favoriteItem.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.notification.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
  ]);

  const peopleMap = new Map(people.map((p) => [p.id, p]));
  const balanceMap = new Map();

  for (const tx of transactions) {
    const prev = balanceMap.get(tx.personId) || 0;
    balanceMap.set(tx.personId, prev + (tx.type === 'EXPENSE' ? tx.amountPaise : -tx.amountPaise));
  }

  const personBalances = people.map((person) => {
    const balancePaise = balanceMap.get(person.id) || 0;
    return {
      id: person.id,
      name: person.name,
      isDefault: person.isDefault,
      balancePaise,
      pendingPaise: Math.max(balancePaise, 0),
      paidPaise: Math.max(-balancePaise, 0)
    };
  });

  const summary = buildSummary(transactions, peopleMap);

  return {
    people,
    personBalances,
    transactions,
    recentTransactions: transactions.slice(0, 20).map((tx) => serializeTransaction(tx, peopleMap)),
    unreadCount,
    favorites,
    notifications,
    summary
  };
}

export async function seedWorkspaceDefaults(workspaceId) {
  const defaults = [
    { name: 'Me', isDefault: true },
    { name: 'Vedant', isDefault: true },
    { name: 'Sachin', isDefault: true }
  ];

  for (const person of defaults) {
    const existing = await prisma.person.findFirst({
      where: { workspaceId, name: person.name, archivedAt: null }
    });
    if (!existing) {
      await prisma.person.create({ data: { workspaceId, ...person } });
    }
  }

  const me = await prisma.person.findFirst({ where: { workspaceId, name: 'Me', archivedAt: null } });

  const quickItems = [
    { label: 'Tea', category: 'Food', amountPaise: 1500 },
    { label: 'Samosa', category: 'Food', amountPaise: 2000 },
    { label: 'Kachori', category: 'Food', amountPaise: 2500 },
    { label: 'Lunch', category: 'Food', amountPaise: 8000 },
    { label: 'Dinner', category: 'Food', amountPaise: 10000 }
  ];
  for (const item of quickItems) {
    const exists = await prisma.favoriteItem.findFirst({ where: { workspaceId, label: item.label } });
    if (!exists) {
      await prisma.favoriteItem.create({
        data: {
          workspaceId,
          ...item
        }
      });
    }
  }

  return me;
}
