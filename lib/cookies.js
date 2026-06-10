export const SESSION_COOKIE = 'expense_tracker_session';

export function parseCookieHeader(cookieHeader = '') {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey) continue;
    out[rawKey] = decodeURIComponent(rest.join('=') || '');
  }
  return out;
}
