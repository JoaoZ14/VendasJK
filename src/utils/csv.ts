import type { Client, ClientInsert, ClientStatus, ClientType } from '../types'
import {
  CLIENT_STATUSES,
  CLIENT_STATUS_LABELS,
  CLIENT_TYPE_LABELS,
  CLIENT_TYPES,
} from '../types'

const HEADERS = [
  'company_name',
  'type',
  'city',
  'state',
  'phone',
  'whatsapp',
  'email',
  'website',
  'contact_name',
  'contact_role',
  'notes',
  'status',
  'next_follow_up_at',
] as const

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function resolveType(raw: string): ClientType {
  const lower = raw.trim().toLowerCase()
  const byLabel = (Object.entries(CLIENT_TYPE_LABELS) as [ClientType, string][]).find(
    ([, label]) => label.toLowerCase() === lower,
  )
  if (byLabel) return byLabel[0]
  if ((CLIENT_TYPES as readonly string[]).includes(lower)) return lower as ClientType
  return 'outro'
}

function resolveStatus(raw: string): ClientStatus {
  const lower = raw.trim().toLowerCase()
  const byLabel = (
    Object.entries(CLIENT_STATUS_LABELS) as [ClientStatus, string][]
  ).find(([, label]) => label.toLowerCase() === lower)
  if (byLabel) return byLabel[0]
  if ((CLIENT_STATUSES as readonly string[]).includes(lower)) {
    return lower as ClientStatus
  }
  return 'nao_contatado'
}

export function clientsToCsv(clients: Client[]): string {
  const header = HEADERS.join(',')
  const rows = clients.map((c) =>
    [
      c.company_name,
      c.type,
      c.city ?? '',
      c.state ?? '',
      c.phone ?? '',
      c.whatsapp ?? '',
      c.email ?? '',
      c.website ?? '',
      c.contact_name ?? '',
      c.contact_role ?? '',
      c.notes ?? '',
      c.status,
      c.next_follow_up_at ?? '',
    ]
      .map((v) => escapeCsv(String(v)))
      .join(','),
  )
  return [header, ...rows].join('\n')
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function parseClientsCsv(text: string): ClientInsert[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)

  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const index = (name: string) => headers.indexOf(name)

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line)
    const get = (name: string) => {
      const i = index(name)
      return i >= 0 ? (cols[i] ?? '').trim() : ''
    }

    return {
      company_name: get('company_name') || get('empresa') || 'Sem nome',
      type: resolveType(get('type') || get('tipo')),
      city: get('city') || get('cidade') || null,
      state: get('state') || get('estado') || null,
      phone: get('phone') || get('telefone') || null,
      whatsapp: get('whatsapp') || null,
      email: get('email') || null,
      website: get('website') || get('site') || null,
      contact_name: get('contact_name') || get('responsavel') || null,
      contact_role: get('contact_role') || get('cargo') || null,
      notes: get('notes') || get('observacoes') || null,
      status: resolveStatus(get('status')),
      last_contact_at: null,
      next_follow_up_at: get('next_follow_up_at') || null,
    } satisfies ClientInsert
  })
}
