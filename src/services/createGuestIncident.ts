import type { DepartmentId, Incident } from '../data/dashboard'

export type GuestServiceId =
  | 'towels'
  | 'cleaning'
  | 'air-conditioning'
  | 'maintenance'
  | 'pillows'
  | 'blankets'
  | 'other'

export type GuestLanguageId = 'es' | 'en' | 'de' | 'fr'

export type GuestRequestPayload = {
  room: string
  language: GuestLanguageId
  service: GuestServiceId
  serviceLabel: string
}

export type GuestRequestPostBody = {
  room: string
  language: GuestLanguageId
  service: GuestServiceId
  department: DepartmentId
  status: 'pending'
  createdAt: number
  serviceLabel: string
}

export function buildGuestRequestPostBody(
  payload: GuestRequestPayload,
): GuestRequestPostBody {
  return {
    room: payload.room,
    language: payload.language,
    service: payload.service,
    department: departmentForGuestService(payload.service),
    status: 'pending',
    createdAt: Date.now(),
    serviceLabel: payload.serviceLabel,
  }
}

const LANGUAGE_LABELS: Record<GuestLanguageId, string> = {
  es: 'Español',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
}

export function departmentForGuestService(service: GuestServiceId): DepartmentId {
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
  }
}

function nextIncidentId(existing: Incident[]): string {
  const max = existing.reduce((highest, incident) => {
    const numeric = Number.parseInt(incident.id.replace('INC-', ''), 10)
    return Number.isFinite(numeric) && numeric > highest ? numeric : highest
  }, 0)
  return `INC-${max + 1}`
}

function formatIncidentTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function createGuestIncident(
  payload: GuestRequestPayload,
  existing: Incident[],
): Incident {
  const createdAt = Date.now()
  const languageLabel = LANGUAGE_LABELS[payload.language]

  return {
    id: nextIncidentId(existing),
    room: payload.room,
    department: departmentForGuestService(payload.service),
    serviceCategory: payload.serviceLabel,
    priority: 'normal',
    priorityColorKey: 'normal',
    status: 'pending',
    time: formatIncidentTime(new Date(createdAt)),
    description: `Guest request — ${payload.serviceLabel} · ${languageLabel}`,
    source: 'guest',
    language: payload.language,
    service: payload.service,
    createdAt,
  }
}
