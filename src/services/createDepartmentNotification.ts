import type { DepartmentNotification } from '../data/departmentNotification'
import { TARGET_DEPARTMENT_LABELS } from '../data/departmentNotification'
import type { DepartmentId, Incident } from '../data/dashboard'
import {
  departmentForGuestService,
  type GuestServiceId,
} from './createGuestIncident'
import { sendDepartmentMobileNotification } from './mobileNotifications'

function nextNotificationId(existing: DepartmentNotification[]): string {
  const max = existing.reduce((highest, row) => {
    const numeric = Number.parseInt(row.notificationId.replace('NOTIF-', ''), 10)
    return Number.isFinite(numeric) && numeric > highest ? numeric : highest
  }, 0)
  return `NOTIF-${max + 1}`
}

export function buildDepartmentNotificationMessage(
  room: string,
  service: string,
  department: string,
): string {
  return [
    'Nueva solicitud hotelera',
    `Habitación: ${room}`,
    `Servicio: ${service}`,
    `Departamento: ${department}`,
    'Estado: Pendiente',
  ].join('\n')
}

export function targetDepartmentLabel(department: DepartmentId): string {
  if (department === 'security') return 'Security'
  return TARGET_DEPARTMENT_LABELS[department]
}

export function preparedNotificationSummary(
  targetDepartment: string,
): string {
  return notificationDeliverySummary(targetDepartment, 'prepared')
}

export function notificationDeliverySummary(
  targetDepartment: string,
  deliveryStatus: DepartmentNotification['deliveryStatus'],
): string {
  switch (deliveryStatus) {
    case 'prepared':
      return `Notification prepared for ${targetDepartment}`
    case 'sending':
      return `Sending notification to ${targetDepartment}…`
    case 'sent':
      return `Notification sent to ${targetDepartment}`
    case 'failed':
      return `Notification failed for ${targetDepartment}`
    case 'missing-config':
      return `Notification not sent — missing configuration (${targetDepartment})`
  }
}

export function createDepartmentNotification(
  incident: Incident,
  existing: DepartmentNotification[],
): DepartmentNotification | null {
  const service = incident.service
  if (!service) return null

  const guestService = service as GuestServiceId
  const department = departmentForGuestService(guestService)
  const targetDepartment = targetDepartmentLabel(department)
  const timestamp = incident.createdAt ?? Date.now()

  return {
    notificationId: nextNotificationId(existing),
    incidentId: incident.id,
    room: incident.room,
    service,
    targetDepartment,
    message: buildDepartmentNotificationMessage(
      incident.room,
      incident.serviceCategory ?? guestService,
      targetDepartment,
    ),
    timestamp,
    deliveryStatus: 'prepared',
    channel: 'none',
  }
}

export type DepartmentNotificationStatusUpdate = (
  notificationId: string,
  update: Pick<DepartmentNotification, 'deliveryStatus' | 'channel'>,
) => void

/**
 * Dispatches a prepared notification to the configured mobile channel.
 * Runs asynchronously; report status via onStatusUpdate when provided.
 */
export function dispatchDepartmentNotification(
  notification: DepartmentNotification,
  onStatusUpdate?: DepartmentNotificationStatusUpdate,
): void {
  const report = (
    deliveryStatus: DepartmentNotification['deliveryStatus'],
    channel: DepartmentNotification['channel'],
  ) => {
    onStatusUpdate?.(notification.notificationId, { deliveryStatus, channel })
  }

  report('sending', notification.channel)

  void sendDepartmentMobileNotification(notification)
    .then((result) => {
      report(result.deliveryStatus, result.channel)
    })
    .catch(() => {
      report('failed', notification.channel === 'none' ? 'none' : notification.channel)
    })
}
