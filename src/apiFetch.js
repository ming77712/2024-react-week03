export const apiFetch = async (url, method, isAdmin, body = null) => {
  const token = document.cookie
    .replace(/(?:(?:^|.*;\s*)hexToken\s*=\s*([^;]*).*$)|^.*$/, '$1')
    .trim();

  if (!token && isAdmin) return;

  const headers = new Headers({ 'Content-Type': 'application/json' });

  if (isAdmin) headers.append('Authorization', token);

  const options = {
    method,
    headers,
  };

  if (body) options.body = body;

  try {
    const response = await fetch(url, options);

    if (!response.ok) throw new Error('Failed to fetch');

    return await response.json();
  } catch (error) {
    console.error(error.response.data.message);
  }
};
