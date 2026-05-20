/** @typedef {'housekeeping' | 'maintenance' | 'reception' | 'security'} DepartmentId */
/** @typedef {'pending' | 'open' | 'in_progress' | 'escalated' | 'resolved'} IncidentStatus */

/**
 * @typedef {object} GuestRequestBody
 * @property {string} room
 * @property {'es' | 'en' | 'de' | 'fr'} language
 * @property {string} service
 * @property {string} serviceLabel
 */

const LANGUAGE_LABELS = {
  es: 'Español',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
}

const DEPARTMENT_LABELS = {
  housekeeping: 'Housekeeping',
  maintenance: 'Maintenance',
  reception: 'Reception',
}

/** @type {import('./incidentOps.mjs').Incident[]} */
export const INITIAL_INCIDENTS = [
  {
    id: 'INC-2841',
    room: '1204',
    department: 'maintenance',
    priority: 'critical',
    status: 'in_progress',
    time: '14:02',
    description: 'HVAC failure — suite temperature above threshold',
  },
  {
    id: 'INC-2839',
    room: '805',
    department: 'housekeeping',
    priority: 'high',
    status: 'open',
    time: '13:48',
    description: 'VIP turndown delayed — guest arrival in 45 min',
  },
  {
    id: 'INC-2836',
    room: 'Lobby',
    department: 'reception',
    priority: 'medium',
    status: 'in_progress',
    time: '13:31',
    description: 'Group check-in queue exceeding SLA target',
  },
  {
    id: 'INC-2834',
    room: 'P3',
    department: 'security',
    priority: 'high',
    status: 'escalated',
    time: '13:12',
    description: 'Access panel intermittent — parking level 3',
  },
  {
    id: 'INC-2831',
    room: '1512',
    department: 'housekeeping',
    priority: 'low',
    status: 'resolved',
    time: '12:55',
    description: 'Extra amenities delivered — request closed',
  },
  {
    id: 'INC-2828',
    room: '602',
    department: 'maintenance',
    priority: 'medium',
    status: 'open',
    time: '12:40',
    description: 'Shower pressure low — engineering dispatched',
  },
  {
    id: 'INC-2825',
    room: '2101',
    department: 'reception',
    priority: 'low',
    status: 'resolved',
    time: '12:18',
    description: 'Late checkout approved — billing updated',
  },
]

/**
 * @param {string} service
 * @returns {DepartmentId}
 */
export function departmentForGuestService(service) {
  switch (service) {
    case 'towels':
    case 'cleaning':
    case 'pillows':
    case 'blankets':
      return 'housekeeping'
    case 'air-conditioning':
    case 'maintenance':
      return 'maintenance'
    case 'other':
      return 'reception'
    default:
      return 'reception'
  }
}

/**
 * @param {import('./incidentOps.mjs').Incident[]} existing
 */
function nextIncidentId(existing) {
  const max = existing.reduce((highest, incident) => {
    const numeric = Number.parseInt(String(incident.id).replace('INC-', ''), 10)
    return Number.isFinite(numeric) && numeric > highest ? numeric : highest
  }, 0)
  return `INC-${max + 1}`
}

function formatIncidentTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * @param {GuestRequestBody} payload
 * @param {import('./incidentOps.mjs').Incident[]} existing
 */
export function createGuestIncident(payload, existing) {
  const createdAt =
    typeof payload.createdAt === 'number' && Number.isFinite(payload.createdAt)
      ? payload.createdAt
      : Date.now()
  const languageLabel = LANGUAGE_LABELS[payload.language] ?? payload.language
  const department =
    typeof payload.department === 'string'
      ? payload.department
      : departmentForGuestService(payload.service)
  const status = payload.status === 'pending' ? 'pending' : 'pending'

  return {
    id: nextIncidentId(existing),
    room: payload.room,
    department,
    serviceCategory: payload.serviceLabel,
    priority: 'normal',
    priorityColorKey: 'normal',
    status,
    time: formatIncidentTime(new Date(createdAt)),
    description: `Guest request — ${payload.serviceLabel} · ${languageLabel}`,
    source: 'guest',
    language: payload.language,
    service: payload.service,
    createdAt,
  }
}

/**
 * @param {string} room
 * @param {string} serviceLabel
 * @param {DepartmentId} department
 */
export function buildTelegramMessage(room, serviceLabel, department) {
  const departmentLabel = DEPARTMENT_LABELS[department] ?? department
  return [
    'Nueva solicitud hotelera',
    `Habitación: ${room}`,
    `Servicio: ${serviceLabel}`,
    `Departamento: ${departmentLabel}`,
    'Estado: Pendiente',
  ].join('\n')
}
