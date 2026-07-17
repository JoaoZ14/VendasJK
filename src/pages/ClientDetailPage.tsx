import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  Phone,
  Trash2,
} from 'lucide-react'
import styled from 'styled-components'
import {
  createActivity,
  deleteClient,
  fetchActivities,
  fetchClient,
  fetchTemplates,
  updateClient,
  updateClientStatus,
} from '../services/clients'
import type {
  Activity,
  Client,
  ClientStatus,
  MessageTemplate,
} from '../types'
import {
  ACTIVITY_TYPE_LABELS,
  CLIENT_TYPE_LABELS,
  TEMPLATE_CATEGORY_LABELS,
} from '../types'
import { ClientFormModal } from '../components/ClientFormModal'
import { StatusSelect } from '../components/StatusSelect'
import { useToast } from '../context/ToastContext'
import {
  Button,
  Card,
  CardTitle,
  EmptyState,
  Field,
  Input,
  Label,
  Page,
  PageHeader,
  PageSubtitle,
  PageTitle,
  Row,
  Select,
  Spinner,
  Stack,
  Textarea,
} from '../components/ui'
import {
  applyTemplateVars,
  formatDate,
  formatDateTime,
  fromDateInputValue,
  openWhatsApp,
  toDateInputValue,
} from '../utils/helpers'
import { prepareFirstContactEmail } from '../utils/emailTemplate'

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: ${({ theme }) => theme.space[4]};

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

const Meta = styled.dl`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[3]};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  dt {
    color: ${({ theme }) => theme.colors.muted};
  }

  dd {
    color: ${({ theme }) => theme.colors.ink};
    word-break: break-word;
  }
`

const Timeline = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`

const TimelineItem = styled.li`
  position: relative;
  padding-left: ${({ theme }) => theme.space[5]};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  margin-left: 6px;

  &::before {
    content: '';
    position: absolute;
    left: -5px;
    top: 4px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
  }

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    margin-bottom: ${({ theme }) => theme.space[1]};
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.muted};
    white-space: pre-wrap;
  }

  time {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.faint};
  }
