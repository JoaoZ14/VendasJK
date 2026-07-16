import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import styled from 'styled-components'
import {
  createTemplate,
  deleteTemplate,
  fetchTemplates,
  updateTemplate,
} from '../services/clients'
import type { MessageTemplate, TemplateCategory } from '../types'
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_CATEGORY_LABELS,
} from '../types'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  FieldError,
  Input,
  Label,
  ModalBackdrop,
  ModalPanel,
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

const schema = z.object({
  name: z.string().min(1, 'Informe um nome'),
  category: z.enum(TEMPLATE_CATEGORIES),
  subject: z.string().optional(),
  body: z.string().min(1, 'Informe a mensagem'),
})

type FormValues = z.infer<typeof schema>

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.space[4]};
`

const Hint = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.muted};
`

const BodyPreview = styled.pre`
  white-space: pre-wrap;
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.muted};
  margin-top: ${({ theme }) => theme.space[3]};
  line-height: 1.5;
`

export function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MessageTemplate | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      category: 'primeiro_contato',
      subject: '',
      body: '',
    },
  })

  async function refresh() {
    setLoading(true)
    try {
      setTemplates(await fetchTemplates())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  function openCreate() {
    setEditing(null)
    reset({
      name: '',
      category: 'primeiro_contato',
      subject: '',
      body: 'Olá {responsavel}, tudo bem?\n\nSou da [sua empresa] e gostaria de falar com {cliente} em {cidade}.',
    })
    setOpen(true)
  }

  function openEdit(t: MessageTemplate) {
    setEditing(t)
    reset({
      name: t.name,
      category: t.category,
      subject: t.subject ?? '',
      body: t.body,
    })
    setOpen(true)
  }

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Modelos de Mensagem</PageTitle>
          <PageSubtitle>
            Variáveis: {'{cliente}'} · {'{cidade}'} · {'{responsavel}'}
          </PageSubtitle>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Novo modelo
        </Button>
      </PageHeader>

      {loading ? (
        <Spinner />
      ) : templates.length === 0 ? (
        <EmptyState>
          <strong>Nenhum modelo</strong>
          <span>Crie o primeiro para acelerar WhatsApp e email.</span>
          <Button onClick={openCreate}>
            <Plus size={16} />
            Novo modelo
          </Button>
        </EmptyState>
      ) : (
        <Grid>
          {templates.map((t) => (
            <Card key={t.id}>
              <Row style={{ justifyContent: 'space-between' }}>
                <strong>{t.name}</strong>
                <Badge $tone="primary">
                  {TEMPLATE_CATEGORY_LABELS[t.category]}
                </Badge>
              </Row>
              {t.subject && (
                <Hint style={{ marginTop: 8 }}>Assunto: {t.subject}</Hint>
              )}
              <BodyPreview>{t.body}</BodyPreview>
              <Row style={{ marginTop: 16 }}>
                <Button $size="sm" $variant="secondary" onClick={() => openEdit(t)}>
                  Editar
                </Button>
                <Button
                  $size="sm"
                  $variant="danger"
                  onClick={async () => {
                    if (!confirm('Excluir este modelo?')) return
                    await deleteTemplate(t.id)
                    await refresh()
                  }}
                >
                  <Trash2 size={14} />
                  Excluir
                </Button>
              </Row>
            </Card>
          ))}
        </Grid>
      )}

      {open && (
        <ModalBackdrop
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <ModalPanel>
            <Stack $gap={4}>
              <PageTitle style={{ fontSize: '1.25rem' }}>
                {editing ? 'Editar modelo' : 'Novo modelo'}
              </PageTitle>
              <Hint>
                Use {'{cliente}'}, {'{cidade}'} e {'{responsavel}'} no texto.
              </Hint>
              <form
                onSubmit={handleSubmit(async (values) => {
                  const payload = {
                    name: values.name,
                    category: values.category as TemplateCategory,
                    subject: values.subject || null,
                    body: values.body,
                  }
                  if (editing) {
                    await updateTemplate(editing.id, payload)
                  } else {
                    await createTemplate(payload)
                  }
                  setOpen(false)
                  await refresh()
                })}
              >
                <Stack $gap={4}>
                  <Field>
                    <Label>Nome</Label>
                    <Input {...register('name')} />
                    {errors.name && (
                      <FieldError>{errors.name.message}</FieldError>
                    )}
                  </Field>
                  <Field>
                    <Label>Categoria</Label>
                    <Select {...register('category')}>
                      {TEMPLATE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {TEMPLATE_CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field>
                    <Label>Assunto (email)</Label>
                    <Input {...register('subject')} />
                  </Field>
                  <Field>
                    <Label>Mensagem</Label>
                    <Textarea rows={8} {...register('body')} />
                    {errors.body && (
                      <FieldError>{errors.body.message}</FieldError>
                    )}
                  </Field>
                  <Row style={{ justifyContent: 'flex-end' }}>
                    <Button
                      type="button"
                      $variant="ghost"
                      onClick={() => setOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      Salvar
                    </Button>
                  </Row>
                </Stack>
              </form>
            </Stack>
          </ModalPanel>
        </ModalBackdrop>
      )}
    </Page>
  )
}
