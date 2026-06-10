import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear, isAfter, isBefore } from 'date-fns';

export function toRange(date, range) {
  if (range === 'today') return { start: startOfDay(date), end: endOfDay(date) };
  if (range === 'week') return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
  if (range === 'month') return { start: startOfMonth(date), end: endOfMonth(date) };
  if (range === 'year') return { start: startOfYear(date), end: endOfYear(date) };
  return null;
}

export function inRange(date, range) {
  if (!range) return true;
  const d = new Date(date);
  return (!range.start || !isBefore(d, range.start)) && (!range.end || !isAfter(d, range.end));
}

export function buildSummary(transactions, peopleMap = new Map()) {
  const totals = {
    expenseTotal: 0,
    paymentTotal: 0,
    netPendingTotal: 0,
    todayExpense: 0,
    todayPayment: 0,
    weeklyExpense: 0,
    weeklyPayment: 0,
    monthlyExpense: 0,
    monthlyPayment: 0,
    overallTotal: 0
  };

  const personBalances = new Map();

  const now = new Date();
  const ranges = {
    today: toRange(now, 'today'),
    week: toRange(now, 'week'),
    month: toRange(now, 'month')
  };

  for (const tx of transactions) {
    const amount = Number(tx.amountPaise || 0);
    const key = tx.personId;
    const current = personBalances.get(key) || 0;
    const delta = tx.type === 'EXPENSE' ? amount : -amount;
    personBalances.set(key, current + delta);

    totals.overallTotal += amount;
    if (tx.type === 'EXPENSE') totals.expenseTotal += amount;
    if (tx.type === 'PAYMENT') totals.paymentTotal += amount;

    for (const [name, range] of Object.entries(ranges)) {
      if (inRange(tx.entryAt, range)) {
        if (tx.type === 'EXPENSE') totals[`${name}Expense`] += amount;
        if (tx.type === 'PAYMENT') totals[`${name}Payment`] += amount;
      }
    }
  }

  let pending = 0;
  const balances = [];
  for (const [personId, balance] of personBalances.entries()) {
    const person = peopleMap.get(personId);
    const pendingBalance = Math.max(balance, 0);
    pending += pendingBalance;
    balances.push({
      personId,
      personName: person?.name || 'Unknown',
      balancePaise: balance,
      pendingPaise: pendingBalance,
      paidPaise: Math.max(-balance, 0)
    });
  }

  balances.sort((a, b) => b.pendingPaise - a.pendingPaise);

  totals.netPendingTotal = pending;

  return { totals, balances };
}

export function enrichTransaction(tx, peopleMap) {
  const person = peopleMap.get(tx.personId);
  return {
    ...tx,
    personName: person?.name || 'Unknown',
    amount: Number(tx.amountPaise || 0) / 100
  };
}
