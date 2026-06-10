import { apiError, json } from '../../../lib/api';
import { requireWorkspaceFromRequest } from '../../../lib/auth';
import { prisma } from '../../../lib/db';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { createNotice } from '../../../lib/notification';
import { toPaise } from '../../../lib/money';

async function importRows(workspaceId, rows, mode = 'merge') {
  if (mode === 'replace') {
    await prisma.transaction.updateMany({ where: { workspaceId }, data: { deletedAt: new Date() } });
  }

  const people = await prisma.person.findMany({ where: { workspaceId } });
  const personByName = new Map(people.map((p) => [p.name.toLowerCase(), p]));
  const now = new Date();

  for (const row of rows) {
    const name = String(row.person || row.name || row.personName || '').trim();
    if (!name) continue;

    let person = personByName.get(name.toLowerCase());
    if (!person) {
      person = await prisma.person.create({
        data: { workspaceId, name, isDefault: false }
      });
      personByName.set(name.toLowerCase(), person);
    }

    const type = String(row.type || row.entryType || 'EXPENSE').toUpperCase() === 'PAYMENT' ? 'PAYMENT' : 'EXPENSE';
    const amountPaise = Number(row.amountPaise || toPaise(row.amount || row.value || 0));
    if (!amountPaise) continue;

    await prisma.transaction.create({
      data: {
        workspaceId,
        personId: person.id,
        type,
        amountPaise,
        itemPurpose: row.itemPurpose || row.item || row.purpose || null,
        category: row.category || null,
        remarks: row.remarks || null,
        isPending: type === 'EXPENSE' ? String(row.isPending || 'true') !== 'false' : false,
        entryAt: row.entryAt ? new Date(row.entryAt) : now
      }
    });
  }
}

export async function POST(request) {
  try {
    const { workspace } = await requireWorkspaceFromRequest(request);
    const form = await request.formData();
    const file = form.get('file');
    const mode = form.get('mode') || 'merge';
    if (!file || typeof file.arrayBuffer !== 'function') return apiError('File is required', 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = String(file.name || '').toLowerCase();
    let rows = [];

    if (name.endsWith('.json')) {
      const parsed = JSON.parse(buffer.toString('utf-8'));
      rows = parsed.txRows || parsed.transactions || parsed.rows || [];
    } else if (name.endsWith('.csv')) {
      const parsed = Papa.parse(buffer.toString('utf-8'), { header: true, skipEmptyLines: true });
      rows = parsed.data || [];
    } else if (name.endsWith('.xlsx') || name.endsWith('.ods') || name.endsWith('.xls')) {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const sheet = wb.SheetNames[0];
      rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
    } else {
      return apiError('Unsupported file format', 400);
    }

    await importRows(workspace.id, rows, mode);

    await createNotice({
      workspaceId: workspace.id,
      type: 'IMPORT_COMPLETED',
      title: 'Import completed',
      body: `Imported ${rows.length} rows.`,
      meta: { rows: rows.length, mode }
    });

    return json({ ok: true, rows: rows.length });
  } catch (error) {
    return apiError(error.message || 'Unable to import data', error.status || 500);
  }
}
