import { apiError } from '../../../lib/api';
import { requireWorkspaceFromRequest } from '../../../lib/auth';
import { prisma } from '../../../lib/db';
import { fromPaise } from '../../../lib/money';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { createNotice } from '../../../lib/notification';

function serializeRows(peopleMap, transactions, notifications, favorites) {
  const txRows = transactions.map((tx) => ({
    id: tx.id,
    person: peopleMap.get(tx.personId)?.name || 'Unknown',
    type: tx.type,
    amount: tx.amountPaise / 100,
    amountPaise: tx.amountPaise,
    itemPurpose: tx.itemPurpose || '',
    category: tx.category || '',
    remarks: tx.remarks || '',
    isPending: tx.isPending,
    entryAt: tx.entryAt.toISOString(),
    createdAt: tx.createdAt.toISOString()
  }));

  const peopleRows = [...peopleMap.values()].map((p) => ({
    id: p.id,
    name: p.name,
    isDefault: p.isDefault,
    archivedAt: p.archivedAt ? p.archivedAt.toISOString() : ''
  }));

  const notificationRows = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString()
  }));

  const favoriteRows = favorites.map((f) => ({
    id: f.id,
    label: f.label,
    category: f.category || '',
    amount: f.amountPaise ? f.amountPaise / 100 : '',
    amountPaise: f.amountPaise || '',
    createdAt: f.createdAt.toISOString()
  }));

  return { txRows, peopleRows, notificationRows, favoriteRows };
}

export async function GET(request) {
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'xlsx').toLowerCase();

    const [people, transactions, notifications, favorites] = await Promise.all([
      prisma.person.findMany({ where: { workspaceId: workspace.id } }),
      prisma.transaction.findMany({ where: { workspaceId: workspace.id, deletedAt: null }, orderBy: { entryAt: 'desc' } }),
      prisma.notification.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: 'desc' } }),
      prisma.favoriteItem.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: 'desc' } })
    ]);

    const peopleMap = new Map(people.map((p) => [p.id, p]));
    const rows = serializeRows(peopleMap, transactions, notifications, favorites);

    if (format === 'json') {
      const payload = JSON.stringify({
        exportedAt: new Date().toISOString(),
        workspace: { id: workspace.id, name: workspace.name },
        ...rows
      }, null, 2);

      await createNotice({
        workspaceId: workspace.id,
        type: 'EXPORT_COMPLETED',
        title: 'JSON export created',
        body: 'Your JSON backup is ready.',
        meta: { format }
      });

      return new Response(payload, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="expense-tracker-export.json"'
        }
      });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.txRows), 'Transactions');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.peopleRows), 'People');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.notificationRows), 'Notifications');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.favoriteRows), 'Favorites');

    let bookType = 'xlsx';
    let mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    let filename = 'expense-tracker-export.xlsx';

    if (format === 'csv') {
      const csv = Papa.unparse(rows.txRows);
      await createNotice({
        workspaceId: workspace.id,
        type: 'EXPORT_COMPLETED',
        title: 'CSV export created',
        body: 'Your CSV export is ready.',
        meta: { format }
      });
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="expense-tracker-export.csv"'
        }
      });
    }

    if (format === 'ods') {
      bookType = 'ods';
      mime = 'application/vnd.oasis.opendocument.spreadsheet';
      filename = 'expense-tracker-export.ods';
    }

    const buffer = XLSX.write(wb, { bookType, type: 'buffer' });

    await createNotice({
      workspaceId: workspace.id,
      type: 'EXPORT_COMPLETED',
      title: `${format.toUpperCase()} export created`,
      body: 'Your export is ready.',
      meta: { format }
    });

    return new Response(buffer, {
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    return apiError(error.message || 'Unable to export data', error.status || 500);
  }
}
