import type { Incident } from '../data/dashboard'
import type { GuestRequestPostBody } from './createGuestIncident'
import { apiUrl, getApiBase } from './apiBase'
import { opsLog } from './opsLog'

export type GuestRequestResponse = {
  incident: Incident
  telegram: {
    status: 'sent' | 'failed'
    reason?: string
  }
}

export async function fetchIncidents(): Promise<Incident[]> {
  const response = await fetch(apiUrl('/api/incidents'), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Failed to load incidents (${response.status})`)
  }
  const payload = (await response.json()) as { incidents: Incident[] }
  return payload.incidents
}

export async function postGuestRequest(
  payload: GuestRequestPostBody,
): Promise<GuestRequestResponse> {
  const url = apiUrl('/api/guest-requests')

  opsLog('POST_GUEST_REQUEST_STARTED', {
    url,
    apiBase: getApiBase() || '(same-origin)',
    room: payload.room,
    language: payload.language,
    service: payload.service,
    department: payload.department,
    status: payload.status,
    createdAt: payload.createdAt,
  })

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (error: unknown) {
    opsLog('POST_GUEST_REQUEST_FAILED', {
      url,
      reason: error instanceof Error ? error.message : 'network-error',
    })
    throw error
  }

  if (!response.ok) {
    const reason = `http-${response.status}`
    opsLog('POST_GUEST_REQUEST_FAILED', { url, reason })
    throw new Error(`Failed to create incident (${response.status})`)
  }

  const result = (await response.json()) as GuestRequestResponse

  opsLog('POST_GUEST_REQUEST_SUCCESS', {
    url,
    incidentId: result.incident.id,
    room: result.incident.room,
    service: result.incident.service,
    department: result.incident.department,
    status: result.incident.status,
    createdAt: result.incident.createdAt,
  })

  opsLog('INCIDENT_CREATED', {
    incidentId: result.incident.id,
    room: result.incident.room,
    service: result.incident.service,
    department: result.incident.department,
    status: result.incident.status,
    createdAt: result.incident.createdAt,
  })

  if (result.telegram.status === 'sent') {
    opsLog('TELEGRAM_SEND_SUCCESS', { incidentId: result.incident.id })
  } else {
    opsLog('TELEGRAM_SEND_FAILED', {
      incidentId: result.incident.id,
      reason: result.telegram.reason ?? 'unknown',
    })
  }

  return result
}
