import { useCallback, useEffect, useMemo, useState } from 'react'
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
  fetchTemplates,
  updateClientStatus,
} from '../services/clients'
import type { Client, MessageTemplate } from '../types'
import { useToast } from '../context/ToastContext'
import {
  Button,
  EmptyState,
  Field,
  Label,
  Page,
  PageHeader,
  PageSubtitle,
  PageTitle,
  Row,
  Select,
  Spinner,
  Stack,
} from '../components/ui'
import {
  applyTemplateVars,
  openWhatsApp,
} from '../utils/helpers'
import { prepareFirstContactEmail } from '../utils/emailTemplate'

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
  text-wrap: balance;
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

const Preview = styled.pre`
  white-space: pre-wrap;
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.ink};
  background: ${({ theme }) => theme.colors.elevated};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.space[4]};
  margin-bottom: ${({ theme }) => theme.space[6]};
  max-height: 140px;
  overflow: auto;
`

const Actions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space[3]};

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

const Hint = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.faint};
  margin-top: ${({ theme }) => theme.space[4]};
  text-align: center;
`

const TEMPLATE_STORAGE = 'crm-prospect-template-id'

export function ProspectPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { toast } = useToast()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [templateId, setTemplateId] = useState(() => {
    try {
      return localStorage.getItem(TEMPLATE_STORAGE) ?? ''
    } catch {
      return ''
    }
  })

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

  useEffect(() => {
    fetchTemplates()
      .then((list) => {
        setTemplates(list)
        setTemplateId((prev) => {
          if (prev && list.some((t) => t.id === prev)) return prev
          return list[0]?.id ?? ''
        })
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    try {
      if (templateId) localStorage.setItem(TEMPLATE_STORAGE, templateId)
    } catch {
      // ignore
    }
  }, [templateId])

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  )

  const messagePreview = useMemo(() => {
    if (!client) return ''
    if (selectedTemplate) return applyTemplateVars(selectedTemplate.body, client)
    return `Olá${client.contact_name ? ` ${client.contact_name}` : ''}, tudo bem?`
  }, [client, selectedTemplate])

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
      toast('Sem WhatsApp neste lead.', 'danger')
      return
    }
    openWhatsApp(client.whatsapp, messagePreview)
    await createActivity({
      client_id: client.id,
      type: 'whatsapp',
      content: messagePreview,
    })
    await markFirstContactIfNeeded(client)
    toast('WhatsApp aberto.', 'success')
  }

  async function sendEmail() {
    if (!client?.email) {
      toast('Sem email neste lead.', 'danger')
      return
    }
    try {
      const { subject } = await prepareFirstContactEmail(
        client.email,
        client.company_name,
      )
      await createActivity({
        client_id: client.id,
        type: 'email',
        content: `E-mail preparado: ${subject}`,
      })
      await markFirstContactIfNeeded(client)
      toast('HTML copiado. Cole no corpo do Gmail com Ctrl+V e envie.', 'success')
    } catch (err) {
      toast(
        err instanceof Error
          ? err.message
          : 'Não foi possível preparar o e-mail.',
        'danger',
      )
    }
  }

  async function registerCall() {
    if (!client) return
    await createActivity({
      client_id: client.id,
      type: 'ligacao',
      content: 'Ligação registrada no Modo Prospecção',
    })
    await markFirstContactIfNeeded(client)
    toast('Ligação registrada.', 'success')
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!client || busy || loading) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'Enter') {
        e.preventDefault()
        void goNext()
      }
      if (e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        void sendWhatsApp()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers use latest client via closure refresh
  }, [client, busy, loading, messagePreview])

  return (
    <Page>
      <Stage>
        <PageHeader>
          <div>
            <PageTitle>Prospecção</PageTitle>
            <PageSubtitle>Um lead por vez. Contate e avance.</PageSubtitle>
          </div>
        </PageHeader>

        {loading ? (
          <Spinner />
        ) : empty || !client ? (
          <EmptyState>
            <strong>Fila limpa</strong>
            <span>Não há leads com status “Não contatado”.</span>
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
              <Label htmlFor="prospect-notes">Observações</Label>
              <Notes id="prospect-notes">{client.notes || 'Sem observações.'}</Notes>
            </Stack>

            <Field>
              <Label htmlFor="prospect-template">Modelo de mensagem</Label>
              <Select
                id="prospect-template"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">Mensagem simples</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Preview>{messagePreview}</Preview>

            <Actions>
              <Button
                onClick={sendWhatsApp}
                disabled={busy || !client.whatsapp}
                title={!client.whatsapp ? 'Sem WhatsApp neste lead' : 'Atalho: W'}
              >
                <MessageCircle size={16} />
                WhatsApp
              </Button>
              <Button
                $variant="secondary"
                onClick={sendEmail}
                disabled={busy || !client.email}
                title={!client.email ? 'Sem email neste lead' : undefined}
              >
                <Mail size={16} />
                Email
              </Button>
              <Button $variant="secondary" onClick={registerCall} disabled={busy}>
                <Phone size={16} />
                Ligação
              </Button>
              <Button
                $variant="secondary"
                onClick={goNext}
                disabled={busy}
                $size="lg"
                title="Atalho: Enter"
              >
                {busy ? (
                  '…'
                ) : (
                  <>
                    <SkipForward size={16} />
                    Próximo
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </Actions>

            <Hint>W = WhatsApp · Enter = próximo</Hint>

            <Row style={{ marginTop: 16, justifyContent: 'center' }}>
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
