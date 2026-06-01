import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from './supabase'

type Incidencia = {
  id: string
  habitacion: number | string
  tipo_incidencia: string
  departamento: string | null
  estado: string
  prioridad: string | null
  created_at: string | null
  accepted_at: string | null
  accepted_by: string | null
  resolved_by: string | null
  hora_resolucion: string | null
  tiempo_respuesta_min: number | null
  tiempo_resolucion_min: number | null
  observaciones: string | null
  trabajador_nombre: string | null
  hotel_id: string | null
}

const DEPARTAMENTO_LABELS: Record<string, string> = {
  housekeeping: 'Limpieza',
  maintenance: 'Mantenimiento',
  reception: 'Recepción',
  security: 'Seguridad',
}

const TIPO_LABELS: Record<string, string> = {
  towels: 'Toallas',
  cleaning: 'Limpieza',
  ac: 'Aire acondicionado',
  minibar: 'Minibar',
  maintenance: 'Mantenimiento',
  noise: 'Ruido',
}

const SLA_MINUTES = 20

function normalizeKey(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, '_')
}

function departamentoLabel(departamento: string | null): string {
  if (!departamento) return '—'
  const key = normalizeKey(departamento)
  return DEPARTAMENTO_LABELS[key] ?? departamento
}

function tipoLabel(tipo: string): string {
  return TIPO_LABELS[tipo] ?? tipo
}

function isToday(iso: string): boolean {
  const date = new Date(iso)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function isCurrentMonth(iso: string): boolean {
  const date = new Date(iso)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  )
}

function isPendiente(estado: string): boolean {
  const n = normalizeKey(estado)
  return n === 'pendiente' || n === 'open'
}

function isEnProceso(estado: string): boolean {
  const n = normalizeKey(estado)
  return (
    n === 'en_proceso' ||
    n === 'proceso' ||
    n === 'in_progress' ||
    estado.toLowerCase().trim() === 'en proceso'
  )
}

function isResuelta(estado: string): boolean {
  const n = normalizeKey(estado)
  return n === 'resuelta' || n === 'resolved'
}

function isEscalada(estado: string): boolean {
  const n = normalizeKey(estado)
  return n === 'escalated' || n === 'escalada'
}

function isActiva(estado: string): boolean {
  return isPendiente(estado) || isEnProceso(estado) || isEscalada(estado)
}

function canResolve(estado: string): boolean {
  return isPendiente(estado) || isEnProceso(estado)
}

function estadoLabel(estado: string): string {
  const n = normalizeKey(estado)
  if (n === 'open') return 'Abierta'
  if (isEnProceso(estado)) return 'En proceso'
  if (isResuelta(estado)) return 'Resuelta'
  if (isEscalada(estado)) return 'Escalada'
  if (n === 'pendiente') return 'Pendiente'
  return estado
}

function getResolutionMinutes(inc: Incidencia): number | null {
  if (inc.tiempo_resolucion_min != null && inc.tiempo_resolucion_min >= 0) {
    return inc.tiempo_resolucion_min
  }
  if (!inc.created_at || !inc.hora_resolucion) return null
  const mins = Math.round(
    (new Date(inc.hora_resolucion).getTime() - new Date(inc.created_at).getTime()) /
      60000,
  )
  return mins >= 0 ? mins : null
}

function getResponseMinutes(inc: Incidencia): number | null {
  if (inc.tiempo_respuesta_min != null && inc.tiempo_respuesta_min >= 0) {
    return inc.tiempo_respuesta_min
  }
  if (!inc.created_at || !inc.accepted_at) return null
  const mins = Math.round(
    (new Date(inc.accepted_at).getTime() - new Date(inc.created_at).getTime()) / 60000,
  )
  return mins >= 0 ? mins : null
}

