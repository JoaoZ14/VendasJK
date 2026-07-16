import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import styled from 'styled-components'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../services/supabase'
import {
  Button,
  Field,
  FieldError,
  Input,
  Label,
  PageTitle,
  Spinner,
  Stack,
} from '../components/ui'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormValues = z.infer<typeof schema>

const Screen = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.space[4]};
  background:
    radial-gradient(
      ellipse 80% 50% at 50% -20%,
      oklch(0.28 0.06 230 / 0.45),
      transparent
    ),
    ${({ theme }) => theme.colors.bg};
`

const Panel = styled.div`
  width: min(400px, 100%);
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: ${({ theme }) => theme.space[8]};
`

const Brand = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin-bottom: ${({ theme }) => theme.space[2]};
`

const Hint = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.space[6]};
`

const Toggle = styled.button`
  margin-top: ${({ theme }) => theme.space[4]};
  width: 100%;
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`

const Alert = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.dangerMuted};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.space[3]};
`

const Warn = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.warning};
  background: ${({ theme }) => theme.colors.warningMuted};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.space[3]};
  margin-bottom: ${({ theme }) => theme.space[4]};
`

export function LoginPage() {
  const { session, loading, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  if (loading) {
    return (
      <Screen>
        <Spinner />
      </Screen>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return (
    <Screen>
      <Panel>
        <Brand>CRM Pessoal</Brand>
        <PageTitle style={{ fontSize: '1.75rem' }}>
          {mode === 'login' ? 'Entrar' : 'Criar conta'}
        </PageTitle>
        <Hint>Só você. Sem equipe, sem ruído.</Hint>

        {!isSupabaseConfigured && (
          <Warn>
            Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env`.
          </Warn>
        )}

        <form
          onSubmit={handleSubmit(async (values) => {
            setError(null)
            setInfo(null)
            try {
              if (mode === 'login') {
                await signIn(values.email, values.password)
              } else {
                await signUp(values.email, values.password)
                setInfo(
                  'Conta criada. Se a confirmação de email estiver ativa no Supabase, verifique sua caixa de entrada.',
                )
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Falha na autenticação')
            }
          })}
        >
          <Stack $gap={4}>
            <Field>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </Field>
            <Field>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                {...register('password')}
              />
              {errors.password && (
                <FieldError>{errors.password.message}</FieldError>
              )}
            </Field>
            {error && <Alert>{error}</Alert>}
            {info && <Warn>{info}</Warn>}
            <Button type="submit" $full $size="lg" disabled={isSubmitting}>
              {isSubmitting
                ? 'Aguarde…'
                : mode === 'login'
                  ? 'Entrar'
                  : 'Criar conta'}
            </Button>
          </Stack>
        </form>

        <Toggle
          type="button"
          onClick={() => {
            setMode((m) => (m === 'login' ? 'signup' : 'login'))
            setError(null)
            setInfo(null)
          }}
        >
          {mode === 'login'
            ? 'Não tem conta? Criar uma'
            : 'Já tem conta? Entrar'}
        </Toggle>
      </Panel>
    </Screen>
  )
}
