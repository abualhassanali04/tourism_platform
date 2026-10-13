import { API_ORIGIN } from '../api/client'

// Turns an Axios error (ASP.NET ProblemDetails) into a readable message.
export function errorMessage(err) {
  const data = err?.response?.data
  if (data?.errors) {
    // Validation ProblemDetails: { errors: { Field: ["msg"] } }
    const first = Object.values(data.errors).flat()[0]
    if (first) return first
  }
  if (data?.detail) return data.detail
  if (data?.title) return data.title
  if (err?.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?'
  return err?.message || 'Something went wrong.'
}

export function imageUrl(url) {
  if (!url) return null
  return url.startsWith('/uploads') ? `${API_ORIGIN}${url}` : url
}

export function formatDate(d) {
  if (!d) return ''
  const locale = typeof document === 'undefined' ? undefined : document.documentElement.lang || undefined
  return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
}

// Whole numbers with thousands separators. Rendered inside <Money/> / .num so it stays LTR.
export function formatPrice(n) {
  return `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export const todayISO = () => new Date().toISOString().slice(0, 10)
