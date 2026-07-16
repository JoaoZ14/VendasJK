import type { ReactNode } from 'react'
import styled from 'styled-components'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  MessageSquareText,
  Settings,
  Crosshair,
  MapPinned,
  LogOut,
} from 'lucide-react'
import { theme } from '../../styles/theme'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui'

const Shell = styled.div`
  display: grid;
  grid-template-columns: ${theme.layout.sidebarWidth} 1fr;
  min-height: 100vh;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const Sidebar = styled.aside`
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: ${theme.space[6]};
  padding: ${theme.space[5]} ${theme.space[4]};
  background: ${theme.colors.surface};
  border-right: 1px solid ${theme.colors.border};

  @media (max-width: 900px) {
    position: relative;
    height: auto;
    border-right: none;
    border-bottom: 1px solid ${theme.colors.border};
  }
`

const Brand = styled.div`
  padding: 0 ${theme.space[2]};

  strong {
    display: block;
    font-size: ${theme.fontSizes.lg};
    font-weight: ${theme.fontWeights.semibold};
    letter-spacing: -0.03em;
  }

  span {
    font-size: ${theme.fontSizes.xs};
    color: ${theme.colors.muted};
  }
`

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${theme.space[1]};
  flex: 1;
`

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${theme.space[3]};
  height: 38px;
  padding: 0 ${theme.space[3]};
  border-radius: ${theme.radii.md};
  color: ${theme.colors.muted};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  transition:
    background ${theme.motion.fast} ${theme.motion.ease},
    color ${theme.motion.fast} ${theme.motion.ease};

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  &:hover {
    color: ${theme.colors.ink};
    background: ${theme.colors.elevated};
  }

  &.active {
    background: ${theme.colors.primaryMuted};
    color: ${theme.colors.primary};
  }
`

const Main = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: ${theme.z.sticky};
  height: ${theme.layout.headerHeight};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${theme.space[6]};
  background: oklch(0.09 0 0 / 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid ${theme.colors.border};

  @media (max-width: 900px) {
    padding: 0 ${theme.space[4]};
  }
`

const HeaderHint = styled.p`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.muted};
`

const Content = styled.main`
  flex: 1;
  padding: ${theme.space[6]};

  @media (max-width: 900px) {
    padding: ${theme.space[4]};
  }
`

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/buscar-hoteis', label: 'Buscar hotéis', icon: MapPinned },
  { to: '/prospeccao', label: 'Modo Prospecção', icon: Crosshair },
  { to: '/modelos', label: 'Modelos', icon: MessageSquareText },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()

  return (
    <Shell>
      <Sidebar>
        <Brand>
          <strong>CRM Pessoal</strong>
          <span>{user?.email ?? 'Conta conectada'}</span>
        </Brand>
        <Nav>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavItem key={to} to={to} end={end}>
              <Icon />
              {label}
            </NavItem>
          ))}
        </Nav>
        <Button
          type="button"
          $variant="ghost"
          $full
          onClick={() => void signOut()}
          style={{ justifyContent: 'flex-start', gap: 12 }}
        >
          <LogOut size={18} />
          Sair
        </Button>
      </Sidebar>
      <Main>
        <Header>
          <HeaderHint>Poucos cliques. Próximo contato.</HeaderHint>
          <HeaderHint>Dados no Supabase</HeaderHint>
        </Header>
        <Content>{children}</Content>
      </Main>
    </Shell>
  )
}