function getElapsedMinutes(inc: Incidencia, now: Date): number {
  if (!inc.created_at) return 0
  const start = new Date(inc.created_at).getTime()
  const end =
    isResuelta(inc.estado) && inc.hora_resolucion
      ? new Date(inc.hora_resolucion).getTime()
      : now.getTime()
  return Math.max(0, Math.floor((end - start) / 60000))
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

type KpiCardProps = {
  label: string
  value: string
  accent: string
  footnote?: string
}

function KpiCard({ label, value, accent, footnote }: KpiCardProps) {
  return (
    <article className="dash-card">
      <div className="dash-card__bar" style={{ background: accent }} />
      <p className="dash-card__label">{label}</p>
      <p className="dash-card__value" style={{ color: accent }}>
        {value}
      </p>
      {footnote ? <p className="dash-card__footnote">{footnote}</p> : null}
    </article>
  )
}

type RankRow = {
  key: string
  label: string
  value: number
  display: string
}

function RankBlock({
  title,
  rows,
  footer,
}: {
  title: string
  rows: RankRow[]
  footer?: ReactNode
}) {
  const max = rows.length > 0 ? Math.max(...rows.map((r) => r.value), 1) : 1

  return (
    <article className="dash-panel">
      <h2 className="dash-panel__title">{title}</h2>
      {rows.length === 0 ? (
        <p className="dash-muted">Sin datos disponibles.</p>
      ) : (
        <ul className="dash-bars">
          {rows.map((row, i) => (
            <li key={row.key} className="dash-bars__item">
              <div className="dash-bars__head">
                <span className="dash-bars__rank">{i + 1}.</span>
                <span className="dash-bars__label">{row.label}</span>
                <span className="dash-bars__value">{row.display}</span>
              </div>
              <div className="dash-bars__track">
                <div
                  className="dash-bars__fill"
                  style={{ width: `${Math.max(8, (row.value / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      {footer}
    </article>
  )
}

export default function Dashboard() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const fetchIncidencias = useCallback(async () => {
    const { data, error } = await supabase
      .from('incidencias')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase fetch error:', error)
      return
    }

    setIncidencias((data as Incidencia[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchIncidencias()
    const interval = window.setInterval(fetchIncidencias, 30_000)
    return () => window.clearInterval(interval)
  }, [fetchIncidencias])

  useEffect(() => {
    const timer = window.setInterval(() => setTick((t) => t + 1), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const now = useMemo(() => new Date(), [tick, incidencias])

  const metrics = useMemo(() => {
    const activas = incidencias.filter((inc) => isActiva(inc.estado))
    const pendientes = incidencias.filter((inc) => isPendiente(inc.estado))
    const resueltas = incidencias.filter((inc) => isResuelta(inc.estado))

    const resueltasHoy = resueltas.filter(
      (inc) => inc.hora_resolucion && isToday(inc.hora_resolucion),
    )

    const responseTimes = incidencias
      .map(getResponseMinutes)
      .filter((m): m is number => m !== null)

    const resolutionTimes = resueltas
      .map(getResolutionMinutes)
      .filter((m): m is number => m !== null)

    const reseñasProtegidas = resueltas.filter((inc) => {
      if (!inc.hora_resolucion || !isCurrentMonth(inc.hora_resolucion)) return false
      const mins = getResolutionMinutes(inc)
      return mins !== null && mins < SLA_MINUTES
    }).length

    const fueraSla = incidencias.filter((inc) => {
      if (!isPendiente(inc.estado) && !isEnProceso(inc.estado)) return false
      return getElapsedMinutes(inc, now) > SLA_MINUTES
    }).length

    const resolvedWithTime = resueltas
      .map(getResolutionMinutes)
      .filter((m): m is number => m !== null)

    const withinSla = resolvedWithTime.filter((m) => m < SLA_MINUTES).length
    const dentroSlaPct =
      resolvedWithTime.length > 0
        ? Math.round((withinSla / resolvedWithTime.length) * 100)
        : 0

    const tiempoAhorradoHoras = Math.round(resueltas.length * 0.17 * 10) / 10

    return {
      activas: activas.length,
      resueltasHoy: resueltasHoy.length,
      pendientes: pendientes.length,
      avgResponseMin: average(responseTimes),
      reseñasProtegidas,
      avgResolutionMin: average(resolutionTimes),
      fueraSla,
      dentroSlaPct,
      tiempoAhorradoHoras,
    }
  }, [incidencias, now])

  const deptRanking = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>()

    for (const inc of incidencias) {
      if (!inc.departamento || !isResuelta(inc.estado)) continue
      const mins = getResolutionMinutes(inc)
      if (mins === null) continue
      const key = inc.departamento
      const cur = map.get(key) ?? { sum: 0, count: 0 }
      map.set(key, { sum: cur.sum + mins, count: cur.count + 1 })
    }

    return [...map.entries()]
      .map(([departamento, { sum, count }]) => ({
        departamento,
        avg: Math.round(sum / count),
      }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 8)
  }, [incidencias])

  const roomRanking = useMemo(() => {
    const map = new Map<string, number>()
    for (const inc of incidencias) {
      const key = String(inc.habitacion)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return [...map.entries()]
      .map(([habitacion, count]) => ({ habitacion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [incidencias])

  const deptRows: RankRow[] = deptRanking.map((row) => ({
    key: row.departamento,
    label: departamentoLabel(row.departamento),
    value: row.avg,
    display: `${row.avg} min`,
  }))

  const roomRows: RankRow[] = roomRanking.map((row) => ({
    key: row.habitacion,
    label: `Hab. ${row.habitacion}`,
    value: row.count,
    display: `${row.count} ${row.count === 1 ? 'incidencia' : 'incidencias'}`,
  }))

  const tableRows = useMemo(() => {
    const activas = incidencias.filter((inc) => isActiva(inc.estado))
    const resto = incidencias.filter((inc) => !isActiva(inc.estado))
    return [...activas, ...resto]
  }, [incidencias])

  const handleResolve = async (inc: Incidencia) => {
    if (!inc.created_at) return
    setResolvingId(inc.id)

    const nowIso = new Date().toISOString()
    const tiempoResolucionMin = Math.max(
      0,
      Math.round((Date.now() - new Date(inc.created_at).getTime()) / 60000),
    )

    const { error } = await supabase
      .from('incidencias')
      .update({
        estado: 'resuelta',
        hora_resolucion: nowIso,
        tiempo_resolucion_min: tiempoResolucionMin,
      })
      .eq('id', inc.id)

    if (error) {
      console.error('Supabase update error:', error)
    } else {
      await fetchIncidencias()
    }

    setResolvingId(null)
  }

  const fastestDept = deptRanking[0]
  const slowestDept = deptRanking.length > 1 ? deptRanking[deptRanking.length - 1] : null

  return (
    <div className="dash">
      <style>{`
        .dash {
          min-height: 100dvh;
          background: #0a0a10;
          color: #fff;
          font-family: Georgia, 'Times New Roman', serif;
          padding: clamp(1.25rem, 4vw, 2.5rem);
          box-sizing: border-box;
        }

        .dash *, .dash *::before, .dash *::after { box-sizing: border-box; }

        .dash__header { margin-bottom: 1.75rem; }

        .dash__title {
          margin: 0 0 0.35rem;
          font-size: clamp(1.75rem, 5vw, 2.5rem);
          font-weight: 400;
          color: rgba(200, 170, 100, 0.8);
          letter-spacing: 0.02em;
        }

        .dash__subtitle {
          margin: 0;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.55);
        }

        .dash__row {
          display: grid;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .dash__row--5 {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }

        .dash__row--4 {
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          margin-bottom: 1.75rem;
        }

        .dash-card {
          position: relative;
          overflow: hidden;
          background: #111118;
          border: 1px solid rgba(200, 170, 100, 0.09);
          border-radius: 12px;
          padding: 1.1rem 1.2rem 1.15rem;
        }

        .dash-card__bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
        }

        .dash-card__label {
          margin: 0.35rem 0 0.5rem;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: rgba(200, 170, 100, 0.8);
        }

        .dash-card__value {
          margin: 0;
          font-size: clamp(1.6rem, 4vw, 2rem);
          font-weight: 500;
          line-height: 1.1;
        }

        .dash-card__footnote {
          margin: 0.65rem 0 0;
          font-size: 0.68rem;
          line-height: 1.35;
          color: rgba(255, 255, 255, 0.42);
        }

        .dash__panels {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-bottom: 1.75rem;
        }

        @media (min-width: 900px) {
          .dash__panels { grid-template-columns: 1fr 1fr; }
        }

        .dash-panel {
          background: #111118;
          border: 1px solid rgba(200, 170, 100, 0.09);
          border-radius: 12px;
          padding: 1.25rem 1.35rem;
        }

        .dash-panel__title {
          margin: 0 0 1rem;
          font-size: 1.05rem;
          font-weight: 400;
          color: rgba(200, 170, 100, 0.8);
        }

        .dash-bars {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .dash-bars__head {
          display: flex;
          align-items: baseline;
          gap: 0.35rem;
          margin-bottom: 0.35rem;
          font-size: 0.88rem;
        }

        .dash-bars__rank {
          color: rgba(200, 170, 100, 0.65);
          min-width: 1.25rem;
        }

        .dash-bars__label {
          flex: 1;
          color: rgba(255, 255, 255, 0.9);
        }

        .dash-bars__value {
          color: rgba(200, 170, 100, 0.8);
          white-space: nowrap;
          font-size: 0.82rem;
        }

        .dash-bars__track {
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }

        .dash-bars__fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            rgba(200, 170, 100, 0.35),
            rgba(200, 170, 100, 0.75)
          );
        }

        .dash-panel__footer {
          margin-top: 1rem;
          padding-top: 0.85rem;
          border-top: 1px solid rgba(200, 170, 100, 0.09);
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem 1.25rem;
          font-size: 0.82rem;
        }

        .dash-panel__fast { color: #68d391; }
        .dash-panel__slow { color: #f56565; }

        .dash-muted {
          color: rgba(255, 255, 255, 0.45);
          font-size: 0.85rem;
          margin: 0;
        }

        .dash__section-title {
          margin: 0 0 1rem;
          font-size: 1.3rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.92);
        }

        .dash__table-wrap {
          overflow-x: auto;
          border: 1px solid rgba(200, 170, 100, 0.09);
          border-radius: 12px;
          background: #111118;
        }

        .dash__table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
          min-width: 760px;
        }

        .dash__table th {
          text-align: left;
          padding: 0.85rem 1rem;
          font-size: 0.65rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(200, 170, 100, 0.8);
          border-bottom: 1px solid rgba(200, 170, 100, 0.09);
        }

        .dash__table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid rgba(200, 170, 100, 0.06);
          vertical-align: middle;
        }

        .dash__table tr:last-child td { border-bottom: none; }

        .dash__room {
          font-weight: 600;
          color: rgba(200, 170, 100, 0.8);
        }

        .dash__elapsed--alert { color: #f56565; font-weight: 600; }

        .dash__badge {
          display: inline-block;
          padding: 0.22rem 0.6rem;
          border-radius: 999px;
          font-size: 0.72rem;
        }

        .dash__badge--pendiente {
          background: rgba(245, 101, 101, 0.12);
          color: #f56565;
          border: 1px solid rgba(245, 101, 101, 0.35);
        }

        .dash__badge--proceso {
          background: rgba(200, 170, 100, 0.12);
          color: rgba(200, 170, 100, 0.95);
          border: 1px solid rgba(200, 170, 100, 0.35);
        }

        .dash__badge--escalada {
          background: rgba(237, 137, 54, 0.12);
          color: #ed8936;
          border: 1px solid rgba(237, 137, 54, 0.35);
        }

        .dash__badge--resuelta {
          background: rgba(104, 211, 145, 0.12);
          color: #68d391;
          border: 1px solid rgba(104, 211, 145, 0.3);
        }

        .dash__btn {
          padding: 0.4rem 0.85rem;
          border-radius: 8px;
          border: 1px solid rgba(200, 170, 100, 0.35);
          background: rgba(200, 170, 100, 0.1);
          color: rgba(200, 170, 100, 0.8);
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 0.8rem;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s, border-color 0.2s;
        }

        .dash__btn:hover:not(:disabled) {
          background: rgba(200, 170, 100, 0.2);
          border-color: rgba(200, 170, 100, 0.55);
        }

        .dash__btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dash__empty {
          text-align: center;
          padding: 2rem 1rem;
          color: rgba(255, 255, 255, 0.45);
        }
      `}</style>

      <header className="dash__header">
        <h1 className="dash__title">Hotel Connect</h1>
        <p className="dash__subtitle">Panel operativo de incidencias</p>
      </header>

      <section className="dash__row dash__row--5" aria-label="Indicadores principales">
        <KpiCard
          label="Incidencias activas"
          value={String(metrics.activas)}
          accent="#f56565"
        />
        <KpiCard
          label="Resueltas hoy"
          value={String(metrics.resueltasHoy)}
          accent="#68d391"
        />
        <KpiCard
          label="Pendientes"
          value={String(metrics.pendientes)}
          accent="rgba(200, 170, 100, 0.95)"
        />
        <KpiCard
          label="Tiempo medio de respuesta"
          value={
            metrics.avgResponseMin !== null ? `${metrics.avgResponseMin} min` : '—'
          }
          accent="#63b3ed"
        />
        <KpiCard
          label="Reseñas protegidas este mes"
          value={String(metrics.reseñasProtegidas)}
          accent="#ecc94b"
          footnote="Estimación basada en incidencias resueltas dentro del tiempo objetivo."
        />
      </section>

      <section className="dash__row dash__row--4" aria-label="Indicadores SLA">
        <KpiCard
          label="Tiempo medio de resolución"
          value={
            metrics.avgResolutionMin !== null ? `${metrics.avgResolutionMin} min` : '—'
          }
          accent="#b794f4"
        />
        <KpiCard
          label="Fuera de SLA"
          value={String(metrics.fueraSla)}
          accent="#f56565"
        />
        <KpiCard
          label="Dentro de SLA"
          value={`${metrics.dentroSlaPct}%`}
          accent="#4fd1c5"
        />
        <KpiCard
          label="Tiempo ahorrado a recepción"
          value={`${metrics.tiempoAhorradoHoras} h`}
          accent="#ed8936"
        />
      </section>

      <section className="dash__panels" aria-label="Rankings">
        <RankBlock
          title="Departamentos — tiempo medio de resolución"
          rows={deptRows}
          footer={
            deptRanking.length > 0 ? (
              <div className="dash-panel__footer">
                {fastestDept ? (
                  <span className="dash-panel__fast">
                    Más rápido: {departamentoLabel(fastestDept.departamento)} (
                    {fastestDept.avg} min)
                  </span>
                ) : null}
                {slowestDept && slowestDept.departamento !== fastestDept?.departamento ? (
                  <span className="dash-panel__slow">
                    Más lento: {departamentoLabel(slowestDept.departamento)} (
                    {slowestDept.avg} min)
                  </span>
                ) : null}
              </div>
            ) : undefined
          }
        />
        <RankBlock
          title="Habitaciones — más incidencias"
          rows={roomRows}
        />
      </section>

      <section aria-label="Incidencias">
        <h2 className="dash__section-title">Incidencias activas y recientes</h2>

        {loading ? (
          <p className="dash__empty">Cargando incidencias…</p>
        ) : tableRows.length === 0 ? (
          <p className="dash__empty">No hay incidencias registradas.</p>
        ) : (
          <div className="dash__table-wrap">
            <table className="dash__table">
              <thead>
                <tr>
                  <th>Habitación</th>
                  <th>Incidencia</th>
                  <th>Departamento</th>
                  <th>Trabajador</th>
                  <th>Estado</th>
                  <th>Tiempo transcurrido</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((inc) => {
                  const elapsedMin = getElapsedMinutes(inc, now)
                  const active = isActiva(inc.estado)
                  const over20 = active && elapsedMin > SLA_MINUTES

                  const badgeClass = isResuelta(inc.estado)
                    ? 'dash__badge--resuelta'
                    : isEnProceso(inc.estado)
                      ? 'dash__badge--proceso'
                      : isEscalada(inc.estado)
                        ? 'dash__badge--escalada'
                        : 'dash__badge--pendiente'

                  return (
                    <tr key={inc.id}>
                      <td>
                        <span className="dash__room">{inc.habitacion}</span>
                      </td>
                      <td>{tipoLabel(inc.tipo_incidencia)}</td>
                      <td>{departamentoLabel(inc.departamento)}</td>
                      <td>{inc.trabajador_nombre ?? '—'}</td>
                      <td>
                        <span className={`dash__badge ${badgeClass}`}>
                          {estadoLabel(inc.estado)}
                        </span>
                      </td>
                      <td>
                        <span className={over20 ? 'dash__elapsed--alert' : undefined}>
                          {inc.created_at ? `${elapsedMin} min` : '—'}
                        </span>
                      </td>
                      <td>
                        {canResolve(inc.estado) ? (
                          <button
                            type="button"
                            className="dash__btn"
                            disabled={resolvingId === inc.id}
                            onClick={() => handleResolve(inc)}
                          >
                            {resolvingId === inc.id ? 'Guardando…' : 'Resolver'}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
