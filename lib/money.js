export function toPaise(value) {
  if (value === null || value === undefined) return 0;
  const raw = String(value).replace(/[^0-9.-]/g, '').trim();
  if (!raw) return 0;
  const num = Number(raw);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

export function fromPaise(paise, locale = 'en-IN') {
  const amount = Number(paise || 0) / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

export function compactCurrency(paise) {
  return fromPaise(paise).replace(/^₹\s*/, '₹');
}

export function sumPaise(items, field = 'amountPaise') {
  return items.reduce((acc, item) => acc + Number(item?.[field] || 0), 0);
}
