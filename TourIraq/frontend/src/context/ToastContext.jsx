import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Check, CircleAlert, X } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'

const ToastContext = createContext(() => { })

export function ToastProvider({ children }) {
  const { t } = useI18n()
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((l) => l.filter((t) => t.id !== id)), [])
  const toast = useCallback(
    (message, type = 'success') => {
      const id = Date.now() + Math.random()
      setToasts((l) => [...l, { id, message, type }])
      setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )
  const value = useMemo(() => toast, [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toastItem) => (
          <div key={toastItem.id} className={`toast ${toastItem.type}`}>
            <span className="toast-icon">{toastItem.type === 'error' ? <CircleAlert size={14} /> : <Check size={14} />}</span>
            <span>{toastItem.message}</span>
            <button onClick={() => dismiss(toastItem.id)} aria-label={t('common.close')}><X size={16} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)
