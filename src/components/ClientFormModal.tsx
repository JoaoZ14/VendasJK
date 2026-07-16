import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Client, ClientInsert } from '../types'
import { CLIENT_TYPE_LABELS, CLIENT_TYPES } from '../types'
import {
  Button,
  Field,
  FieldError,
  FormGrid,
  Input,
  Label,
  ModalBackdrop,
  ModalPanel,
  PageTitle,
  Row,
  Select,
  Stack,
  Textarea,
} from './ui'
import { StatusSelect } from './StatusSelect'
import { fromDateInputValue, toDateInputValue } from '../utils/helpers'

const schema = z.object({
  company_name: z.string().min(1, 'Informe o nome da empresa'),
  type: z.enum(CLIENT_TYPES),
  city: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  website: z.string().optional(),
  contact_name: z.string().optional(),
  contact_role: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum([
    'nao_contatado',
    'primeiro_contato',
    'aguardando_resposta',
    'negociacao',
    'cliente',
    'perdido',
  ]),
  next_follow_up_at: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function emptyValues(): FormValues {
  return {
    company_name: '',
    type: 'empresa',
    city: '',
    state: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    contact_name: '',
    contact_role: '',
    notes: '',
    status: 'nao_contatado',
    next_follow_up_at: '',
  }
}

function fromClient(client: Client): FormValues {
  return {
    company_name: client.company_name,
    type: client.type,
    city: client.city ?? '',
    state: client.state ?? '',
    phone: client.phone ?? '',
    whatsapp: client.whatsapp ?? '',
    email: client.email ?? '',
    website: client.website ?? '',
    contact_name: client.contact_name ?? '',
    contact_role: client.contact_role ?? '',
    notes: client.notes ?? '',
    status: client.status,
    next_follow_up_at: toDateInputValue(client.next_follow_up_at),
  }
}

function toPayload(values: FormValues, preserve?: Client | null): ClientInsert {
  return {
    company_name: values.company_name.trim(),
    type: values.type,
    city: values.city?.trim() || null,
    state: values.state?.trim() || null,
    phone: values.phone?.trim() || null,
    whatsapp: values.whatsapp?.trim() || null,
    email: values.email?.trim() || null,
    website: values.website?.trim() || null,
    contact_name: values.contact_name?.trim() || null,
    contact_role: values.contact_role?.trim() || null,
    notes: values.notes?.trim() || null,
    status: values.status,
    last_contact_at: preserve?.last_contact_at ?? null,
    next_follow_up_at: fromDateInputValue(values.next_follow_up_at ?? ''),
  }
}

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (payload: ClientInsert) => Promise<void>
  initial?: Client | null
  title?: string
}

export function ClientFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  title,
}: Props) {
  const [showMore, setShowMore] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues(),
  })

  useEffect(() => {
    if (!open) return
    reset(initial ? fromClient(initial) : emptyValues())
    setShowMore(Boolean(initial))
  }, [open, initial, reset])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <ModalBackdrop
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <ModalPanel>
        <Stack $gap={5}>
          <PageTitle style={{ fontSize: '1.375rem' }}>
            {title ?? (initial ? 'Editar lead' : 'Novo lead')}
          </PageTitle>
          <form
            onSubmit={handleSubmit(async (values) => {
              await onSubmit(toPayload(values, initial))
              onClose()
            })}
          >
            <Stack $gap={4}>
              <FormGrid>
                <Field>
                  <Label htmlFor="company_name">Empresa / lead</Label>
                  <Input id="company_name" {...register('company_name')} />
                  {errors.company_name && (
                    <FieldError>{errors.company_name.message}</FieldError>
                  )}
                </Field>
                <Field>
                  <Label htmlFor="type">Tipo</Label>
                  <Select id="type" {...register('type')}>
                    <optgroup label="Vendas">
                      {(['empresa', 'landing', 'site', 'outro'] as const).map(
                        (t) => (
                          <option key={t} value={t}>
                            {CLIENT_TYPE_LABELS[t]}
                          </option>
                        ),
                      )}
                    </optgroup>
                    <optgroup label="Hospedagem (legado)">
                      {(
                        ['hotel', 'pousada', 'resort', 'hostel'] as const
                      ).map((t) => (
                        <option key={t} value={t}>
                          {CLIENT_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </optgroup>
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="contact_name">Responsável</Label>
                  <Input id="contact_name" {...register('contact_name')} />
                </Field>
                <Field>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" {...register('whatsapp')} />
                </Field>
                <Field>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register('email')} />
                  {errors.email && <FieldError>{errors.email.message}</FieldError>}
                </Field>
                <Field>
                  <Label htmlFor="status">Status</Label>
                  <StatusSelect
                    value={watch('status')}
                    onChange={(s) => setValue('status', s)}
                  />
                </Field>
              </FormGrid>

              {!showMore ? (
                <Button
                  type="button"
                  $variant="ghost"
                  onClick={() => setShowMore(true)}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Mais detalhes
                </Button>
              ) : (
                <>
                  <FormGrid>
                    <Field>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" {...register('phone')} />
                    </Field>
                    <Field>
                      <Label htmlFor="website">Site</Label>
                      <Input id="website" {...register('website')} />
                    </Field>
                    <Field>
                      <Label htmlFor="city">Cidade</Label>
                      <Input id="city" {...register('city')} />
                    </Field>
                    <Field>
                      <Label htmlFor="state">Estado</Label>
                      <Input id="state" {...register('state')} />
                    </Field>
                    <Field>
                      <Label htmlFor="contact_role">Cargo</Label>
                      <Input id="contact_role" {...register('contact_role')} />
                    </Field>
                    <Field>
                      <Label htmlFor="next_follow_up_at">Próximo follow-up</Label>
                      <Input
                        id="next_follow_up_at"
                        type="date"
                        {...register('next_follow_up_at')}
                      />
                    </Field>
                  </FormGrid>
                  <Field>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea id="notes" {...register('notes')} />
                  </Field>
                </>
              )}

              <Row $gap={3} style={{ justifyContent: 'flex-end' }}>
                <Button type="button" $variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando…' : 'Salvar'}
                </Button>
              </Row>
            </Stack>
          </form>
        </Stack>
      </ModalPanel>
    </ModalBackdrop>
  )
}
