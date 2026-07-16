import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { fetchSettings, updateSettings } from '../services/clients'
import { useClients } from '../hooks/useClients'
import { computeDashboard } from '../hooks/useClientFilters'
import {
  Button,
  Card,
  CardTitle,
  Field,
  Input,
  Label,
  Page,
  PageHeader,
  PageSubtitle,
  PageTitle,
  Spinner,
  Stack,
} from '../components/ui'

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.space[3]};
  margin-top: ${({ theme }) => theme.space[4]};
`

const Stat = styled.div`
  background: ${({ theme }) => theme.colors.elevated};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.space[4]};

  span {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.muted};
    margin-bottom: ${({ theme }) => theme.space[1]};
  }

  strong {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    letter-spacing: -0.02em;
  }
`

const Hint = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.muted};
`

export function SettingsPage() {
  const { clients, loading: clientsLoading } = useClients()
  const stats = computeDashboard(clients)
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
      .then((s) => setDays(s.days_without_contact))
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Configurações</PageTitle>
          <PageSubtitle>Preferências pessoais do seu CRM.</PageSubtitle>
        </div>
      </PageHeader>

      <Stack $gap={4}>
        <Card>
          <CardTitle>Filtro “Sem contato”</CardTitle>
          <Hint>
            Clientes sem interação há X dias entram no filtro da lista.
          </Hint>
          {loading ? (
            <Spinner />
          ) : (
            <Stack $gap={3} style={{ marginTop: 16, maxWidth: 280 }}>
              <Field>
                <Label htmlFor="days">Dias sem contato</Label>
                <Input
                  id="days"
                  type="number"
                  min={1}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                />
              </Field>
              <Button
                disabled={saving}
                onClick={async () => {
                  setSaving(true)
                  setSaved(false)
                  try {
                    await updateSettings(days)
                    setSaved(true)
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
              {saved && <Hint>Salvo.</Hint>}
            </Stack>
          )}
        </Card>

        <Card>
          <CardTitle>Estatísticas</CardTitle>
          {clientsLoading ? (
            <Spinner />
          ) : (
            <Stats>
              <Stat>
                <span>Total</span>
                <strong>{stats.total}</strong>
              </Stat>
              <Stat>
                <span>Contatados</span>
                <strong>{stats.contacted}</strong>
              </Stat>
              <Stat>
                <span>Fechados</span>
                <strong>{stats.closed}</strong>
              </Stat>
              <Stat>
                <span>Negociações</span>
                <strong>{stats.inNegotiation}</strong>
              </Stat>
              <Stat>
                <span>Conversão</span>
                <strong>{stats.conversionRate}%</strong>
              </Stat>
            </Stats>
          )}
        </Card>

        <Card>
          <CardTitle>Armazenamento</CardTitle>
          <Hint>
            Dados na base Supabase, vinculados à sua conta. Cada usuário vê
            só o próprio CRM (RLS).
          </Hint>
        </Card>
      </Stack>
    </Page>
  )
}
