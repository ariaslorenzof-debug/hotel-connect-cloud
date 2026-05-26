import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { INITIAL_INCIDENTS, type Incident } from '../data/dashboard'
import type { DepartmentNotification } from '../data/departmentNotification'
import {
  buildGuestRequestPostBody,
  createGuestIncident,
  type GuestRequestPayload,
} from '../services/createGuestIncident'
import { createDepartmentNotification } from '../services/createDepartmentNotification'
import {
  fetchIncidents,
  postGuestRequest,
} from '../services/guestOperationsApi'
import { getApiBase } from '../services/apiBase'
import { opsLog } from '../services/opsLog'

const LIVE_PULSE_MS = 4000
const INCIDENTS_STORAGE_KEY = 'hotel-connect:incidents'
const NOTIFICATIONS_STORAGE_KEY = 'hotel-connect:department-notifications'
const INCIDENTS_POLL_MS = 4000

type IncidentsContextValue = {
  incidents: Incident[]
  departmentNotifications: DepartmentNotification[]
  submitGuestRequest: (payload: GuestRequestPayload) => Promise<Incident | null>
  getDepartmentNotificationForIncident: (
    incidentId: string,
  ) => DepartmentNotification | undefined
  isIncidentLive: (id: string) => boolean
}

const IncidentsContext = createContext<IncidentsContextValue | null>(null)

function readStoredIncidents(): Incident[] | null {
  try {
    const raw = window.localStorage.getItem(INCIDENTS_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Incident[]) : null
  } catch {
    return null
  }
}

function writeStoredIncidents(incidents: Incident[]) {
  window.localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(incidents))
}

function readStoredNotifications(): DepartmentNotification[] | null {
  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as DepartmentNotification[]) : null
  } catch {
    return null
  }
}

function writeStoredNotifications(notifications: DepartmentNotification[]) {
  window.localStorage.setItem(
    NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(notifications),
  )
}

function markIncidentsLive(
  ids: string[],
  setLiveIncidentIds: Dispatch<SetStateAction<string[]>>,
) {
  if (ids.length === 0) return
  setLiveIncidentIds((current) => [...current, ...ids])
  window.setTimeout(() => {
    setLiveIncidentIds((current) =>
      current.filter((entry) => !ids.includes(entry)),
    )
  }, LIVE_PULSE_MS)
}

function telegramDeliveryStatus(
  status: 'sent' | 'failed',
): DepartmentNotification['deliveryStatus'] {
  return status === 'sent' ? 'sent' : 'failed'
}

