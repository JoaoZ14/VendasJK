import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, MapPin, Plus, Upload } from 'lucide-react'
import styled from 'styled-components'
import { useClients } from '../hooks/useClients'
import {
  CITY_ALL,
  type ClientFilter,
  useClientFilters,
} from '../hooks/useClientFilters'
import {
  createClient,
  createClientsBulk,
  fetchSettings,
} from '../services/clients'
import type { ClientInsert } from '../types'
import {
  CLIENT_TYPE_LABELS,
} from '../types'
import { ClientFormModal } from '../components/ClientFormModal'
import { StatusBadge } from '../components/StatusSelect'
import { useToast } from '../context/ToastContext'
import {
  Button,
  EmptyState,
  Input,
  Page,
  PageHeader,
  PageSubtitle,
  PageTitle,
  Row,
  Select,
  Spinner,
  Table,
  TableWrap,
} from '../components/ui'
import { clientsToCsv, downloadCsv, parseClientsCsv } from '../utils/csv'
import { formatDate } from '../utils/helpers'

const CITY_STORAGE_KEY = 'crm-clients-city-tab'

const Toolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 160px 200px;
  gap: ${({ theme }) => theme.space[3]};

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`

const TabBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
`

const CityTab = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  height: 34px;
  padding: 0 ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.primary : theme.colors.border};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primaryMuted : theme.colors.surface};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primary : theme.colors.muted};

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
    border-color: ${({ theme }) => theme.colors.borderHover};
  }

  small {
    opacity: 0.75;
    font-weight: ${({ theme }) => theme.fontWeights.regular};
  }
`

const STATUS_OPTIONS: { id: ClientFilter; label: string }[] = [
  { id: 'all', label: 'Todos os status' },
  { id: 'nao_contatado', label: 'Não contatados' },
  { id: 'aguardando_resposta', label: 'Aguardando' },
  { id: 'negociacao', label: 'Negociação' },
  { id: 'follow_up_hoje', label: 'Follow-up hoje' },
  { id: 'cliente', label: 'Clientes fechados' },
  { id: 'perdido', label: 'Perdidos' },
  { id: 'sem_contato', label: 'Sem contato' },
]

const PRIMARY_TYPES = ['empresa', 'landing', 'site', 'outro'] as const
const LEGACY_TYPES = ['hotel', 'pousada', 'resort', 'hostel'] as const

function loadSavedCity(): string {
  try {
    return localStorage.getItem(CITY_STORAGE_KEY) || CITY_ALL
  } catch {
    return CITY_ALL
  }
}

export function ClientsPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { toast } = useToast()
  const { clients, loading, error, refresh } = useClients()
  const [daysWithout, setDaysWithout] = useState(7)
  const [modalOpen, setModalOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
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
  } = useClientFilters(clients, daysWithout)

  useEffect(() => {
    const saved = loadSavedCity()
    if (saved !== CITY_ALL) setCityFilter(saved)
  }, [setCityFilter])

  useEffect(() => {
    if (cityFilter === CITY_ALL) return
    const stillExists = cityTabs.some((t) => t.key === cityFilter)
    if (!stillExists) setCityFilter(CITY_ALL)
  }, [cityTabs, cityFilter, setCityFilter])

  useEffect(() => {
    try {
      localStorage.setItem(CITY_STORAGE_KEY, cityFilter)
    } catch {
      // ignore
    }
  }, [cityFilter])

  useEffect(() => {
    const f = params.get('filter') as ClientFilter | null
    if (f) setFilter(f)
  }, [params, setFilter])

  useEffect(() => {
    fetchSettings()
      .then((s) => setDaysWithout(s.days_without_contact))
      .catch(() => undefined)
  }, [])

  async function handleCreate(payload: ClientInsert) {
    await createClient(payload)
    await refresh()
    toast('Lead criado.', 'success')
  }

  async function handleImport(file: File) {
    setBusy(true)
    try {
      const text = await file.text()
      const rows = parseClientsCsv(text)
      if (rows.length === 0) {
        toast('CSV vazio ou inválido.', 'danger')
        return
      }
      await createClientsBulk(rows)
      await refresh()
      toast(`${rows.length} leads importados.`, 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Falha na importação', 'danger')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleExport() {
    downloadCsv('clientes.csv', clientsToCsv(filtered))
  }

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Clientes</PageTitle>
          <PageSubtitle>
            {filtered.length} de {clients.length} leads
            {cityFilter !== CITY_ALL
              ? ` · ${cityTabs.find((t) => t.key === cityFilter)?.label ?? ''}`
              : ''}
          </PageSubtitle>
        </div>
        <Row>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleImport(file)
            }}
          />
          <Button
            $variant="secondary"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            <Upload size={16} />
            Importar CSV
          </Button>
          <Button $variant="secondary" onClick={handleExport}>
            <Download size={16} />
            Exportar
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Novo lead
          </Button>
        </Row>
      </PageHeader>

      <Toolbar>
        {cityTabs.length > 0 && (
          <TabBar>
            <CityTab
              type="button"
              $active={cityFilter === CITY_ALL}
              onClick={() => setCityFilter(CITY_ALL)}
            >
              Todas
              <small>{clients.length}</small>
            </CityTab>
            {cityTabs.map((t) => (
              <CityTab
                key={t.key}
                type="button"
                $active={cityFilter === t.key}
                onClick={() => setCityFilter(t.key)}
              >
                <MapPin size={14} />
                {t.label}
                <small>{t.count}</small>
              </CityTab>
            ))}
          </TabBar>
        )}

        <FilterRow>
          <Input
            placeholder="Buscar por nome, responsável…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ClientFilter)}
            aria-label="Status"
          >
            {STATUS_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
                {f.id === 'sem_contato' ? ` (${daysWithout}d)` : ''}
              </option>
            ))}
          </Select>
          <Select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as typeof typeFilter)
            }
            aria-label="Tipo"
          >
            <option value="all">Todos os tipos</option>
            {PRIMARY_TYPES.map((t) => (
              <option key={t} value={t}>
                {CLIENT_TYPE_LABELS[t]}
              </option>
            ))}
            <optgroup label="Hospedagem (legado)">
              {LEGACY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CLIENT_TYPE_LABELS[t]}
                </option>
              ))}
            </optgroup>
          </Select>
        </FilterRow>
      </Toolbar>

      {loading ? (
        <Spinner />
      ) : error ? (
        <EmptyState>
          <strong>Erro</strong>
          <span>{error}</span>
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState>
          <strong>Nenhum lead nesta cidade</strong>
          <span>Cadastre o primeiro ou mude a aba / filtros.</span>
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Novo lead
          </Button>
        </EmptyState>
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Tipo</th>
                <th>Cidade</th>
                <th>Responsável</th>
                <th>Status</th>
                <th>Último contato</th>
                <th>Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/clientes/${c.id}`)}
                >
                  <td>{c.company_name}</td>
                  <td>{CLIENT_TYPE_LABELS[c.type]}</td>
                  <td>
                    {[c.city, c.state].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td>{c.contact_name || '—'}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>{formatDate(c.last_contact_at)}</td>
                  <td>{formatDate(c.next_follow_up_at)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}

      <ClientFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </Page>
  )
}
