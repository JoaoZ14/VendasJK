import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { fetchSettings, updateSettings } from '../services/clients'
import { useToast } from '../context/ToastContext'
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

const Hint = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.muted};
`

export function SettingsPage() {
  const { toast } = useToast()
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
            Leads sem interação há X dias entram no filtro da lista.
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
                  try {
                    await updateSettings(days)
                    toast('Preferência salva.', 'success')
                  } catch {
                    toast('Não foi possível salvar.', 'danger')
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
            </Stack>
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
