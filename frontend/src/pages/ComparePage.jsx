import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { GitCompare, ArrowRight } from 'lucide-react'
import { api } from '../utils/api'

const COMPARE_SUGGESTIONS = [
  'Compare revenue growth and profitability',
  'How do the risk profiles differ?',
  'Compare management guidance and outlook',
  'Which company has stronger margins?',
  'Compare capital allocation strategies',
]

export default function ComparePage({ documents, toast }) {
  const [doc1, setDoc1] = useState('')
  const [doc2, setDoc2] = useState('')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function runCompare(q) {
    const queryText = q || query
    if (!doc1 || !doc2) { toast('Select two documents to compare', 'error'); return }
    if (doc1 === doc2) { toast('Select two different documents', 'error'); return }
    if (!queryText.trim()) { toast('Enter a comparison query', 'error'); return }

    setLoading(true)
    setResult(null)
    try {
      const data = await api.compare(doc1, doc2, queryText)
      setResult(data.result)
      if (!q) {} // keep query as-is
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (documents.length < 2) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><GitCompare size={24} /></div>
        <div className="empty-title">Upload at least 2 documents</div>
        <div className="empty-sub">Upload two financial reports to perform side-by-side AI comparison analysis.</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Document Comparison</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>AI-powered side-by-side analysis of two financial documents</p>
      </div>

      {/* Doc selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: 6 }}>Document 1</div>
          <select className="select" style={{ width: '100%' }} value={doc1} onChange={e => setDoc1(e.target.value)}>
            <option value="">Select document…</option>
            {documents.map(d => (
              <option key={d.doc_id} value={d.doc_id}>{d.filename}</option>
            ))}
          </select>
        </div>
        <div style={{ color: 'var(--text-muted)', marginTop: 18 }}>
          <ArrowRight size={16} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: 6 }}>Document 2</div>
          <select className="select" style={{ width: '100%' }} value={doc2} onChange={e => setDoc2(e.target.value)}>
            <option value="">Select document…</option>
            {documents.map(d => (
              <option key={d.doc_id} value={d.doc_id}>{d.filename}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Query input */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <input
          className="input"
          style={{ flex: 1 }}
          placeholder="What do you want to compare? e.g. 'Compare revenue growth and margins'"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') runCompare() }}
        />
        <button className="btn btn-primary" onClick={() => runCompare()} disabled={loading || !doc1 || !doc2}>
          {loading ? <div className="loading-spinner" style={{ width: 14, height: 14 }} /> : <GitCompare size={14} />}
          Compare
        </button>
      </div>

      {/* Suggestions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
        {COMPARE_SUGGESTIONS.map(s => (
          <button key={s} className="suggestion-chip" onClick={() => { setQuery(s); runCompare(s) }}>{s}</button>
        ))}
      </div>

      {/* Result */}
      {loading && (
        <div className="empty-state">
          <div className="loading-spinner" style={{ width: 32, height: 32, borderWidth: 3, marginBottom: 16 }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Running comparative analysis…</div>
        </div>
      )}

      {result && (
        <div className="message assistant" style={{ maxWidth: 'none' }}>
          <div className="message-avatar">AI</div>
          <div className="message-bubble" style={{ flex: 1 }}>
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
