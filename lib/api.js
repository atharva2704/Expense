import { NextResponse } from 'next/server';

export function json(data, init = {}) {
  return NextResponse.json(data, init);
}

export function apiError(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function parseJsonSafe(value) {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value ?? null;
}
