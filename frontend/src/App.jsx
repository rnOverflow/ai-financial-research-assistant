import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ToastContainer from './components/Toast'
import UploadPage from './pages/UploadPage'
import ChatPage from './pages/ChatPage'
import InsightsPage from './pages/InsightsPage'
import ComparePage from './pages/ComparePage'
import { useToast } from './hooks/useToast'
import { api } from './utils/api'

const TOPBAR_TITLES = {
  upload: 'Upload Document',
  chat: 'Research Chat',
  insights: 'Financial Insights',
  compare: 'Compare Documents',
}

export default function App() {
  const [nav, setNav] = useState('upload')
  const [documents, setDocuments] = useState([])
  const [activeDoc, setActiveDoc] = useState(null)
  const { toasts, toast } = useToast()

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await api.listDocuments()
      setDocuments(docs)
      // Auto-select first doc if none selected
      if (!activeDoc && docs.length > 0) {
        setActiveDoc(docs[0])
      }
    } catch (e) {
      // Backend not running yet — silent fail
    }
  }, [activeDoc])

  useEffect(() => { loadDocuments() }, [])

  const handleDelete = async (docId) => {
    try {
      await api.deleteDocument(docId)
      toast('Document deleted', 'success')
      setDocuments(prev => {
        const updated = prev.filter(d => d.doc_id !== docId)
        if (activeDoc?.doc_id === docId) {
          setActiveDoc(updated[0] || null)
        }
        return updated
      })
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const handleUploaded = () => {
    loadDocuments()
    setNav('chat')
  }

  return (
    <div className="app-shell">
      <Sidebar
        documents={documents}
        activeDoc={activeDoc}
        onSelectDoc={(doc) => { setActiveDoc(doc); setNav('chat') }}
        onDeleteDoc={handleDelete}
        activeNav={nav}
        onNavChange={setNav}
      />

      <div className="main">
        <div className="topbar">
          <div className="topbar-breadcrumb">
            <span>FinResearch</span>
            <span style={{ color: 'var(--border-strong)' }}>/</span>
            <span style={{ color: 'var(--text-primary)' }}>{TOPBAR_TITLES[nav]}</span>
            {activeDoc && nav !== 'upload' && nav !== 'compare' && (
              <>
                <span style={{ color: 'var(--border-strong)' }}>/</span>
                <span style={{ color: 'var(--accent)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeDoc.filename}
                </span>
              </>
            )}
          </div>
        </div>

        {nav === 'upload' && (
          <div className="content-area">
            <UploadPage onUploaded={handleUploaded} toast={toast} />
          </div>
        )}

        {nav === 'chat' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ChatPage activeDoc={activeDoc} documents={documents} toast={toast} />
          </div>
        )}

        {nav === 'insights' && (
          <div className="content-area">
            <InsightsPage activeDoc={activeDoc} toast={toast} />
          </div>
        )}

        {nav === 'compare' && (
          <div className="content-area">
            <ComparePage documents={documents} toast={toast} />
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  )
}
