import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Send, FileText, Loader, BookOpen, TrendingUp } from 'lucide-react'
import { api } from '../utils/api'

const SUGGESTIONS = [
  'What are the key risk factors mentioned?',
  'Summarize the revenue growth story.',
  'What forward guidance did management provide?',
  'What are the main business segments?',
  'How did operating margins change year-over-year?',
  'What strategic acquisitions or investments were mentioned?',
]

function LoadingMessage() {
  return (
    <div className="message assistant">
      <div className="message-avatar">AI</div>
      <div className="message-bubble" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px' }}>
        <div className="loading-dots">
          <span /><span /><span />
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Analyzing document…</span>
      </div>
    </div>
  )
}

export default function ChatPage({ activeDoc, documents, toast }) {
  const [tab, setTab] = useState('chat')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Reset on doc change
  useEffect(() => {
    setMessages([])
    setAnalysisResult(null)
    setTab('chat')
  }, [activeDoc?.doc_id])

  async function sendMessage(text) {
    if (!activeDoc) { toast('Select a document first', 'error'); return }
    if (!text.trim()) return
    const q = text.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const data = await api.ask(activeDoc.doc_id, q)
      setMessages(prev => [...prev, { role: 'assistant', content: data.result }])
    } catch (e) {
      toast(e.message, 'error')
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}`, error: true }])
    } finally {
      setLoading(false)
    }
  }

  async function runAnalysis(type) {
    if (!activeDoc) { toast('Select a document first', 'error'); return }
    setAnalysisLoading(true)
    setAnalysisResult(null)
    try {
      let data
      if (type === 'summary') data = await api.summarize(activeDoc.doc_id)
      else if (type === 'memo') data = await api.memo(activeDoc.doc_id)
      else if (type === 'entities') data = await api.entities(activeDoc.doc_id)
      setAnalysisResult(data.result)
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const noDoc = !activeDoc

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tab bar */}
      <div className="tab-bar">
        {[
          { id: 'chat', label: 'Research Chat', icon: Send },
          { id: 'summary', label: 'Executive Summary', icon: BookOpen },
          { id: 'memo', label: 'Investment Memo', icon: TrendingUp },
          { id: 'entities', label: 'Entity Extraction', icon: FileText },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`tab-btn ${tab === id ? 'active' : ''}`}
            onClick={() => { setTab(id); if (id !== 'chat') runAnalysis(id) }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* No doc selected */}
      {noDoc && (
        <div className="empty-state">
          <div className="empty-icon"><FileText size={24} /></div>
          <div className="empty-title">No document selected</div>
          <div className="empty-sub">Upload a document and select it from the sidebar to start analyzing.</div>
        </div>
      )}

      {/* Chat tab */}
      {!noDoc && tab === 'chat' && (
        <>
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="empty-state" style={{ padding: '40px 32px' }}>
                <div className="empty-icon"><Send size={20} /></div>
                <div className="empty-title">Ask anything about {activeDoc.filename}</div>
                <div className="empty-sub">RAG-powered: retrieves relevant passages before generating the answer.</div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="message-avatar">{msg.role === 'user' ? 'YOU' : 'AI'}</div>
                <div className="message-bubble" style={msg.error ? { borderColor: 'rgba(239,68,68,0.3)' } : {}}>
                  {msg.role === 'assistant'
                    ? <ReactMarkdown>{msg.content}</ReactMarkdown>
                    : <span>{msg.content}</span>
                  }
                </div>
              </div>
            ))}
            {loading && <LoadingMessage />}
            <div ref={bottomRef} />
          </div>

          {messages.length === 0 && (
            <div className="suggestion-chips">
              {SUGGESTIONS.map(s => (
                <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
              ))}
            </div>
          )}

          <div className="chat-input-area">
            <textarea
              className="chat-input"
              rows={1}
              placeholder={`Ask about ${activeDoc.filename}…`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
            >
              {loading ? <div className="loading-spinner" style={{ width: 14, height: 14 }} /> : <Send size={14} />}
              Send
            </button>
          </div>
        </>
      )}

      {/* Analysis tabs */}
      {!noDoc && tab !== 'chat' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {analysisLoading && (
            <div className="empty-state">
              <div className="loading-spinner" style={{ width: 32, height: 32, borderWidth: 3, marginBottom: 16 }} />
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {tab === 'summary' ? 'Generating executive summary…'
                  : tab === 'memo' ? 'Writing investment memo…'
                  : 'Extracting entities…'}
              </div>
            </div>
          )}
          {analysisResult && (
            <div className="message assistant" style={{ maxWidth: 'none' }}>
              <div className="message-avatar">AI</div>
              <div className="message-bubble" style={{ flex: 1 }}>
                <ReactMarkdown>{analysisResult}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
