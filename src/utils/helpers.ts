import type { Client } from '../types'

export function applyTemplateVars(
  text: string,
  client: Pick<Client, 'company_name' | 'city' | 'contact_name'>,
): string {
  return text
    .replaceAll('{cliente}', client.company_name || '')
    .replaceAll('{cidade}', client.city || '')
    .replaceAll('{responsavel}', client.contact_name || '')
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = normalizePhone(phone)
  const text = encodeURIComponent(message)
  return `https://wa.me/${digits}?text=${text}`
}

export function openWhatsApp(phone: string, message: string): void {
  window.open(buildWhatsAppUrl(phone, message), '_blank', 'noopener,noreferrer')
}

export function buildMailto(
  email: string,
  subject: string,
  body: string,
): string {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (body) params.set('body', body)
  const qs = params.toString()
  return `mailto:${email}${qs ? `?${qs}` : ''}`
}

export function openEmail(email: string, subject: string, body: string): void {
  window.location.href = buildMailto(email, subject, body)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function isSameDay(a: string | Date, b: string | Date = new Date()): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function daysAgo(days: number): Date {
  const d = startOfToday()
  d.setDate(d.getDate() - days)
  return d
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function fromDateInputValue(value: string): string | null {
  if (!value) return null
  return new Date(`${value}T12:00:00`).toISOString()
}
