export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
  };

  // Only add Content-Type if we're sending JSON data and it wasn't provided
  if (options?.body && typeof options.body === 'string' && !options.headers) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let message = 'An API error occurred';
    if (data && data.detail) {
      if (Array.isArray(data.detail)) {
        // FastAPI validation errors
        message = data.detail.map((err: any) => `${err.loc.join('.')} - ${err.msg}`).join(', ');
      } else if (typeof data.detail === 'string') {
        message = data.detail;
      } else {
        message = JSON.stringify(data.detail);
      }
    }
    throw new Error(message);
  }

  return data as T;
}
