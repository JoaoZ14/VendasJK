import { useMemo, useState } from 'react'
import type { Client, ClientStatus, ClientType } from '../types'
import { daysAgo, isSameDay, startOfToday } from '../utils/helpers'

export type ClientFilter =
  | 'all'
  | 'nao_contatado'
  | 'aguardando_resposta'
  | 'negociacao'
  | 'cliente'
  | 'perdido'
  | 'follow_up_hoje'
  | 'sem_contato'

export const CITY_ALL = 'all'
export const CITY_NONE = '__none__'

export function cityKey(client: Pick<Client, 'city' | 'state'>): string {
  const city = client.city?.trim()
  if (!city) return CITY_NONE
  const state = client.state?.trim()
  return state ? `${city}|${state}` : city
}

export function cityLabel(key: string): string {
  if (key === CITY_ALL) return 'Todas'
  if (key === CITY_NONE) return 'Sem cidade'
  const [city, state] = key.split('|')
  return state ? `${city}, ${state}` : city
}

export function useClientFilters(clients: Client[], daysWithoutContact: number) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ClientFilter>('all')
  const [typeFilter, setTypeFilter] = useState<ClientType | 'all'>('all')
  const [cityFilter, setCityFilter] = useState<string>(CITY_ALL)

  const cityTabs = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of clients) {
      const key = cityKey(c)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const tabs = [...counts.entries()]
      .map(([key, count]) => ({ key, label: cityLabel(key), count }))
      .sort((a, b) => {
        if (a.key === CITY_NONE) return 1
        if (b.key === CITY_NONE) return -1
        return a.label.localeCompare(b.label, 'pt-BR')
      })
    return tabs
  }, [clients])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const cutoff = daysAgo(daysWithoutContact)

    return clients.filter((c) => {
      if (cityFilter !== CITY_ALL && cityKey(c) !== cityFilter) return false
      if (typeFilter !== 'all' && c.type !== typeFilter) return false

      if (q) {
        const hay = [
          c.company_name,
          c.city,
          c.contact_name,
          c.type,
          c.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }

      switch (filter) {
        case 'nao_contatado':
        case 'aguardando_resposta':
        case 'negociacao':
        case 'cliente':
        case 'perdido':
          return c.status === (filter as ClientStatus)
        case 'follow_up_hoje':
          return Boolean(
            c.next_follow_up_at && isSameDay(c.next_follow_up_at, startOfToday()),
          )
        case 'sem_contato': {
          if (c.status === 'cliente' || c.status === 'perdido') return false
          if (!c.last_contact_at) return c.status === 'nao_contatado'
          return new Date(c.last_contact_at) < cutoff
        }
        default:
          return true
      }
    })
  }, [clients, search, filter, typeFilter, cityFilter, daysWithoutContact])

  return {
    search,
    setSearch,
    filter,
    setFilter,
    typeFilter,
    setTypeFilter,
    cityFilter,
    setCityFilter,
    cityTabs,
    filtered,
  }
}

export function computeDashboard(clients: Client[]) {
  const today = startOfToday()
  const total = clients.length
  const contactedToday = clients.filter(
    (c) => c.last_contact_at && isSameDay(c.last_contact_at, today),
  ).length
  const pendingFollowUps = clients.filter(
    (c) =>
      c.next_follow_up_at &&
      new Date(c.next_follow_up_at) <= new Date() &&
      c.status !== 'cliente' &&
      c.status !== 'perdido',
  ).length
  const inNegotiation = clients.filter((c) => c.status === 'negociacao').length
  const closed = clients.filter((c) => c.status === 'cliente').length
  const contacted = clients.filter((c) => c.status !== 'nao_contatado').length
  const conversionRate = total === 0 ? 0 : Math.round((closed / total) * 100)

  const upcomingFollowUps = [...clients]
    .filter(
      (c) =>
        c.next_follow_up_at &&
        c.status !== 'perdido' &&
        c.status !== 'cliente',
    )
    .sort(
      (a, b) =>
        new Date(a.next_follow_up_at!).getTime() -
        new Date(b.next_follow_up_at!).getTime(),
    )
    .slice(0, 6)

  const recentContacts = [...clients]
    .filter((c) => c.last_contact_at)
    .sort(
      (a, b) =>
        new Date(b.last_contact_at!).getTime() -
        new Date(a.last_contact_at!).getTime(),
    )
    .slice(0, 6)

  return {
    total,
    contactedToday,
    pendingFollowUps,
    inNegotiation,
    closed,
    contacted,
    conversionRate,
    upcomingFollowUps,
    recentContacts,
  }
}
