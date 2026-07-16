import { Navigate, Outlet } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui'
import styled from 'styled-components'

const Loading = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
`

export function AppLayout() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <Loading>
        <Spinner />
      </Loading>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
