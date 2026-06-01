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
  housekeeping: 'Limpieza',
  maintenance: 'Mantenimiento',
  reception: 'Recepción',
  security: 'Seguridad',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  critical: 'Crítica',
  high: 'Alta',
  normal: 'Normal',
  medium: 'Media',
  low: 'Baja',
}

const STATUS_LABELS: Record<IncidentStatus, string> = {
  pending: 'Pendiente',
  open: 'Abierta',
  in_progress: 'En proceso',
  escalated: 'Escalada',
  resolved: 'Resuelta',
}

const LOAD_LABELS: Record<'low' | 'normal' | 'high', string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatFeedAge(createdAt: number): string {
  const seconds = Math.floor((Date.now() - createdAt) / 1000)
  if (seconds < 45) return 'Ahora mismo'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `hace ${hours} h`
}

const SEED_ACTIVITY = [
  { id: 'seed-1', age: 'hace 2 min', text: 'Limpieza asignada a la habitación 805' },
  { id: 'seed-2', age: 'hace 5 min', text: 'Patrulla de seguridad desviada a P3' },
  { id: 'seed-3', age: 'hace 8 min', text: 'Alerta SLA de recepción resuelta' },
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
          <span className="live-dot" title="Métrica en vivo">
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
          {online ? 'En línea' : 'Desconectado'}
        </span>
      </div>
      <dl className="dept-card__stats">
        <div>
          <dt>Personal de servicio</dt>
          <dd>{staffCount}</dd>
        </div>
        <div>
          <dt>Tareas activas</dt>
          <dd>{activeTasks}</dd>
        </div>
        <div>
          <dt>Carga</dt>
          <dd className={`dept-load dept-load--${load}`}>{LOAD_LABELS[load]}</dd>
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
            : 'Ahora mismo',
          text: `Hab. ${incident.room} — ${incident.serviceCategory ?? 'Solicitud de huésped'} en cola para ${DEPARTMENT_LABELS[incident.department]}`,
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
            <p className="topbar__eyebrow">Centro de operaciones</p>
            <h1 className="topbar__title">Hotel Connect</h1>
          </div>
        </div>

        <div className="topbar__center">
          <span className="system-badge">
            <span className="live-dot live-dot--sm">
              <span className="live-dot__ring" />
              <span className="live-dot__core" />
            </span>
            Todos los sistemas operativos
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
        <section className="kpi-section" aria-label="Indicadores clave">
          <KpiCard
            label="Incidencias activas"
            value={activeIncidents}
            trend="+2 en la última hora"
            accent="gold"
            pulse
          />
          <KpiCard
            label="Resueltas hoy"
            value={resolvedToday}
            trend="↑ 18 % respecto a ayer"
            accent="emerald"
          />
          <KpiCard
            label="Tiempo medio de respuesta"
            value={`${responseMinutes}m ${String(responseSeconds).padStart(2, '0')}s`}
            trend="Dentro del objetivo SLA"
            accent="cyan"
            pulse
          />
          <KpiCard
            label="Departamentos en línea"
            value={`${KPI_BASE.departmentsOnline}/${KPI_BASE.departmentsTotal}`}
            trend="Cobertura completa"
            accent="violet"
          />
        </section>

        <div className="dashboard__body">
          <section className="panel incidents-panel" aria-labelledby="incidents-heading">
            <div className="panel__header">
              <div>
                <h2 id="incidents-heading" className="panel__title">
                  Incidencias en vivo
                </h2>
                <p className="panel__subtitle">Cola operativa en tiempo real</p>
              </div>
              <span className="panel__badge">{activeIncidents} registros activos</span>
            </div>

            <div className="table-wrap">
              <table className="incidents-table">
                <thead>
                  <tr>
                    <th scope="col">Habitación</th>
                    <th scope="col">Departamento</th>
                    <th scope="col">Prioridad</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Hora</th>
                    <th scope="col">Descripción</th>
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

          <aside className="sidebar" aria-label="Estado de departamentos">
            <section className="panel dept-panel" aria-labelledby="dept-heading">
              <div className="panel__header">
                <div>
                  <h2 id="dept-heading" className="panel__title">
                    Departamentos
                  </h2>
                  <p className="panel__subtitle">Personal y canales</p>
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

            <section className="panel feed-panel" aria-label="Actividad reciente">
              <div className="panel__header">
                <h2 className="panel__title">Pulso de actividad</h2>
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
        <span>Hotel Connect · Panel de operaciones</span>
        <span className="footer__live">
          <span className="live-dot live-dot--sm">
            <span className="live-dot__ring" />
            <span className="live-dot__core" />
          </span>
          Monitorización en vivo
        </span>
      </footer>
    </div>
  )
}

export default App
