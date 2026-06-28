import { FileText, Trash2, Upload, BarChart2, GitCompare, FileSearch } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'upload', label: 'Upload Document', icon: Upload },
  { id: 'chat', label: 'Research Chat', icon: FileSearch },
  { id: 'insights', label: 'Financial Insights', icon: BarChart2 },
  { id: 'compare', label: 'Compare Docs', icon: GitCompare },
]

export default function Sidebar({ documents, activeDoc, onSelectDoc, onDeleteDoc, activeNav, onNavChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">FR</div>
        <div>
          <div className="sidebar-logo-text">FinResearch</div>
          <div className="sidebar-logo-sub">AI · Research Terminal</div>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Navigation</div>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${activeNav === id ? 'active' : ''}`}
            onClick={() => onNavChange(id)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div className="divider" style={{ margin: '8px 0' }} />

      <div className="sidebar-section">
        <div className="sidebar-section-label">Documents ({documents.length})</div>
      </div>

      <div className="doc-list">
        {documents.length === 0 && (
          <div style={{ padding: '12px 18px', fontSize: 12, color: 'var(--text-muted)' }}>
            No documents uploaded yet.
          </div>
        )}
        {documents.map((doc) => (
          <div
            key={doc.doc_id}
            className={`doc-item ${activeDoc?.doc_id === doc.doc_id ? 'active' : ''}`}
            onClick={() => onSelectDoc(doc)}
          >
            <FileText size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
            <span className="doc-item-name" title={doc.filename}>{doc.filename}</span>
            <button
              className="doc-item-delete"
              onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.doc_id) }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
        <div className="ticker-label">POWERED BY GROQ · FAISS · RAG</div>
      </div>
    </aside>
  )
}
