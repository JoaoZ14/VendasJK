import { supabase } from './supabase'
import type {
  Activity,
  ActivityType,
  Client,
  ClientInsert,
  ClientStatus,
  ClientUpdate,
  MessageTemplate,
  TemplateCategory,
  UserSettings,
} from '../types'

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  const id = data.user?.id
  if (!id) throw new Error('Faça login para continuar')
  return id
}

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  throwIfError(error)
  return (data ?? []) as Client[]
}

export async function fetchClient(id: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  throwIfError(error)
  if (!data) throw new Error('Cliente não encontrado')
  return data as Client
}

export async function createClient(payload: ClientInsert): Promise<Client> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: userId,
      company_name: payload.company_name,
      type: payload.type,
      city: payload.city ?? null,
      state: payload.state ?? null,
      phone: payload.phone ?? null,
      whatsapp: payload.whatsapp ?? null,
      email: payload.email ?? null,
      website: payload.website ?? null,
      contact_name: payload.contact_name ?? null,
      contact_role: payload.contact_role ?? null,
      notes: payload.notes ?? null,
      status: payload.status ?? 'nao_contatado',
      last_contact_at: payload.last_contact_at ?? null,
      next_follow_up_at: payload.next_follow_up_at ?? null,
    })
    .select()
    .single()

  throwIfError(error)
  return data as Client
}

export async function updateClient(
  id: string,
  payload: ClientUpdate,
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  throwIfError(error)
  if (!data) throw new Error('Cliente não encontrado')
  return data as Client
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  throwIfError(error)
}

export async function fetchNextUncontacted(): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('status', 'nao_contatado')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  throwIfError(error)
  return (data as Client | null) ?? null
}

export async function fetchActivities(clientId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  throwIfError(error)
  return (data ?? []) as Activity[]
}

export async function createActivity(input: {
  client_id: string
  type: ActivityType
  content?: string | null
}): Promise<Activity> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: userId,
      client_id: input.client_id,
      type: input.type,
      content: input.content ?? null,
    })
    .select()
    .single()

  throwIfError(error)

  const activity = data as Activity
  await updateClient(input.client_id, {
    last_contact_at: activity.created_at,
  })

  return activity
}

export async function updateClientStatus(
  id: string,
  status: ClientStatus,
): Promise<Client> {
  return updateClient(id, { status })
}

export async function fetchTemplates(): Promise<MessageTemplate[]> {
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .order('updated_at', { ascending: false })

  throwIfError(error)
  return (data ?? []) as MessageTemplate[]
}

export async function createTemplate(input: {
  name: string
  category: TemplateCategory
  subject?: string | null
  body: string
}): Promise<MessageTemplate> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('message_templates')
    .insert({
      user_id: userId,
      name: input.name,
      category: input.category,
      subject: input.subject ?? null,
      body: input.body,
    })
    .select()
    .single()

  throwIfError(error)
  return data as MessageTemplate
}

export async function updateTemplate(
  id: string,
  input: Partial<{
    name: string
    category: TemplateCategory
    subject: string | null
    body: string
  }>,
): Promise<MessageTemplate> {
  const { data, error } = await supabase
    .from('message_templates')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  throwIfError(error)
  if (!data) throw new Error('Modelo não encontrado')
  return data as MessageTemplate
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('message_templates')
    .delete()
    .eq('id', id)
  throwIfError(error)
}

export async function fetchSettings(): Promise<UserSettings> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  throwIfError(error)

  if (data) return data as UserSettings

  const { data: created, error: createError } = await supabase
    .from('user_settings')
    .insert({ user_id: userId, days_without_contact: 7 })
    .select()
    .single()

  throwIfError(createError)
  return created as UserSettings
}

export async function updateSettings(
  days_without_contact: number,
): Promise<UserSettings> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        days_without_contact,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single()

  throwIfError(error)
  return data as UserSettings
}

export async function createClientsBulk(
  rows: ClientInsert[],
): Promise<Client[]> {
  if (rows.length === 0) return []

  const userId = await requireUserId()
  const payload = rows.map((row) => ({
    user_id: userId,
    company_name: row.company_name,
    type: row.type,
    city: row.city ?? null,
    state: row.state ?? null,
    phone: row.phone ?? null,
    whatsapp: row.whatsapp ?? null,
    email: row.email ?? null,
    website: row.website ?? null,
    contact_name: row.contact_name ?? null,
    contact_role: row.contact_role ?? null,
    notes: row.notes ?? null,
    status: row.status ?? 'nao_contatado',
    last_contact_at: row.last_contact_at ?? null,
    next_follow_up_at: row.next_follow_up_at ?? null,
  }))

  const { data, error } = await supabase
    .from('clients')
    .insert(payload)
    .select()

  throwIfError(error)
  return (data ?? []) as Client[]
}
