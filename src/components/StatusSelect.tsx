import type { ClientStatus } from '../types'
import { CLIENT_STATUS_LABELS } from '../types'
import { Badge, Select } from './ui'

export function statusTone(
  status: ClientStatus,
): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'nao_contatado':
      return 'default'
    case 'primeiro_contato':
      return 'primary'
    case 'aguardando_resposta':
      return 'warning'
    case 'negociacao':
      return 'primary'
    case 'cliente':
      return 'success'
    case 'perdido':
      return 'danger'
    default:
      return 'default'
  }
}

export function StatusBadge({ status }: { status: ClientStatus }) {
  return <Badge $tone={statusTone(status)}>{CLIENT_STATUS_LABELS[status]}</Badge>
}

export function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: ClientStatus
  onChange: (status: ClientStatus) => void
  disabled?: boolean
}) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as ClientStatus)}
      aria-label="Status do cliente"
    >
      {(Object.keys(CLIENT_STATUS_LABELS) as ClientStatus[]).map((key) => (
        <option key={key} value={key}>
          {CLIENT_STATUS_LABELS[key]}
        </option>
      ))}
    </Select>
  )
}