`

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [client, setClient] = useState<Client | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [note, setNote] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [c, a, t] = await Promise.all([
        fetchClient(id),
        fetchActivities(id),
        fetchTemplates(),
      ])
      setClient(c)
      setActivities(a)
      setTemplates(t)
      setFollowUp(toDateInputValue(c.next_follow_up_at))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  )

  const messagePreview = useMemo(() => {
    if (!client || !selectedTemplate) return ''
    return applyTemplateVars(selectedTemplate.body, client)
  }, [client, selectedTemplate])

  async function handleStatus(status: ClientStatus) {
    if (!client) return
    const updated = await updateClientStatus(client.id, status)
    setClient(updated)
  }

  async function handleSaveFollowUp() {
    if (!client) return
    setBusy(true)
    try {
      const updated = await updateClient(client.id, {
        next_follow_up_at: fromDateInputValue(followUp),
      })
      setClient(updated)
    } finally {
      setBusy(false)
    }
  }

  async function handleNote() {
    if (!client || !note.trim()) return
    setBusy(true)
    try {
      await createActivity({
        client_id: client.id,
        type: 'observacao',
        content: note.trim(),
      })
      setNote('')
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function handleWhatsApp() {
    if (!client?.whatsapp) {
      toast('Cliente sem WhatsApp cadastrado.', 'danger')
      return
    }
    const msg =
      messagePreview ||
      `Olá${client.contact_name ? ` ${client.contact_name}` : ''}, tudo bem?`
    openWhatsApp(client.whatsapp, msg)
    await createActivity({
      client_id: client.id,
      type: 'whatsapp',
      content: msg,
    })
    if (client.status === 'nao_contatado') {
      await handleStatus('primeiro_contato')
    }
    await load()
  }

  async function handleEmail() {
    if (!client?.email) {
      toast('Cliente sem email cadastrado.', 'danger')
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
      if (client.status === 'nao_contatado') {
        await handleStatus('primeiro_contato')
      }
      await load()
      alert(
        'HTML copiado. Cole no corpo do Gmail com Ctrl+V e envie.',
      )
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Não foi possível preparar o e-mail.',
      )
    }
  }

  async function handleCall() {
    if (!client) return
    await createActivity({
      client_id: client.id,
      type: 'ligacao',
      content: 'Ligação registrada',
    })
    if (client.status === 'nao_contatado') {
      await handleStatus('primeiro_contato')
    }
    await load()
  }

  async function handleDelete() {
    if (!client) return
    if (!confirm(`Excluir ${client.company_name}?`)) return
    await deleteClient(client.id)
    navigate('/clientes')
  }

  if (loading) {
    return (
      <Page>
        <Spinner />
      </Page>
    )
  }

  if (error || !client) {
    return (
      <Page>
        <EmptyState>
          <strong>Cliente não encontrado</strong>
          <span>{error}</span>
          <Button $variant="secondary" onClick={() => navigate('/clientes')}>
            Voltar
          </Button>
        </EmptyState>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader>
        <div>
          <Row $gap={2} style={{ marginBottom: 8 }}>
            <Button
              $variant="ghost"
              $size="sm"
              onClick={() => navigate('/clientes')}
            >
              <ArrowLeft size={16} />
              Clientes
            </Button>
          </Row>
          <PageTitle>{client.company_name}</PageTitle>
          <PageSubtitle>
            {CLIENT_TYPE_LABELS[client.type]}
            {client.city ? ` · ${client.city}` : ''}
            {client.state ? `/${client.state}` : ''}
          </PageSubtitle>
        </div>
        <Row>
          <Button $variant="secondary" onClick={() => setEditOpen(true)}>
            Editar
          </Button>
          <Button $variant="danger" onClick={handleDelete}>
            <Trash2 size={16} />
            Excluir
          </Button>
        </Row>
      </PageHeader>

      <Row>
        <div style={{ minWidth: 200 }}>
          <Label>Status</Label>
          <StatusSelect value={client.status} onChange={handleStatus} />
        </div>
        <Button onClick={handleWhatsApp}>
          <MessageCircle size={16} />
          Enviar WhatsApp
        </Button>
        <Button $variant="secondary" onClick={handleEmail}>
          <Mail size={16} />
          Enviar Email
        </Button>
        <Button $variant="secondary" onClick={handleCall}>
          <Phone size={16} />
          Registrar Ligação
        </Button>
      </Row>

      <Grid>
        <Stack $gap={4}>
          <Card>
            <CardTitle>Informações</CardTitle>
            <Meta>
              <dt>Responsável</dt>
              <dd>{client.contact_name || '—'}</dd>
              <dt>Cargo</dt>
              <dd>{client.contact_role || '—'}</dd>
              <dt>Telefone</dt>
              <dd>{client.phone || '—'}</dd>
              <dt>WhatsApp</dt>
              <dd>{client.whatsapp || '—'}</dd>
              <dt>Email</dt>
              <dd>{client.email || '—'}</dd>
              <dt>Site</dt>
              <dd>
                {client.website ? (
                  <a href={client.website} target="_blank" rel="noreferrer">
                    {client.website}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
              <dt>Criado em</dt>
              <dd>{formatDate(client.created_at)}</dd>
              <dt>Último contato</dt>
              <dd>{formatDateTime(client.last_contact_at)}</dd>
            </Meta>
          </Card>

          <Card>
            <CardTitle>Observações</CardTitle>
            <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', color: 'oklch(0.62 0.015 230)' }}>
              {client.notes || 'Sem observações cadastradas.'}
            </p>
          </Card>

          <Card>
            <CardTitle>Modelo de mensagem</CardTitle>
            <Stack $gap={3}>
              <Select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">Mensagem livre / padrão</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({TEMPLATE_CATEGORY_LABELS[t.category]})
                  </option>
                ))}
              </Select>
              {selectedTemplate && (
                <Textarea readOnly value={messagePreview} rows={5} />
              )}
            </Stack>
          </Card>
        </Stack>

        <Stack $gap={4}>
          <Card>
            <CardTitle>Agendar follow-up</CardTitle>
            <Row>
              <Input
                type="date"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                style={{ maxWidth: 180 }}
              />
              <Button onClick={handleSaveFollowUp} disabled={busy}>
                Salvar
              </Button>
            </Row>
          </Card>

          <Card>
            <CardTitle>Registrar observação</CardTitle>
            <Stack $gap={3}>
              <Field>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anote o que aconteceu neste contato…"
                />
              </Field>
              <Button onClick={handleNote} disabled={busy || !note.trim()}>
                Salvar observação
              </Button>
            </Stack>
          </Card>

          <Card>
            <CardTitle>Histórico / Timeline</CardTitle>
            {activities.length === 0 ? (
              <EmptyState>
                <strong>Sem histórico</strong>
                <span>WhatsApp, email e notas aparecem aqui.</span>
              </EmptyState>
            ) : (
              <Timeline>
                {activities.map((a) => (
                  <TimelineItem key={a.id}>
                    <strong>{ACTIVITY_TYPE_LABELS[a.type]}</strong>
                    {a.content && <p>{a.content}</p>}
                    <time>{formatDateTime(a.created_at)}</time>
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </Card>
        </Stack>
      </Grid>

      <ClientFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={client}
        onSubmit={async (payload) => {
          const updated = await updateClient(client.id, payload)
          setClient(updated)
        }}
      />
    </Page>
  )
}
