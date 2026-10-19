const API_URL = import.meta.env.VITE_API_URL || 'https://api-albergue-mvp.onrender.com'

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload.message || 'Error en la solicitud'
    throw new Error(message)
  }

  return payload
}

export function getAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  }
}

export { API_URL, apiRequest }
