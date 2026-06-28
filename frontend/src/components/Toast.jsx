import { CheckCircle, AlertCircle, Info } from 'lucide-react'

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => {
        const Icon = ICONS[t.type] || Info
        return (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon size={14} />
            {t.message}
          </div>
        )
      })}
    </div>
  )
}
