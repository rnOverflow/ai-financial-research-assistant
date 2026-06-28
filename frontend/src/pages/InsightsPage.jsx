import { useState, useEffect } from 'react'
import { Shield, TrendingUp, BarChart2, Activity, FileText } from 'lucide-react'
import { api } from '../utils/api'

function SentimentMeter({ sentiment }) {
  if (!sentiment) return null
  const { label, score, positive_signals, negative_signals } = sentiment
  const pct = Math.round(((score + 1) / 2) * 100)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span className={`sentiment-badge sentiment-${label}`}>
          <Activity size={13} />
          {label}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Score: {score > 0 ? '+' : ''}{score}
        </span>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div className="progress-bar" style={{ height: 6 }}>
          <div className="progress-fill" style={{
            width: `${pct}%`,
            background: label === 'Positive' ? 'var(--green)'
              : label === 'Negative' ? 'var(--red)'
              : 'var(--text-muted)'
          }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--green)' }}>↑ {positive_signals} positive signals</span>
        <span style={{ color: 'var(--red)' }}>↓ {negative_signals} negative signals</span>
      </div>
    </div>
  )
}

export default function InsightsPage({ activeDoc, toast }) {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeDoc) return
    setInsights(null)
    setLoading(true)
    api.insights(activeDoc.doc_id)
      .then(setInsights)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [activeDoc?.doc_id])

  if (!activeDoc) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><BarChart2 size={24} /></div>
        <div className="empty-title">No document selected</div>
        <div className="empty-sub">Select a document from the sidebar to view financial insights.</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="loading-spinner" style={{ width: 32, height: 32, borderWidth: 3, marginBottom: 16 }} />
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Extracting financial signals…</div>
      </div>
    )
  }

  if (!insights) return null

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Financial Insights</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{insights.filename}</p>
      </div>

      {/* Stats bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-label">Risk Factors</div>
          <div className="stat-value accent">{insights.risks.length}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Guidance Statements</div>
          <div className="stat-value green">{insights.guidance.length}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Metric Types</div>
          <div className="stat-value">{Object.keys(insights.metrics).length}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Sentiment</div>
          <div className={`stat-value ${insights.sentiment.label === 'Positive' ? 'green' : insights.sentiment.label === 'Negative' ? '' : ''}`}
            style={{ fontSize: 14, color: insights.sentiment.label === 'Positive' ? 'var(--green)' : insights.sentiment.label === 'Negative' ? 'var(--red)' : 'var(--text-secondary)' }}>
            {insights.sentiment.label}
          </div>
        </div>
      </div>

      <div className="insight-grid">
        {/* Sentiment */}
        <div className="insight-card">
          <div className="insight-card-header">
            <Activity size={13} />
            Sentiment Analysis
          </div>
          <div className="insight-card-body">
            <SentimentMeter sentiment={insights.sentiment} />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="insight-card">
          <div className="insight-card-header">
            <BarChart2 size={13} />
            Extracted Financial Metrics
          </div>
          <div className="insight-card-body">
            {Object.keys(insights.metrics).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No structured metrics detected in this document.</p>
            ) : (
              Object.entries(insights.metrics).map(([key, values]) => (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 4 }}>{key}</div>
                  {values.map((v, i) => (
                    <span key={i} className="insight-chip chip-metric">{v}</span>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Risk Factors */}
        <div className="insight-card" style={{ gridColumn: '1 / -1' }}>
          <div className="insight-card-header">
            <Shield size={13} />
            Risk Factors ({insights.risks.length})
          </div>
          <div className="insight-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {insights.risks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No explicit risk factors detected.</p>
            ) : (
              insights.risks.slice(0, 12).map((risk, i) => (
                <div key={i} style={{
                  background: 'var(--red-dim)',
                  border: '1px solid rgba(239,68,68,0.12)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}>
                  <span style={{ color: 'var(--red)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 10, marginRight: 6 }}>
                    R{String(i + 1).padStart(2, '0')}
                  </span>
                  {risk.length > 150 ? risk.slice(0, 150) + '…' : risk}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Forward Guidance */}
        <div className="insight-card" style={{ gridColumn: '1 / -1' }}>
          <div className="insight-card-header">
            <TrendingUp size={13} />
            Forward Guidance Statements ({insights.guidance.length})
          </div>
          <div className="insight-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {insights.guidance.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No explicit forward guidance detected.</p>
            ) : (
              insights.guidance.slice(0, 10).map((g, i) => (
                <div key={i} style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '8px 12px',
                  background: 'var(--green-dim)',
                  border: '1px solid rgba(16,185,129,0.12)',
                  borderRadius: 6,
                }}>
                  <span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, marginTop: 2 }}>
                    G{String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {g.length > 200 ? g.slice(0, 200) + '…' : g}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
