export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/+$/, '');

export const apiUrl = (path) => `${API_BASE_URL}${path}`;

const toAuthHeader = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

export async function apiFetch(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(apiUrl(path), {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...toAuthHeader(token),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data && data.error) || 'Request failed');
  }
  return data;
}
