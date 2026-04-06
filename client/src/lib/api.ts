const getBaseUrl = () => {
  if (import.meta.env.PROD) {
    // In production, always use the Render backend URL
    return 'https://smartposv4.onrender.com';
  } else {
    // In development, use the current origin which will be proxied by Vite
    return window.location.origin;
  }
};

const getHeaders = () => {
  const token = localStorage.getItem('smartpos_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const api = {
  async get(endpoint: string) {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async post(endpoint: string, body: any) {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();
      try {
        // Try to parse the error as JSON
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || 'An unknown error occurred');
      } catch (e) {
        // If it's not JSON, throw the raw text
        throw new Error(errorText || 'An unknown error occurred');
      }
    }
    return response.json();
  },

  async put(endpoint: string, body: any) {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || 'An unknown error occurred');
      } catch (e) {
        throw new Error(errorText || 'An unknown error occurred');
      }
    }
    return response.json();
  },

  async delete(endpoint: string) {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || 'An unknown error occurred');
      } catch (e) {
        throw new Error(errorText || 'An unknown error occurred');
      }
    }
    return response.json();
  },
};

export default api;
