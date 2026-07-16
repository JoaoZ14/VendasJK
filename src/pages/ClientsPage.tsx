import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Plus, Upload } from 'lucide-react'
import styled from 'styled-components'
import { useClients } from '../hooks/useClients'
import {
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
  CLIENT_TYPES,
} from '../types'
import { ClientFormModal } from '../components/ClientFormModal'
import { StatusBadge } from '../components/StatusSelect'
import {
  Button,
  ChipButton,
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

const Toolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`

const SearchRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: ${({ theme }) => theme.space[3]};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const FILTERS: { id: ClientFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'nao_contatado', label: 'Não contatados' },
  { id: 'aguardando_resposta', label: 'Aguardando' },
  { id: 'negociacao', label: 'Negociação' },
  { id: 'cliente', label: 'Clientes' },
  { id: 'perdido', label: 'Perdidos' },
  { id: 'follow_up_hoje', label: 'Follow-up hoje' },
  { id: 'sem_contato', label: 'Sem contato' },
]

export function ClientsPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
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
    filtered,
  } = useClientFilters(clients, daysWithout)

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
  }

  async function handleImport(file: File) {
    setBusy(true)
    try {
      const text = await file.text()
      const rows = parseClientsCsv(text)
      if (rows.length === 0) {
        alert('CSV vazio ou inválido.')
        return
      }
      await createClientsBulk(rows)
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha na importação')
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
            Novo cliente
          </Button>
        </Row>
      </PageHeader>

      <Toolbar>
        <SearchRow>
          <Input
            placeholder="Buscar por nome, cidade, responsável, tipo ou status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as typeof typeFilter)
            }
          >
            <option value="all">Todos os tipos</option>
            {CLIENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {CLIENT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </SearchRow>
        <Row>
          {FILTERS.map((f) => (
            <ChipButton
              key={f.id}
              type="button"
              $active={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              {f.id === 'sem_contato' ? ` (${daysWithout}d)` : ''}
            </ChipButton>
          ))}
        </Row>
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
          <strong>Nenhum cliente encontrado</strong>
          <span>Cadastre o primeiro ou ajuste os filtros.</span>
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Novo cliente
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
