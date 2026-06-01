export type Priority = 'critical' | 'high' | 'normal' | 'medium' | 'low'
export type IncidentStatus =
  | 'pending'
  | 'open'
  | 'in_progress'
  | 'escalated'
  | 'resolved'
export type DepartmentId =
  | 'housekeeping'
  | 'maintenance'
  | 'reception'
  | 'security'

/** Reserved for Telegram / WhatsApp dispatch (not wired yet). */
export type NotificationChannel = 'telegram' | 'whatsapp'

export interface IncidentNotificationSlot {
  queuedAt?: number
  sentAt?: number
  failedAt?: number
}

/** Reserved for outbound alerts (not wired yet). */
export interface IncidentNotifications {
  telegram?: IncidentNotificationSlot
  whatsapp?: IncidentNotificationSlot
}

/** Reserved for SLA timers (not wired yet). */
export interface IncidentSla {
  targetMinutes: number
  startedAt: number
  dueAt: number
  breached?: boolean
}

/** Reserved for escalation workflow (not wired yet). */
export interface IncidentEscalation {
  level: number
  escalatedAt?: number
  reason?: string
}

export interface Incident {
  id: string
  room: string
  department: DepartmentId
  /** Guest-facing service label (e.g. Towels, Air Conditioning). */
  serviceCategory?: string
  priority: Priority
  status: IncidentStatus
  time: string
  description: string
  source?: 'guest' | 'ops'
  language?: string
  service?: string
  createdAt?: number
  /** Optional free-text detail from the guest QR flow. */
  guestMessage?: string
  /** Reserved for themed priority badges (not wired yet). */
  priorityColorKey?: Priority
  notifications?: IncidentNotifications
  sla?: IncidentSla
  escalation?: IncidentEscalation
}

export interface Department {
  id: DepartmentId
  label: string
  online: boolean
  staffCount: number
  activeTasks: number
  load: 'low' | 'normal' | 'high'
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'housekeeping',
    label: 'Limpieza',
    online: true,
    staffCount: 14,
    activeTasks: 6,
    load: 'normal',
  },
  {
    id: 'maintenance',
    label: 'Mantenimiento',
    online: true,
    staffCount: 8,
    activeTasks: 3,
    load: 'low',
  },
  {
    id: 'reception',
    label: 'Recepción',
    online: true,
    staffCount: 6,
    activeTasks: 11,
    load: 'high',
  },
  {
    id: 'security',
    label: 'Seguridad',
    online: true,
    staffCount: 5,
    activeTasks: 2,
    load: 'low',
  },
]

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-2841',
    room: '1204',
    department: 'maintenance',
    priority: 'critical',
    status: 'in_progress',
    time: '14:02',
    description: 'Fallo de climatización — temperatura de la suite por encima del umbral',
  },
  {
    id: 'INC-2839',
    room: '805',
    department: 'housekeeping',
    priority: 'high',
    status: 'open',
    time: '13:48',
    description: 'Servicio VIP retrasado — llegada del huésped en 45 min',
  },
  {
    id: 'INC-2836',
    room: 'Lobby',
    department: 'reception',
    priority: 'medium',
    status: 'in_progress',
    time: '13:31',
    description: 'Cola de check-in de grupo supera el objetivo SLA',
  },
  {
    id: 'INC-2834',
    room: 'P3',
    department: 'security',
    priority: 'high',
    status: 'escalated',
    time: '13:12',
    description: 'Panel de acceso intermitente — aparcamiento nivel 3',
  },
  {
    id: 'INC-2831',
    room: '1512',
    department: 'housekeeping',
    priority: 'low',
    status: 'resolved',
    time: '12:55',
    description: 'Amenities extra entregados — solicitud cerrada',
  },
  {
    id: 'INC-2828',
    room: '602',
    department: 'maintenance',
    priority: 'medium',
    status: 'open',
    time: '12:40',
    description: 'Presión de ducha baja — mantenimiento enviado',
  },
  {
    id: 'INC-2825',
    room: '2101',
    department: 'reception',
    priority: 'low',
    status: 'resolved',
    time: '12:18',
    description: 'Salida tardía aprobada — facturación actualizada',
  },
]

/** @deprecated Use INITIAL_INCIDENTS — kept for seed data reference */
export const INCIDENTS = INITIAL_INCIDENTS

export const KPI_BASE = {
  activeIncidents: 12,
  resolvedToday: 47,
  avgResponseMinutes: 8,
  avgResponseSeconds: 24,
  departmentsOnline: 4,
  departmentsTotal: 4,
}
