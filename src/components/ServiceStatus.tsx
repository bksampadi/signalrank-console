type ServiceStatusProps = {
    status: 'not-connected' | 'online' | 'offline'
}

const statusLabels ={
    'not-connected': 'Not connected',
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