export function IncidentsProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    return readStoredIncidents() ?? [...INITIAL_INCIDENTS]
  })
  const [departmentNotifications, setDepartmentNotifications] = useState<
    DepartmentNotification[]
  >(() => readStoredNotifications() ?? [])
  const [liveIncidentIds, setLiveIncidentIds] = useState<string[]>([])

  const applyServerIncidents = useCallback((incoming: Incident[]) => {
    setIncidents((current) => {
      const newIds = incoming
        .filter((incident) => !current.some((row) => row.id === incident.id))
        .map((incident) => incident.id)

      if (newIds.length > 0) {
        markIncidentsLive(newIds, setLiveIncidentIds)
        for (const incidentId of newIds) {
          opsLog('DASHBOARD_INCIDENT_AVAILABLE', { incidentId })
        }
      }

      return incoming
    })
  }, [])

  const syncIncidentsFromServer = useCallback(async () => {
    try {
      const incoming = await fetchIncidents()
      applyServerIncidents(incoming)
    } catch {
      // Keep local cache when API is unavailable (e.g. Vite-only dev).
    }
  }, [applyServerIncidents])

  useEffect(() => {
    writeStoredIncidents(incidents)
  }, [incidents])

  useEffect(() => {
    writeStoredNotifications(departmentNotifications)
  }, [departmentNotifications])

  useEffect(() => {
    opsLog('API_BASE_CONFIGURED', {
      apiBase: getApiBase() || '(same-origin)',
    })
  }, [])

  useEffect(() => {
    void syncIncidentsFromServer()
    const poll = window.setInterval(() => {
      void syncIncidentsFromServer()
    }, INCIDENTS_POLL_MS)
    return () => window.clearInterval(poll)
  }, [syncIncidentsFromServer])

  useEffect(() => {
    const syncFromStorage = (event: StorageEvent) => {
      if (event.key !== INCIDENTS_STORAGE_KEY) return
      const next = readStoredIncidents()
      if (!next) return

      applyServerIncidents(next)
    }

    const syncNotificationsFromStorage = (event: StorageEvent) => {
      if (event.key !== NOTIFICATIONS_STORAGE_KEY) return
      const next = readStoredNotifications()
      if (!next) return
      setDepartmentNotifications(next)
    }

    window.addEventListener('storage', syncFromStorage)
    window.addEventListener('storage', syncNotificationsFromStorage)
    return () => {
      window.removeEventListener('storage', syncFromStorage)
      window.removeEventListener('storage', syncNotificationsFromStorage)
    }
  }, [applyServerIncidents])

  const getDepartmentNotificationForIncident = useCallback(
    (incidentId: string) =>
      departmentNotifications.find((row) => row.incidentId === incidentId),
    [departmentNotifications],
  )

  const isIncidentLive = useCallback(
    (id: string) => liveIncidentIds.includes(id),
    [liveIncidentIds],
  )

  const recordGuestNotification = useCallback(
    (
      incident: Incident,
      deliveryStatus: DepartmentNotification['deliveryStatus'],
      channel: DepartmentNotification['channel'],
    ) => {
      setDepartmentNotifications((current) => {
        const notification = createDepartmentNotification(incident, current)
        if (!notification) return current
        return [
          {
            ...notification,
            deliveryStatus,
            channel,
          },
          ...current,
        ]
      })
    },
    [],
  )

  const submitGuestRequest = useCallback(
    async (payload: GuestRequestPayload): Promise<Incident | null> => {
      const postBody = buildGuestRequestPostBody(payload)

      try {
        const { incident, telegram } = await postGuestRequest(postBody)

        setIncidents((current) => {
          if (current.some((row) => row.id === incident.id)) {
            return current
          }
          markIncidentsLive([incident.id], setLiveIncidentIds)
          opsLog('DASHBOARD_INCIDENT_AVAILABLE', { incidentId: incident.id })
          return [incident, ...current]
        })

        recordGuestNotification(
          incident,
          telegramDeliveryStatus(telegram.status),
          telegram.status === 'sent' ? 'telegram' : 'none',
        )

        return incident
      } catch (error: unknown) {
        opsLog('POST_GUEST_REQUEST_FAILED', {
          room: postBody.room,
          service: postBody.service,
          error: error instanceof Error ? error.message : 'unknown',
        })

        let fallback: Incident | null = null
        setIncidents((current) => {
          fallback = createGuestIncident(payload, current)
          markIncidentsLive([fallback.id], setLiveIncidentIds)
          return [fallback, ...current]
        })
        if (fallback) {
          recordGuestNotification(fallback, 'prepared', 'none')
        }
        return fallback
      }
    },
    [recordGuestNotification],
  )

  const value = useMemo(
    () => ({
      incidents,
      departmentNotifications,
      submitGuestRequest,
      getDepartmentNotificationForIncident,
      isIncidentLive,
    }),
    [
      incidents,
      departmentNotifications,
      submitGuestRequest,
      getDepartmentNotificationForIncident,
      isIncidentLive,
    ],
  )

  return (
    <IncidentsContext.Provider value={value}>
      {children}
    </IncidentsContext.Provider>
  )
}

export function useIncidents(): IncidentsContextValue {
  const context = useContext(IncidentsContext)
  if (!context) {
    throw new Error('useIncidents must be used within IncidentsProvider')
  }
  return context
}
