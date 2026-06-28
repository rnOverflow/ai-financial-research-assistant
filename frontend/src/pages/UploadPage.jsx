import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { api } from '../utils/api'

export default function UploadPage({ onUploaded, toast }) {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFile = useCallback(async (file) => {
    if (!file) return
    setUploading(true)
    setResult(null)
    setError(null)
    try {
      const data = await api.upload(file)
      setResult(data)
      toast(`"${data.filename}" processed — ${data.chunk_count} chunks indexed`, 'success')
      onUploaded()
    } catch (e) {
      setError(e.message)
      toast(e.message, 'error')
    } finally {
      setUploading(false)
    }
  }, [onUploaded, toast])

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) handleFile(accepted[0])
  }, [handleFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: uploading,
  })

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Upload Financial Document</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Upload 10-K reports, earnings transcripts, or financial news articles (PDF only)
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="upload-icon">
          {uploading
            ? <div className="loading-spinner" />
            : <Upload size={24} />
          }
        </div>
        <div className="upload-title">
          {isDragActive ? 'Drop it here' : uploading ? 'Processing document…' : 'Drop PDF here or click to browse'}
        </div>
        <div className="upload-sub">
          {uploading
            ? 'Extracting text, chunking, and building vector index…'
            : 'Supports annual reports (10-K/10-Q), earnings calls, financial news'
          }
        </div>
      </div>

      {uploading && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Building FAISS index…</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '70%', animation: 'none' }} />
          </div>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 20, background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CheckCircle size={16} color="var(--green)" />
            <span style={{ fontWeight: 600, color: 'var(--green)', fontSize: 13 }}>Document ready for analysis</span>
          </div>
          <div className="stats-bar" style={{ margin: 0 }}>
            <div className="stat-item">
              <div className="stat-label">File</div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.filename}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Chunks</div>
              <div className="stat-value accent">{result.chunk_count}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Characters</div>
              <div className="stat-value">{(result.char_count / 1000).toFixed(0)}K</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 20, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={16} color="var(--red)" />
          <span style={{ color: 'var(--red)', fontSize: 13 }}>{error}</span>
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <div className="sidebar-section-label" style={{ marginBottom: 12, fontSize: 10 }}>WHAT YOU CAN DO AFTER UPLOAD</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['Research Chat', 'Ask any question about the document using RAG'],
            ['Financial Insights', 'Auto-extract risks, guidance, and key metrics'],
            ['Investment Memo', 'Generate a buy/hold/sell analyst note'],
            ['Compare Docs', 'Side-by-side analysis of two reports'],
          ].map(([title, desc]) => (
            <div key={title} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
