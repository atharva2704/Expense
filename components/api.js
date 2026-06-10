export async function api(path, { method = 'GET', body, headers = {}, isForm = false } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: isForm ? headers : { 'Content-Type': 'application/json', ...headers },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = data?.error || data?.message || text || 'Request failed';
    throw new Error(message);
  }
  return data;
}
