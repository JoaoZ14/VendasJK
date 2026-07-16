import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Mail,
  MessageCircle,
  Phone,
  SkipForward,
} from 'lucide-react'
import styled from 'styled-components'
import {
  createActivity,
  fetchClient,
  fetchNextUncontacted,
  updateClientStatus,
} from '../services/clients'
import type { Client } from '../types'
import {
  Button,
  EmptyState,
  Page,
  PageHeader,
  PageSubtitle,
  PageTitle,
  Row,
  Spinner,
  Stack,
} from '../components/ui'
import { openEmail, openWhatsApp } from '../utils/helpers'

const Stage = styled.div`
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
`

const FocusCard = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: ${({ theme }) => theme.space[8]};
`

const Company = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: -0.03em;
  margin-bottom: ${({ theme }) => theme.space[2]};
`

const MetaLine = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.md};
  margin-bottom: ${({ theme }) => theme.space[6]};
`

const FieldList = styled.dl`
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: ${({ theme }) => theme.space[3]};
  margin-bottom: ${({ theme }) => theme.space[6]};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  dt {
    color: ${({ theme }) => theme.colors.muted};
  }
`

const Notes = styled.p`
  white-space: pre-wrap;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.muted};
  background: ${({ theme }) => theme.colors.elevated};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.space[4]};
  margin-bottom: ${({ theme }) => theme.space[6]};
  min-height: 72px;
`

const Actions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space[3]};

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

export function ProspectPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [empty, setEmpty] = useState(false)

  const loadClient = useCallback(async (preferredId?: string | null) => {
    setLoading(true)
    setEmpty(false)
    try {
      if (preferredId) {
        const c = await fetchClient(preferredId)
        setClient(c)
        return
      }
      const next = await fetchNextUncontacted()
      if (!next) {
        setClient(null)
        setEmpty(true)
        return
      }
      setClient(next)
    } catch {
      setEmpty(true)
      setClient(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadClient(params.get('id'))
  }, [params, loadClient])

  async function markFirstContactIfNeeded(current: Client) {
    if (current.status === 'nao_contatado') {
      const updated = await updateClientStatus(current.id, 'primeiro_contato')
      setClient(updated)
      return updated
    }
    return current
  }

  async function goNext() {
    if (!client) return
    setBusy(true)
    try {
      await markFirstContactIfNeeded(client)
      const next = await fetchNextUncontacted()
      if (!next || next.id === client.id) {
        setEmpty(true)
        setClient(null)
        navigate('/prospeccao', { replace: true })
        return
      }
      setClient(next)
      navigate(`/prospeccao?id=${next.id}`, { replace: true })
    } finally {
      setBusy(false)
    }
  }

  async function sendWhatsApp() {
    if (!client?.whatsapp) {
      alert('Sem WhatsApp neste cliente.')
      return
    }
    const msg = `Olá${client.contact_name ? ` ${client.contact_name}` : ''}, tudo bem?`
    openWhatsApp(client.whatsapp, msg)
    await createActivity({
      client_id: client.id,
      type: 'whatsapp',
      content: msg,
    })
    await markFirstContactIfNeeded(client)
  }

  async function sendEmail() {
    if (!client?.email) {
      alert('Sem email neste cliente.')
      return
    }
    const body = `Olá${client.contact_name ? ` ${client.contact_name}` : ''},\n\n`
    openEmail(client.email, 'Contato comercial', body)
    await createActivity({
      client_id: client.id,
      type: 'email',
      content: body,
    })
    await markFirstContactIfNeeded(client)
  }

  async function registerCall() {
    if (!client) return
    await createActivity({
      client_id: client.id,
      type: 'ligacao',
      content: 'Ligação registrada no Modo Prospecção',
    })
    await markFirstContactIfNeeded(client)
  }

  return (
    <Page>
      <Stage>
        <PageHeader>
          <div>
            <PageTitle>Modo Prospecção</PageTitle>
            <PageSubtitle>Um cliente por vez. Contate e avance.</PageSubtitle>
          </div>
        </PageHeader>

        {loading ? (
          <Spinner />
        ) : empty || !client ? (
          <EmptyState>
            <strong>Fila limpa</strong>
            <span>Não há clientes com status “Não contatado”.</span>
            <Button onClick={() => navigate('/clientes')}>Ver clientes</Button>
          </EmptyState>
        ) : (
          <FocusCard>
            <Company>{client.company_name}</Company>
            <MetaLine>
              {[client.city, client.state].filter(Boolean).join(' · ') ||
                'Cidade não informada'}
            </MetaLine>

            <FieldList>
              <dt>Responsável</dt>
              <dd>{client.contact_name || '—'}</dd>
              <dt>Telefone</dt>
              <dd>{client.phone || '—'}</dd>
              <dt>WhatsApp</dt>
              <dd>{client.whatsapp || '—'}</dd>
              <dt>Email</dt>
              <dd>{client.email || '—'}</dd>
            </FieldList>

            <Stack $gap={2}>
              <span style={{ fontSize: '0.8125rem', color: 'oklch(0.62 0.015 230)' }}>
                Observações
              </span>
              <Notes>{client.notes || 'Sem observações.'}</Notes>
            </Stack>

            <Actions>
              <Button onClick={sendWhatsApp} disabled={busy}>
                <MessageCircle size={16} />
                Enviar WhatsApp
              </Button>
              <Button $variant="secondary" onClick={sendEmail} disabled={busy}>
                <Mail size={16} />
                Enviar Email
              </Button>
              <Button $variant="secondary" onClick={registerCall} disabled={busy}>
                <Phone size={16} />
                Registrar Ligação
              </Button>
              <Button onClick={goNext} disabled={busy} $size="lg">
                {busy ? (
                  '…'
                ) : (
                  <>
                    <SkipForward size={16} />
                    Próximo Cliente
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </Actions>

            <Row style={{ marginTop: 24, justifyContent: 'center' }}>
              <Button
                $variant="ghost"
                $size="sm"
                onClick={() => navigate(`/clientes/${client.id}`)}
              >
                Abrir detalhes
              </Button>
            </Row>
          </FocusCard>
        )}
      </Stage>
    </Page>
  )
}
