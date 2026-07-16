import styled, { css, keyframes } from 'styled-components'

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[6]};
  animation: ${fadeIn} ${({ theme }) => theme.motion.slow}
    ${({ theme }) => theme.motion.ease};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

export const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[4]};
  flex-wrap: wrap;
`

export const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: -0.03em;
  line-height: 1.2;
`

export const PageSubtitle = styled.p`
  margin-top: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

export const Card = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: ${({ theme }) => theme.space[5]};
`

export const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: -0.02em;
  margin-bottom: ${({ theme }) => theme.space[4]};
`

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

export const Button = styled.button<{
  $variant?: ButtonVariant
  $size?: ButtonSize
  $full?: boolean
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[2]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  transition:
    background ${({ theme }) => theme.motion.base} ${({ theme }) => theme.motion.ease},
    border-color ${({ theme }) => theme.motion.base} ${({ theme }) => theme.motion.ease},
    opacity ${({ theme }) => theme.motion.fast} ${({ theme }) => theme.motion.ease};
  width: ${({ $full }) => ($full ? '100%' : 'auto')};

  ${({ $size = 'md', theme }) => {
    if ($size === 'sm')
      return css`
        height: 32px;
        padding: 0 ${theme.space[3]};
        font-size: ${theme.fontSizes.sm};
      `
    if ($size === 'lg')
      return css`
        height: 48px;
        padding: 0 ${theme.space[6]};
        font-size: ${theme.fontSizes.lg};
      `
    return css`
      height: 38px;
      padding: 0 ${theme.space[4]};
      font-size: ${theme.fontSizes.md};
    `
  }}

  ${({ $variant = 'primary', theme }) => {
    if ($variant === 'secondary')
      return css`
        background: ${theme.colors.elevated};
        color: ${theme.colors.ink};
        border: 1px solid ${theme.colors.border};
        &:hover:not(:disabled) {
          border-color: ${theme.colors.borderHover};
          background: ${theme.colors.border};
        }
      `
    if ($variant === 'ghost')
      return css`
        background: transparent;
        color: ${theme.colors.muted};
        border: 1px solid transparent;
        &:hover:not(:disabled) {
          color: ${theme.colors.ink};
          background: ${theme.colors.elevated};
        }
      `
    if ($variant === 'danger')
      return css`
        background: ${theme.colors.dangerMuted};
        color: ${theme.colors.danger};
        border: 1px solid transparent;
        &:hover:not(:disabled) {
          background: oklch(0.35 0.08 25);
        }
      `
    return css`
      background: ${theme.colors.primary};
      color: oklch(0.98 0 0);
      border: 1px solid transparent;
      &:hover:not(:disabled) {
        background: ${theme.colors.primaryHover};
      }
    `
  }}

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

export const IconButton = styled(Button)`
  width: 34px;
  height: 34px;
  padding: 0;
`

export const Input = styled.input`
  width: 100%;
  height: 38px;
  padding: 0 ${({ theme }) => theme.space[3]};
  background: ${({ theme }) => theme.colors.elevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.ink};
  transition: border-color ${({ theme }) => theme.motion.fast}
    ${({ theme }) => theme.motion.ease};

  &::placeholder {
    color: ${({ theme }) => theme.colors.faint};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderHover};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primaryMuted};
  }
`

export const Textarea = styled.textarea`
  width: 100%;
  min-height: 96px;
  padding: ${({ theme }) => theme.space[3]};
  background: ${({ theme }) => theme.colors.elevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.ink};
  resize: vertical;
  transition: border-color ${({ theme }) => theme.motion.fast}
    ${({ theme }) => theme.motion.ease};

  &::placeholder {
    color: ${({ theme }) => theme.colors.faint};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primaryMuted};
  }
`

export const Select = styled.select`
  width: 100%;
  height: 38px;
  padding: 0 ${({ theme }) => theme.space[3]};
  background: ${({ theme }) => theme.colors.elevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.ink};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primaryMuted};
  }
`

export const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: ${({ theme }) => theme.space[2]};
`

export const Field = styled.div`
  display: flex;
  flex-direction: column;
`

export const FieldError = styled.span`
  margin-top: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.danger};
`

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.space[4]};
`

export const Badge = styled.span<{ $tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 ${({ theme }) => theme.space[2]};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  white-space: nowrap;

  ${({ $tone = 'default', theme }) => {
    if ($tone === 'primary')
      return css`
        background: ${theme.colors.primaryMuted};
        color: ${theme.colors.primary};
      `
    if ($tone === 'success')
      return css`
        background: ${theme.colors.successMuted};
        color: ${theme.colors.success};
      `
    if ($tone === 'warning')
      return css`
        background: ${theme.colors.warningMuted};
        color: ${theme.colors.warning};
      `
    if ($tone === 'danger')
      return css`
        background: ${theme.colors.dangerMuted};
        color: ${theme.colors.danger};
      `
    return css`
      background: ${theme.colors.elevated};
      color: ${theme.colors.muted};
      border: 1px solid ${theme.colors.border};
    `
  }}
`

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[10]} ${({ theme }) => theme.space[4]};
  text-align: center;
  color: ${({ theme }) => theme.colors.muted};

  strong {
    color: ${({ theme }) => theme.colors.ink};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }
`

export const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    border-top-color: ${({ theme }) => theme.colors.primary};
  }
`

export const Stack = styled.div<{ $gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme, $gap = 4 }) => theme.space[$gap]};
`

export const Row = styled.div<{ $gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 }>`
  display: flex;
  align-items: center;
  gap: ${({ theme, $gap = 3 }) => theme.space[$gap]};
  flex-wrap: wrap;
`

export const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
`

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  th,
  td {
    text-align: left;
    padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    white-space: nowrap;
  }

  th {
    color: ${({ theme }) => theme.colors.muted};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    background: ${({ theme }) => theme.colors.elevated};
  }

  tr:last-child td {
    border-bottom: none;
  }

  tbody tr {
    transition: background ${({ theme }) => theme.motion.fast}
      ${({ theme }) => theme.motion.ease};
    cursor: pointer;

    &:hover {
      background: ${({ theme }) => theme.colors.elevated};
    }
  }
`

export const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.z.modalBackdrop};
  background: ${({ theme }) => theme.colors.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.space[4]};
  animation: ${fadeIn} ${({ theme }) => theme.motion.base}
    ${({ theme }) => theme.motion.ease};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

export const ModalPanel = styled.div`
  width: min(640px, 100%);
  max-height: min(90vh, 800px);
  overflow: auto;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.space[6]};
  z-index: ${({ theme }) => theme.z.modal};
`

export const ChipButton = styled.button<{ $active?: boolean }>`
  height: 32px;
  padding: 0 ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.primary : theme.colors.border};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primaryMuted : theme.colors.elevated};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primary : theme.colors.muted};
  transition:
    background ${({ theme }) => theme.motion.fast} ${({ theme }) => theme.motion.ease},
    border-color ${({ theme }) => theme.motion.fast} ${({ theme }) => theme.motion.ease};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderHover};
    color: ${({ theme }) => theme.colors.ink};
  }
`
