const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Documents
  upload: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return request('/upload', { method: 'POST', body: fd })
  },
  listDocuments: () => request('/documents'),
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),

  // Analysis
  ask: (doc_id, question) =>
    request('/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_id, question }),
    }),
  summarize: (doc_id) => request(`/summarize/${doc_id}`),
  insights: (doc_id) => request(`/insights/${doc_id}`),
  memo: (doc_id) => request(`/memo/${doc_id}`),
  entities: (doc_id) => request(`/entities/${doc_id}`),

  // Compare
  compare: (doc_id_1, doc_id_2, query) =>
    request('/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_id_1, doc_id_2, query }),
    }),

  health: () => request('/health'),
}
