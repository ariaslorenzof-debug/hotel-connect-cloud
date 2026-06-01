import { useEffect, useMemo, useState } from 'react'
import { useIncidents } from './context/IncidentsProvider.tsx'
import { notificationDeliverySummary } from './services/createDepartmentNotification'
import {
  DEPARTMENTS,
  KPI_BASE,
  type DepartmentId,
  type Incident,
  type IncidentStatus,
  type Priority,
} from './data/dashboard'
import './App.css'
import Dashboard from './Dashboard'

const DEPARTMENT_LABELS: Record<DepartmentId, string> = {
  housekeeping: 'Housekeeping',
  maintenance: 'Maintenance',
  reception: 'Reception',
  security: 'Security',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  critical: 'Critical',
  high: 'High',
  normal: 'Normal',
  medium: 'Medium',
  low: 'Low',
}

const STATUS_LABELS: Record<IncidentStatus, string> = {
  pending: 'Pending',
  open: 'Open',
  in_progress: 'In Progress',
  escalated: 'Escalated',
  resolved: 'Resolved',
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatFeedAge(createdAt: number): string {
  const seconds = Math.floor((Date.now() - createdAt) / 1000)
  if (seconds < 45) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

const SEED_ACTIVITY = [
  { id: 'seed-1', age: '2m ago', text: 'Housekeeping assigned to room 805' },
  { id: 'seed-2', age: '5m ago', text: 'Security patrol routed to P3' },
  { id: 'seed-3', age: '8m ago', text: 'Reception SLA alert cleared' },
] as const

function KpiCard({
  label,
  value,
  unit,
  trend,
  accent,
  pulse,
}: {
  label: string
  value: string | number
  unit?: string
  trend?: string
  accent: 'gold' | 'emerald' | 'cyan' | 'violet'
  pulse?: boolean
}) {
  return (
    <article className={`kpi-card kpi-card--${accent}`}>
      <div className="kpi-card__glow" aria-hidden />
      <header className="kpi-card__header">
        <span className="kpi-card__label">{label}</span>
        {pulse && (
          <span className="live-dot" title="Live metric">
            <span className="live-dot__ring" />
            <span className="live-dot__core" />
          </span>
        )}
      </header>
      <div className="kpi-card__value">
        <span className="kpi-card__number">{value}</span>
        {unit && <span className="kpi-card__unit">{unit}</span>}
      </div>
      {trend && <p className="kpi-card__trend">{trend}</p>}
    </article>
  )
}

function DepartmentCard({
  label,
  online,
  staffCount,
  activeTasks,
  load,
}: {
  label: string
  online: boolean
  staffCount: number
  activeTasks: number
  load: 'low' | 'normal' | 'high'
}) {
  return (
    <article className={`dept-card dept-card--${load}`}>
      <div className="dept-card__glow" aria-hidden />
      <div className="dept-card__top">
        <h3 className="dept-card__name">{label}</h3>
        <span className={`dept-status ${online ? 'dept-status--online' : 'dept-status--offline'}`}>
          <span className="dept-status__dot" />
          {online ? 'Online' : 'Offline'}
        </span>
      </div>
      <dl className="dept-card__stats">
        <div>
          <dt>Staff on duty</dt>
          <dd>{staffCount}</dd>
        </div>
        <div>
          <dt>Active tasks</dt>
          <dd>{activeTasks}</dd>
        </div>
        <div>
          <dt>Load</dt>
          <dd className={`dept-load dept-load--${load}`}>{load}</dd>
        </div>
      </dl>
    </article>
  )
}

function IncidentRow({
  incident,
  isLive,
  preparedNotificationLabel,
}: {
  incident: Incident
  isLive?: boolean
  preparedNotificationLabel?: string
}) {
  return (
    <tr
      className={`incident-row${isLive ? ' incident-row--live' : ''}`}
    >
      <td className="incident-row__room">
        <span className="room-badge">{incident.room}</span>
      </td>
      <td>{DEPARTMENT_LABELS[incident.department]}</td>
      <td>
        <span className={`priority priority--${incident.priority}`}>
          {PRIORITY_LABELS[incident.priority]}
        </span>
      </td>
      <td>
        <span className={`status status--${incident.status}`}>
          {incident.status !== 'resolved' && <span className="status__pulse" />}
          {STATUS_LABELS[incident.status]}
        </span>
      </td>
      <td className="incident-row__time">{incident.time}</td>
      <td className="incident-row__desc">
        <div className="incident-row__desc-body">
          <p>
            {incident.serviceCategory ? (
              <span className="incident-row__category">{incident.serviceCategory}</span>
            ) : null}
            {incident.serviceCategory && ' — '}
            {incident.description}
          </p>
          {preparedNotificationLabel ? (
            <p className="incident-row__notification-prepared">
              {preparedNotificationLabel}
            </p>
          ) : null}
        </div>
      </td>
    </tr>
  )
}

function App() {
  if (window.location.pathname === '/dashboard') return <Dashboard />
  const { incidents, isIncidentLive, getDepartmentNotificationForIncident } =
    useIncidents()
  const [now, setNow] = useState(() => new Date())
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000)
    const pulse = window.setInterval(() => setTick((t) => t + 1), 4000)
    return () => {
      window.clearInterval(clock)
      window.clearInterval(pulse)
    }
  }, [])

  const activeIncidents = useMemo(
    () => incidents.filter((incident) => incident.status !== 'resolved').length,
    [incidents],
  )

  const guestActivity = useMemo(
    () =>
      incidents
        .filter((incident) => incident.source === 'guest')
        .slice(0, 6)
        .map((incident) => ({
          id: incident.id,
          age: incident.createdAt
            ? formatFeedAge(incident.createdAt)
            : 'Just now',
          text: `Room ${incident.room} — ${incident.serviceCategory ?? 'Guest request'} queued for ${DEPARTMENT_LABELS[incident.department]}`,
        })),
    [incidents],
  )
  const resolvedToday = KPI_BASE.resolvedToday + Math.floor(tick / 5)
  const responseSeconds =
    (KPI_BASE.avgResponseSeconds + (tick % 4) * 3) % 60
  const responseMinutes = KPI_BASE.avgResponseMinutes

  return (
    <div className="dashboard">
      <div className="dashboard__ambient" aria-hidden>
        <div className="dashboard__grid" />
        <div className="dashboard__scan" />
      </div>

      <header className="topbar">
        <div className="topbar__brand">
          <div className="brand-mark" aria-hidden>
            <span className="brand-mark__inner">HC</span>
          </div>
          <div>
            <p className="topbar__eyebrow">Operations Center</p>
            <h1 className="topbar__title">Hotel Connect</h1>
          </div>
        </div>

        <div className="topbar__center">
          <span className="system-badge">
            <span className="live-dot live-dot--sm">
              <span className="live-dot__ring" />
              <span className="live-dot__core" />
            </span>
            All systems operational
          </span>
        </div>

        <div className="topbar__clock">
          <time className="topbar__time" dateTime={now.toISOString()}>
            {formatClock(now)}
          </time>
          <span className="topbar__date">{formatDate(now)}</span>
        </div>
      </header>

      <main className="dashboard__main">
        <section className="kpi-section" aria-label="Key performance indicators">
          <KpiCard
            label="Active incidents"
            value={activeIncidents}
            trend="+2 since last hour"
            accent="gold"
            pulse
          />
          <KpiCard
            label="Resolved today"
            value={resolvedToday}
            trend="↑ 18% vs yesterday"
            accent="emerald"
          />
          <KpiCard
            label="Avg response time"
            value={`${responseMinutes}m ${String(responseSeconds).padStart(2, '0')}s`}
            trend="Within SLA target"
            accent="cyan"
            pulse
          />
          <KpiCard
            label="Departments online"
            value={`${KPI_BASE.departmentsOnline}/${KPI_BASE.departmentsTotal}`}
            trend="Full coverage"
            accent="violet"
          />
        </section>

        <div className="dashboard__body">
          <section className="panel incidents-panel" aria-labelledby="incidents-heading">
            <div className="panel__header">
              <div>
                <h2 id="incidents-heading" className="panel__title">
                  Live incidents
                </h2>
                <p className="panel__subtitle">Real-time operational queue</p>
              </div>
              <span className="panel__badge">{activeIncidents} active records</span>
            </div>

            <div className="table-wrap">
              <table className="incidents-table">
                <thead>
                  <tr>
                    <th scope="col">Room</th>
                    <th scope="col">Department</th>
                    <th scope="col">Priority</th>
                    <th scope="col">Status</th>
                    <th scope="col">Time</th>
                    <th scope="col">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident) => {
                    const departmentNotification =
                      getDepartmentNotificationForIncident(incident.id)
                    return (
                      <IncidentRow
                        key={incident.id}
                        incident={incident}
                        isLive={isIncidentLive(incident.id)}
                        preparedNotificationLabel={
                          departmentNotification
                            ? notificationDeliverySummary(
                                departmentNotification.targetDepartment,
                                departmentNotification.deliveryStatus,
                              )
                            : undefined
                        }
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="sidebar" aria-label="Department status">
            <section className="panel dept-panel" aria-labelledby="dept-heading">
              <div className="panel__header">
                <div>
                  <h2 id="dept-heading" className="panel__title">
                    Departments
                  </h2>
                  <p className="panel__subtitle">Staff & channel status</p>
                </div>
              </div>

              <div className="dept-grid">
                {DEPARTMENTS.map((dept) => (
                  <DepartmentCard
                    key={dept.id}
                    label={dept.label}
                    online={dept.online}
                    staffCount={dept.staffCount}
                    activeTasks={dept.activeTasks}
                    load={dept.load}
                  />
                ))}
              </div>
            </section>

            <section className="panel feed-panel" aria-label="Activity feed">
              <div className="panel__header">
                <h2 className="panel__title">Activity pulse</h2>
              </div>
              <ul className="activity-feed">
                {guestActivity.map((item, index) => (
                  <li
                    key={item.id}
                    className={`activity-feed__item${
                      index === 0 && isIncidentLive(item.id)
                        ? ' activity-feed__item--new'
                        : ''
                    }`}
                  >
                    <span className="activity-feed__time">{item.age}</span>
                    {item.text}
                  </li>
                ))}
                {SEED_ACTIVITY.map((item) => (
                  <li key={item.id} className="activity-feed__item">
                    <span className="activity-feed__time">{item.age}</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </main>

      <footer className="footer">
        <span>Hotel Connect · Operations Dashboard</span>
        <span className="footer__live">
          <span className="live-dot live-dot--sm">
            <span className="live-dot__ring" />
            <span className="live-dot__core" />
          </span>
          Live monitoring
        </span>
      </footer>
    </div>
  )
}

export default App
