import type { DepartmentId } from './dashboard'

export type DepartmentNotificationDeliveryStatus =
  | 'prepared'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'missing-config'

export type DepartmentNotificationChannel = 'webhook' | 'telegram' | 'none'

export interface DepartmentNotification {
  notificationId: string
  incidentId: string
  room: string
  service: string
  targetDepartment: string
  message: string
  timestamp: number
  deliveryStatus: DepartmentNotificationDeliveryStatus
  channel: DepartmentNotificationChannel
}

export const TARGET_DEPARTMENT_LABELS: Record<
  Exclude<DepartmentId, 'security'>,
  string
> = {
  housekeeping: 'Housekeeping',
  maintenance: 'Maintenance',
  reception: 'Reception',
}
