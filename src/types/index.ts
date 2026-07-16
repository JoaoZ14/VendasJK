export const CLIENT_TYPES = [
  'empresa',
  'landing',
  'site',
  'hotel',
  'pousada',
  'resort',
  'hostel',
  'outro',
] as const

export type ClientType = (typeof CLIENT_TYPES)[number]

export const CLIENT_STATUSES = [
  'nao_contatado',
  'primeiro_contato',
  'aguardando_resposta',
  'negociacao',
  'cliente',
  'perdido',
] as const

export type ClientStatus = (typeof CLIENT_STATUSES)[number]

export const ACTIVITY_TYPES = [
  'whatsapp',
  'email',
  'ligacao',
  'visita',
  'observacao',
] as const

export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const TEMPLATE_CATEGORIES = [
  'primeiro_contato',
  'follow_up',
  'apresentacao',
  'negociacao',
] as const

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]

export interface Client {
  id: string
  user_id: string
  company_name: string
  type: ClientType
  city: string | null
  state: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  contact_name: string | null
  contact_role: string | null
  notes: string | null
  status: ClientStatus
  created_at: string
  last_contact_at: string | null
  next_follow_up_at: string | null
}

export type ClientInsert = Omit<Client, 'id' | 'created_at' | 'user_id'> & {
  id?: string
  user_id?: string
  created_at?: string
}

export type ClientUpdate = Partial<Omit<Client, 'id' | 'user_id' | 'created_at'>>

export interface Activity {
  id: string
  user_id: string
  client_id: string
  type: ActivityType
  content: string | null
  created_at: string
}

export interface MessageTemplate {
  id: string
  user_id: string
  name: string
  category: TemplateCategory
  subject: string | null
  body: string
  created_at: string
  updated_at: string
}

export interface UserSettings {
  user_id: string
  days_without_contact: number
  updated_at: string
}

export interface DashboardStats {
  total: number
  contactedToday: number
  pendingFollowUps: number
  inNegotiation: number
  closed: number
  contacted: number
  conversionRate: number
}

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  empresa: 'Empresa',
  landing: 'Landing page',
  site: 'Site',
  hotel: 'Hotel',
  pousada: 'Pousada',
  resort: 'Resort',
  hostel: 'Hostel',
  outro: 'Outro',
}

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  nao_contatado: 'Não contatado',
  primeiro_contato: 'Primeiro contato',
  aguardando_resposta: 'Aguardando resposta',
  negociacao: 'Negociação',
  cliente: 'Cliente',
  perdido: 'Perdido',
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  whatsapp: 'WhatsApp enviado',
  email: 'Email enviado',
  ligacao: 'Ligação',
  visita: 'Visita',
  observacao: 'Observação',
}

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  primeiro_contato: 'Primeiro contato',
  follow_up: 'Follow-up',
  apresentacao: 'Apresentação',
  negociacao: 'Negociação',
}
