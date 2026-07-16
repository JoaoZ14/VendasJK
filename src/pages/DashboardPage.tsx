import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useClients } from '../hooks/useClients'
import { computeDashboard } from '../hooks/useClientFilters'
import { fetchNextUncontacted } from '../services/clients'
import {
  Button,
  Card,
  CardTitle,
  EmptyState,
  Page,
  PageHeader,
  PageSubtitle,
  PageTitle,
  Spinner,
  Stack,
} from '../components/ui'
import { StatusBadge } from '../components/StatusSelect'
import { formatDate, formatDateTime } from '../utils/helpers'
import { useState } from 'react'

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: ${({ theme }) => theme.space[4]};
`

const StatCard = styled(Card)`
  padding: ${({ theme }) => theme.space[4]};

  span {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.muted};
    margin-bottom: ${({ theme }) => theme.space[2]};
  }

  strong {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    letter-spacing: -0.03em;
  }
`

const Panels = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.space[4]};
`

const ListItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[3]} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  text-align: left;

  &:last-child {
    border-bottom: none;
  }

  &:hover strong {
    color: ${({ theme }) => theme.colors.primary};
  }

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    transition: color ${({ theme }) => theme.motion.fast}
      ${({ theme }) => theme.motion.ease};
  }

  small {
    color: ${({ theme }) => theme.colors.muted};
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`

const NextCta = styled(Button)`
  min-width: 220px;
`

export function DashboardPage() {
  const navigate = useNavigate()
  const { clients, loading, error } = useClients()
  const [nextLoading, setNextLoading] = useState(false)
  const stats = computeDashboard(clients)

  async function goNextClient() {
    setNextLoading(true)
    try {
      const next = await fetchNextUncontacted()
      if (next) {
        navigate(`/prospeccao?id=${next.id}`)
      } else {
        navigate('/clientes?filter=nao_contatado')
      }
    } finally {
      setNextLoading(false)
    }
  }

  if (loading) {
    return (
      <Page>
        <Spinner />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Hoje</PageTitle>
          <PageSubtitle>Quem precisa de contato agora.</PageSubtitle>
        </div>
        <NextCta $size="lg" onClick={goNextClient} disabled={nextLoading}>
          {nextLoading ? <Loader2 size={18} /> : <ArrowRight size={18} />}
          Próximo Cliente
        </NextCta>
      </PageHeader>

      {error && <Card>{error}</Card>}

      <StatsGrid>
        <StatCard>
          <span>Follow-ups pendentes</span>
          <strong>{stats.pendingFollowUps}</strong>
        </StatCard>
        <StatCard>
          <span>Contatados hoje</span>
          <strong>{stats.contactedToday}</strong>
        </StatCard>
        <StatCard>
          <span>Em negociação</span>
          <strong>{stats.inNegotiation}</strong>
        </StatCard>
      </StatsGrid>

      <Panels>
        <Card>
          <CardTitle>Próximos follow-ups</CardTitle>
          {stats.upcomingFollowUps.length === 0 ? (
            <EmptyState>
              <strong>Nada agendado</strong>
              <span>Defina follow-ups nos clientes ativos.</span>
            </EmptyState>
          ) : (
            <Stack>
              {stats.upcomingFollowUps.map((c) => (
                <ListItem
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/clientes/${c.id}`)}
                >
                  <div>
                    <strong>{c.company_name}</strong>
                    <small>{formatDate(c.next_follow_up_at)}</small>
                  </div>
                  <StatusBadge status={c.status} />
                </ListItem>
              ))}
            </Stack>
          )}
        </Card>

        <Card>
          <CardTitle>Últimos contatos</CardTitle>
          {stats.recentContacts.length === 0 ? (
            <EmptyState>
              <strong>Sem contatos ainda</strong>
              <span>Use o Modo Prospecção para acelerar.</span>
            </EmptyState>
          ) : (
            <Stack>
              {stats.recentContacts.map((c) => (
                <ListItem
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/clientes/${c.id}`)}
                >
                  <div>
                    <strong>{c.company_name}</strong>
                    <small>{formatDateTime(c.last_contact_at)}</small>
                  </div>
                  <StatusBadge status={c.status} />
                </ListItem>
              ))}
            </Stack>
          )}
        </Card>
      </Panels>
    </Page>
  )
}
