import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import styled, { keyframes } from 'styled-components'
import { theme } from '../styles/theme'

type ToastTone = 'info' | 'success' | 'danger'

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void
}

const ToastCtx = createContext<ToastContextValue | null>(null)

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const Viewport = styled.div`
  position: fixed;
  right: ${theme.space[4]};
  bottom: ${theme.space[4]};
  z-index: ${theme.z.toast};
  display: flex;
  flex-direction: column;
  gap: ${theme.space[2]};
  max-width: min(360px, calc(100vw - 32px));
  pointer-events: none;

  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
    }
  }
`

const ToastCard = styled.div<{ $tone: ToastTone }>`
  pointer-events: auto;
  padding: ${theme.space[3]} ${theme.space[4]};
  border-radius: ${theme.radii.md};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.elevated};
  color: ${theme.colors.ink};
  font-size: ${theme.fontSizes.sm};
  box-shadow: ${theme.shadows.md};
  animation: ${slideIn} ${theme.motion.base} ${theme.motion.ease};

  ${({ $tone }) => {
    if ($tone === 'success')
      return `border-color: ${theme.colors.successMuted}; color: ${theme.colors.success};`
    if ($tone === 'danger')
      return `border-color: ${theme.colors.dangerMuted}; color: ${theme.colors.danger};`
    return ''
  }}
`

let toastSeq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = ++toastSeq
    setItems((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <Viewport aria-live="polite">
        {items.map((t) => (
          <ToastCard key={t.id} $tone={t.tone} role="status">
            {t.message}
          </ToastCard>
        ))}
      </Viewport>
    </ToastCtx.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastCtx)
  if (!ctx) {
    return {
      toast: (message) => {
        window.alert(message)
      },
    }
  }
  return ctx
}
