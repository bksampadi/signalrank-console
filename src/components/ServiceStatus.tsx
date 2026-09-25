export type ServiceStatusValue =
  | 'not-connected'
  | 'checking'
  | 'online'
  | 'offline'

type ServiceStatusProps = {
  status: ServiceStatusValue
}

const statusLabels: Record<ServiceStatusValue, string> = {
  'not-connected': 'Not connected',
  checking: 'Checking…',
  online: 'Online',
  offline: 'Offline',
}

export function ServiceStatus({ status }: ServiceStatusProps) {
  return (
    <div className="service-status" data-status={status}>
      <span className="service-status__dot" aria-hidden="true" />
      <span>API {statusLabels[status]}</span>
    </div>
  )
}