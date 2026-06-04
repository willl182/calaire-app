import { signOut } from '@workos-inc/authkit-nextjs'

import { buildAbsoluteAppUrl } from '@/lib/app-url'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LogoUnal } from '@/app/components/LogoUnal'
import { ConfirmSubmitButton } from '@/app/(protected)/dashboard/components/ConfirmSubmitButton'
import {
  changeRondaStatusAction,
  deleteRondaAction,
  reabrirRondaAction,
  updateRondaAction,
} from '@/app/(protected)/dashboard/actions'
import { isAdmin, requireAuth } from '@/lib/auth'
import { Alert } from './components/Alert'
import {
  listAllParticipantes,
  listParticipantesRondaResumen,
  listPTItems,
  listPTSampleGroups,
  listResultadosPTRonda,
  listRondas,
  listRondasParticipante,
  CONTAMINANTES,
  type Contaminante,
  type ParticipanteGlobal,
  type Ronda,
  type ResultadoParticipantePT,
  type RondaPTItem,
  type RondaPTSampleGroup,
  type RondaParticipanteAsignada,
  type ParticipanteRondaResumen,
} from '@/lib/rondas'
import { listWorkOSUsers, type WorkOSUserListItem } from '@/lib/workos'
import { derivarEstadoOperativo, buildAttentionItems, type EstadoOperativo, type AttentionItem } from '@/lib/operativo'

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type EditandoParam = string

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusClasses(status: Ronda['estado']) {
  switch (status) {
    case 'activa':
      return 'bg-emerald-100 text-emerald-800'
    case 'cerrada':
      return 'bg-slate-200 text-slate-700'
    default:
      return 'bg-amber-100 text-amber-800'
  }
}

function RondaConfigForm({ round }: { round: Ronda }) {
  const contaminantesByName = new Map(round.contaminantes.map((item) => [item.contaminante, item]))

  return (
    <form action={updateRondaAction} className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <input type="hidden" name="ronda_id" value={round.id} />

      <div className="space-y-1">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Editar configuración de ronda</h2>
        <p className="text-sm text-[var(--foreground-muted)]">
          Actualice nombre, código, contaminantes, niveles y réplicas antes de recibir envíos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
          <span>Nombre</span>
          <input
            type="text"
            name="nombre"
            required
            defaultValue={round.nombre}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none ring-0"
          />
        </label>
        <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
          <span>Código</span>
          <input
            type="text"
            name="codigo"
            required
            defaultValue={round.codigo}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none ring-0"
          />
        </label>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {CONTAMINANTES.map((contaminante) => {
          const config = contaminantesByName.get(contaminante)
          return (
            <div
              key={contaminante}
              className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 md:grid-cols-[1.4fr_1fr_1fr]"
            >
              <label className="flex items-center gap-3 text-sm font-medium text-[var(--foreground)]">
                <input
                  type="checkbox"
                  name={`enabled_${contaminante}`}
                  defaultChecked={Boolean(config)}
                  className="h-4 w-4 rounded border-[var(--border)] accent-[var(--pt-primary)]"
                />
                <span>{contaminante}</span>
              </label>

              <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
                <span>Niveles</span>
                <input
                  type="number"
                  min="1"
                  name={`niveles_${contaminante}`}
                  defaultValue={config?.niveles ?? 1}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--pt-primary)] transition-colors"
                />
              </label>

              <label className="grid gap-1 text-sm text-[var(--foreground-muted)]">
                <span>Réplicas</span>
                <select
                  name={`replicas_${contaminante}`}
                  defaultValue={String(config?.replicas ?? 2)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--pt-primary)] transition-colors"
                >
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </label>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border-soft)] pt-4">
        <Link href="/dashboard?tab=rondas" className="btn-outline">
          Cancelar
        </Link>
        <button type="submit" className="btn-primary">
          Guardar configuración
        </button>
      </div>
    </form>
  )
}

function StatusAction({ round }: { round: Ronda }) {
  const secondaryButtonClass =
    'min-w-20 rounded-lg border border-[var(--border)] px-2.5 py-1 text-center text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--pt-primary)] hover:bg-[var(--pt-primary-subtle)] disabled:cursor-not-allowed disabled:border-[var(--border-soft)] disabled:bg-[var(--surface-muted)] disabled:text-[var(--foreground-muted)]'

  if (round.estado === 'borrador') {
    return (
      <form action={changeRondaStatusAction}>
        <input type="hidden" name="ronda_id" value={round.id} />
        <input type="hidden" name="next_state" value="activa" />
        <button
          type="submit"
          className={secondaryButtonClass}
        >
          Abrir
        </button>
      </form>
    )
  }

  if (round.estado === 'cerrada') {
    return (
      <form action={reabrirRondaAction}>
        <input type="hidden" name="ronda_id" value={round.id} />
        <button type="submit" className={secondaryButtonClass}>
          Abrir
        </button>
      </form>
    )
  }

  return (
    <button type="button" disabled className={secondaryButtonClass}>
      Abrir
    </button>
  )
}

function CloseRondaAction({ round }: { round: Ronda }) {
  const secondaryButtonClass =
    'min-w-20 rounded-lg border border-[var(--border)] px-2.5 py-1 text-center text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--pt-primary)] hover:bg-[var(--pt-primary-subtle)] disabled:cursor-not-allowed disabled:border-[var(--border-soft)] disabled:bg-[var(--surface-muted)] disabled:text-[var(--foreground-muted)]'

  if (round.estado !== 'activa') {
    return (
      <button type="button" disabled className={secondaryButtonClass}>
        Cerrar
      </button>
    )
  }

  return (
    <form action={changeRondaStatusAction}>
      <input type="hidden" name="ronda_id" value={round.id} />
      <input type="hidden" name="next_state" value="cerrada" />
      <button type="submit" className={secondaryButtonClass}>
        Cerrar
      </button>
    </form>
  )
}

/* ─── Rondas Table ───────────────────────────────────────────────────── */
function RondasTable({ rondas, editando }: { rondas: Ronda[]; editando: EditandoParam }) {
  if (rondas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--foreground-muted)]">
        No hay rondas creadas todavía. Use el botón «＋ Nueva ronda» para registrar la primera.
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[72rem]">
          <thead>
            <tr className="border-b-2 border-[var(--pt-primary)]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Código / Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Contaminantes</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Partic.</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Creada</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rondas.map((round) => (
              <RondaRow key={round.id} round={round} editando={editando} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RondaRow({ round, editando }: { round: Ronda; editando: EditandoParam }) {
  const isEditing = editando === round.id
  const canEdit = round.estado !== 'cerrada'

  return (
    <>
      <tr className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
        <td className="px-4 py-4">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${statusClasses(round.estado)}`}
          >
            {round.estado}
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="font-medium text-sm text-[var(--foreground)]">{round.nombre}</div>
          <div className="text-xs text-[var(--foreground-muted)] mt-0.5">{round.codigo}</div>
        </td>
        <td className="px-4 py-4">
          <div className="flex flex-wrap gap-1">
            {round.contaminantes.length === 0 ? (
              <span className="text-xs text-[var(--foreground-muted)]">—</span>
            ) : (
              round.contaminantes.map((c) => (
                <span
                  key={c.id}
                  className="rounded border border-[var(--border)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--foreground-muted)]"
                >
                  {c.contaminante}
                </span>
              ))
            )}
          </div>
        </td>
        <td className="px-4 py-4 text-center">
          <span className="numeric text-sm text-[var(--foreground)]">
            {round.participantes_asignados ?? 0}/{round.participantes_planeados ?? 0}
          </span>
        </td>
        <td className="px-4 py-4 text-xs text-[var(--foreground-muted)] whitespace-nowrap">
          {formatDate(round.created_at)}
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/dashboard/rondas/${round.id}`}
              className="btn-primary min-w-20 px-3 py-1 text-center text-xs"
            >
              Ingresar
            </Link>
            <StatusAction round={round} />
            <CloseRondaAction round={round} />
            <form action={deleteRondaAction}>
              <input type="hidden" name="ronda_id" value={round.id} />
              <ConfirmSubmitButton
                type="submit"
                message={`¿Borrar la ronda ${round.codigo}? Esta acción no se puede deshacer.`}
                className="min-w-20 rounded-lg border border-rose-200 px-2.5 py-1 text-center text-xs font-medium text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-800"
              >
                Eliminar
              </ConfirmSubmitButton>
            </form>
          </div>
        </td>
      </tr>
      {isEditing && canEdit && (
        <tr className="border-b border-[var(--border-soft)]">
          <td colSpan={6} className="px-4 py-4 bg-[var(--surface-muted)]">
            <RondaConfigForm round={round} />
          </td>
        </tr>
      )}
    </>
  )
}



type ResultadoDashboardRonda = {
  ronda: Ronda
  ptItems: RondaPTItem[]
  sampleGroups: RondaPTSampleGroup[]
  resultados: ResultadoParticipantePT[]
}

type ResultadoColumna = {
  key: string
  contaminante: Contaminante
  run: string
  level: string
  sampleGroup: string
}

async function loadResultadosDashboard(rondas: Ronda[]): Promise<ResultadoDashboardRonda[]> {
  return Promise.all(
    rondas.map(async (ronda) => {
      const [ptItems, sampleGroups, resultados] = await Promise.all([
        listPTItems(ronda.id),
        listPTSampleGroups(ronda.id),
        listResultadosPTRonda(ronda.id),
      ])

      return { ronda, ptItems, sampleGroups, resultados }
    })
  )
}

function getResultadoColumns(
  ptItems: RondaPTItem[],
  sampleGroups: RondaPTSampleGroup[],
  contaminante?: Contaminante
): ResultadoColumna[] {
  const filteredItems = contaminante
    ? ptItems.filter((item) => item.contaminante === contaminante)
    : ptItems

  return filteredItems.flatMap((item) =>
    sampleGroups.map((group) => ({
      key: `${item.id}::${group.id}`,
      contaminante: item.contaminante,
      run: item.run_code,
      level: item.level_label,
      sampleGroup: group.sample_group,
    }))
  )
}

function getResultadoCellMap(resultado: ResultadoParticipantePT) {
  return resultado.celdas.reduce<Record<string, { mean_value: number; sd_value: number }>>((acc, celda) => {
    acc[`${celda.pt_item_id}::${celda.sample_group_id}`] = {
      mean_value: celda.mean_value,
      sd_value: celda.sd_value,
    }
    return acc
  }, {})
}

function formatFinalSubmitted(value: string | null) {
  if (!value) return 'Sin envío final'
  return formatDate(value)
}

function ResultadosDashboardTable({
  resultados,
  columnas,
}: {
  resultados: ResultadoParticipantePT[]
  columnas: ResultadoColumna[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[64rem] border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 border-b-2 border-[var(--pt-primary)] bg-[var(--surface)] px-4 py-3 text-left font-semibold text-[var(--foreground)]">
              Participante
            </th>
            <th className="border-b-2 border-[var(--pt-primary)] bg-[var(--surface)] px-4 py-3 text-left font-semibold text-[var(--foreground)]">
              Estado
            </th>
            <th className="border-b-2 border-[var(--pt-primary)] bg-[var(--surface)] px-4 py-3 text-left font-semibold text-[var(--foreground)]">
              Envío final
            </th>
            {columnas.map((columna) => (
              <th
                key={columna.key}
                className="border-b-2 border-[var(--pt-primary)] bg-[var(--surface)] px-4 py-3 text-left font-semibold text-[var(--foreground)]"
              >
                <div className="text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                  {columna.contaminante}
                </div>
                <div>{columna.run}</div>
                <div className="text-xs text-[var(--foreground-muted)]">
                  {columna.level} · {columna.sampleGroup}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resultados.map((resultado) => {
            const celdas = getResultadoCellMap(resultado)
            const completo = resultado.completados >= resultado.total_esperado && resultado.total_esperado > 0
            return (
              <tr key={resultado.participante_id} className="align-top">
                <td className="sticky left-0 z-10 border-b border-[var(--border-soft)] bg-[var(--surface)] px-4 py-4">
                  <div className="font-medium text-[var(--foreground)]">{resultado.email}</div>
                  <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                    participant_id:{' '}
                    <span className="numeric text-[var(--foreground)]">{resultado.participant_code ?? '—'}</span>
                  </div>
                  <div className="text-xs text-[var(--foreground-muted)]">
                    replicate:{' '}
                    <span className="numeric text-[var(--foreground)]">{resultado.replicate_code ?? '—'}</span>
                  </div>
                </td>
                <td className="border-b border-[var(--border-soft)] px-4 py-4">
                  <span className={`numeric rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    completo ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {resultado.completados}/{resultado.total_esperado}
                  </span>
                </td>
                <td className="border-b border-[var(--border-soft)] px-4 py-4 text-[var(--foreground-muted)]">
                  {formatFinalSubmitted(resultado.enviados_at)}
                </td>
                {columnas.map((columna) => {
                  const celda = celdas[columna.key]
                  return (
                    <td key={`${resultado.participante_id}-${columna.key}`} className="border-b border-[var(--border-soft)] px-4 py-4">
                      {celda ? (
                        <div className="space-y-1">
                          <div className="numeric font-medium text-[var(--foreground)]">mean {celda.mean_value}</div>
                          <div className="numeric text-xs text-[var(--foreground-muted)]">sd {celda.sd_value}</div>
                        </div>
                      ) : (
                        <span className="text-[var(--border)]">Sin dato</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ResultadosGlobalView({
  rondasResultados,
  activeContaminante,
}: {
  rondasResultados: ResultadoDashboardRonda[]
  activeContaminante: Contaminante | null
}) {
  if (rondasResultados.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--foreground-muted)]">
        No hay rondas creadas todavía.
      </div>
    )
  }

  const rondasConConfig = rondasResultados.filter((item) => item.ptItems.length > 0 && item.sampleGroups.length > 0)
  const totalParticipantes = rondasResultados.reduce((sum, item) => sum + item.resultados.length, 0)
  const totalEnviosFinales = rondasResultados.reduce(
    (sum, item) => sum + item.resultados.filter((resultado) => resultado.enviados_at !== null).length,
    0
  )
  const contaminantes = Array.from(
    new Set(rondasResultados.flatMap((item) => item.ptItems.map((ptItem) => ptItem.contaminante)))
  )
  const baseHref = '/dashboard?tab=resultados'
  const activeContaminanteDisponible = activeContaminante && contaminantes.includes(activeContaminante)
  const activeTab = activeContaminanteDisponible ? activeContaminante : 'rondas'

  return (
    <div className="grid gap-6">
      <header className="header-bar px-6 py-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">Resultados PT</h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            Dashboard global de resultados. Ingrese por ronda o revise una pestaña específica por contaminante.
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-accent border-l-[var(--pt-primary)] px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Rondas</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{rondasResultados.length}</div>
        </div>
        <div className="card-accent border-l-[var(--pt-primary)] px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Participantes</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{totalParticipantes}</div>
        </div>
        <div className="card-accent border-l-emerald-500 bg-emerald-50/40 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Envíos finales</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{totalEnviosFinales}</div>
        </div>
        <div className="card-accent border-l-[var(--pt-primary)] px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Contaminantes</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{contaminantes.length}</div>
        </div>
      </section>

      <nav
        className="overflow-hidden rounded-xl border border-[var(--border)] shadow-sm"
        style={{ background: 'linear-gradient(135deg, #F5F6F7 0%, #F5F5F0 100%)' }}
      >
        <div className="flex gap-0 overflow-x-auto px-2">
          <Link
            href={baseHref}
            aria-current={activeTab === 'rondas' ? 'page' : undefined}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'rondas'
                ? 'border-[var(--pt-primary)] font-semibold text-[var(--foreground)]'
                : 'border-transparent text-[var(--foreground-muted)] hover:border-[var(--border)] hover:text-[var(--foreground)]'
            }`}
          >
            Rondas
          </Link>
          {contaminantes.map((contaminante) => (
            <Link
              key={contaminante}
              href={`${baseHref}&contaminante=${contaminante}`}
              aria-current={activeTab === contaminante ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === contaminante
                  ? 'border-[var(--pt-primary)] font-semibold text-[var(--foreground)]'
                  : 'border-transparent text-[var(--foreground-muted)] hover:border-[var(--border)] hover:text-[var(--foreground)]'
              }`}
            >
              {contaminante}
            </Link>
          ))}
        </div>
      </nav>

      {rondasConConfig.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--foreground-muted)]">
          No hay resultados PT configurados todavía.
        </div>
      ) : activeTab === 'rondas' ? (
        <section className="card overflow-hidden">
          <div className="border-b border-[var(--border-soft)] px-4 py-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Rondas con resultados</h3>
            <p className="text-xs text-[var(--foreground-muted)]">
              Tabla global para entrar a la matriz de resultados de cada ronda.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem]">
              <thead>
                <tr className="border-b-2 border-[var(--pt-primary)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Ronda</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Contaminantes</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Participantes</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Envíos finales</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Acción</th>
                </tr>
              </thead>
              <tbody>
                {rondasConConfig.map(({ ronda, ptItems, resultados }) => {
                  const enviosFinales = resultados.filter((resultado) => resultado.enviados_at !== null).length
                  const contaminantesRonda = Array.from(new Set(ptItems.map((item) => item.contaminante)))
                  return (
                    <tr key={ronda.id} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${statusClasses(ronda.estado)}`}>
                          {ronda.estado}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-sm text-[var(--foreground)]">{ronda.nombre}</div>
                        <div className="mt-0.5 text-xs text-[var(--foreground-muted)]">{ronda.codigo}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {contaminantesRonda.map((contaminante) => (
                            <span key={`${ronda.id}-${contaminante}`} className="rounded border border-[var(--border)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--foreground-muted)]">
                              {contaminante}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="numeric text-sm text-[var(--foreground)]">{resultados.length}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="numeric rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          {enviosFinales}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/dashboard/rondas/${ronda.id}/resultados`}
                          className="btn-primary inline-flex px-3 py-1 text-xs"
                        >
                          Ingresar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="grid gap-6">
          {rondasConConfig
            .map((item) => ({
              ...item,
              columnas: getResultadoColumns(item.ptItems, item.sampleGroups, activeTab as Contaminante),
            }))
            .filter((item) => item.columnas.length > 0)
            .map(({ ronda, resultados, columnas }) => (
              <article key={`${activeTab}-${ronda.id}`} className="card overflow-hidden">
                <div className="border-b border-[var(--border-soft)] px-4 py-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--foreground)]">{ronda.nombre}</h3>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        {ronda.codigo} · resultados para {activeTab}
                      </p>
                    </div>
                    <Link href={`/dashboard/rondas/${ronda.id}/resultados`} className="btn-outline self-start">
                      Ingresar
                    </Link>
                  </div>
                </div>
                <ResultadosDashboardTable resultados={resultados} columnas={columnas} />
              </article>
            ))}
        </section>
      )}
      </div>
  )
}

/* ─── Global Participants View (lab index) ───────────────────────────── */
function ParticipantesGlobalView({
  participantes,
}: {
  participantes: ParticipanteGlobal[]
}) {
  if (participantes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--foreground-muted)]">
        No hay participantes registrados en ninguna ronda todavía.
      </div>
    )
  }

  const conEnlace = participantes.filter((p) => p.rondas.some((r) => r.estado_enlace === 'reclamado'))
  const sinEnlace = participantes.filter((p) => p.rondas.every((r) => r.estado_enlace === 'pendiente'))

  return (
    <div className="grid gap-6">
      <ParticipantGroupTable
        title="Con enlace"
        description="Cupos ya reclamados por una cuenta de WorkOS."
        participantes={conEnlace}
        emptyMessage="No hay participantes con enlace reclamado."
        tone="success"
      />
      <ParticipantGroupTable
        title="Sin enlace"
        description="Cupos pendientes de reclamar, incluidos los que ya tienen ficha iniciada."
        participantes={sinEnlace}
        emptyMessage="No hay participantes pendientes de reclamar."
        tone="warning"
      />
    </div>
  )
}

function ParticipantGroupTable({
  title,
  description,
  participantes,
  emptyMessage,
  tone,
}: {
  title: string
  description: string
  participantes: ParticipanteGlobal[]
  emptyMessage: string
  tone: 'success' | 'warning'
}) {
  const grouped = Array.from(
    participantes.reduce((acc, participante) => {
      const nit = participante.nit_laboratorio ?? '—'
      const current = acc.get(nit) ?? []
      current.push(participante)
      acc.set(nit, current)
      return acc
    }, new Map<string, ParticipanteGlobal[]>())
  ).sort(([nitA], [nitB]) => nitA.localeCompare(nitB))

  if (participantes.length === 0) {
    return (
      <div className={`rounded-xl border border-dashed px-6 py-10 text-center text-sm ${tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-[var(--border-soft)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
        <p className="text-xs text-[var(--foreground-muted)]">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[60rem]">
          <thead>
            <tr className="border-b-2 border-[var(--pt-primary)]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">NIT</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Enlace</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Ficha</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Rondas / envíos</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(([nit, group]) =>
              group.map((p, index) => {
                const rondasActivas = p.rondas.filter((r) => r.estado === 'activa')
                const reclamados = p.rondas.filter((r) => r.estado_enlace === 'reclamado').length
                const pendientes = p.rondas.filter((r) => r.estado_enlace === 'pendiente').length
                const participanteHref = `/dashboard/participantes/${encodeURIComponent(p.workos_user_id)}`
                const fichaLabel =
                  p.ficha_estado === 'enviado' ? 'Enviada' : p.ficha_estado === 'borrador' ? 'Borrador' : 'No iniciada'

                return (
                  <tr key={p.workos_user_id} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
                    <td className="px-4 py-4">
                      {index === 0 ? <div className="numeric text-sm font-medium text-[var(--foreground)]">{nit}</div> : <span className="text-[var(--foreground-muted)]">〃</span>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-[var(--foreground)]">
                        {p.correo_laboratorio?.trim() || p.email}
                      </div>
                      {p.correo_laboratorio && p.correo_laboratorio !== p.email && (
                        <div className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                          Correo WorkOS: {p.email}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                        <span>{reclamados} con enlace</span>
                        <span> · </span>
                        <span>{pendientes} pendientes de reclamar</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${pendientes > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {pendientes > 0 ? 'Sin enlace' : 'Con enlace'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.ficha_estado === 'enviado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {fichaLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {p.correo_laboratorio && (
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                            Laboratorio manual
                          </span>
                        )}
                        <span className="rounded-full bg-[var(--pt-primary-subtle)] px-3 py-1 text-xs font-semibold text-[var(--foreground)]">
                          {rondasActivas.length} activas
                        </span>
                        <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--foreground-muted)]">
                          {p.total_envios} envíos
                        </span>
                        <Link href={participanteHref} className="btn-primary inline-flex px-3 py-1 text-xs">
                          Ingresar
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function RegistrosTabView({
  participantesGlobal,
  workosUsers,
}: {
  participantesGlobal: ParticipanteGlobal[]
  workosUsers: WorkOSUserListItem[]
}) {
  const conEnlace = participantesGlobal.filter((p) => p.rondas.some((r) => r.estado_enlace === 'reclamado'))
  const sinEnlace = participantesGlobal.filter((p) => p.rondas.every((r) => r.estado_enlace === 'pendiente'))
  const pendientesIngreso = participantesGlobal.filter((p) =>
    p.rondas.some(
      (r) =>
        r.estado_enlace === 'pendiente' &&
        (r.ficha_estado !== 'no_iniciada' || Boolean(p.correo_laboratorio) || Boolean(p.nit_laboratorio))
    )
  )

  return (
    <section className="grid gap-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card-accent px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Total</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{participantesGlobal.length}</div>
        </div>
        <div className="card-accent px-5 py-4 border-l-emerald-500 bg-emerald-50/40">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Con enlace</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{conEnlace.length}</div>
        </div>
        <div className="card-accent px-5 py-4 border-l-amber-500 bg-amber-50/50">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Sin reclamar</div>
          <div className="numeric mt-2 text-3xl font-semibold text-[var(--foreground)]">{sinEnlace.length}</div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--border-soft)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Pendientes de ingreso</h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Participantes creados por admin que todavía no han reclamado su enlace, pero ya tienen ficha o correo de laboratorio.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem]">
            <thead>
              <tr className="border-b-2 border-[var(--pt-primary)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">NIT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Correo laboratorio</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Correo WorkOS</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Ficha</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Rondas</th>
              </tr>
            </thead>
            <tbody>
              {pendientesIngreso.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-[var(--foreground-muted)]" colSpan={5}>
                    No hay participantes pendientes de ingreso con ficha o correo cargado.
                  </td>
                </tr>
              ) : (
                pendientesIngreso.map((p) => {
                  const rondasPendientes = p.rondas.filter((r) => r.estado_enlace === 'pendiente').length
                  return (
                    <tr key={`${p.workos_user_id}-pendiente`} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
                      <td className="px-4 py-4 text-sm font-medium text-[var(--foreground)]">
                        {p.nit_laboratorio?.trim() ? p.nit_laboratorio : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--foreground)]">
                        <div className="font-medium">{p.correo_laboratorio?.trim() || p.email}</div>
                        {p.correo_laboratorio && p.correo_laboratorio !== p.email && (
                          <div className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                            WorkOS: {p.email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--foreground)]">
                        <div>{p.email}</div>
                        <div className="mt-1 text-xs text-[var(--foreground-muted)]">Enlace pendiente</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          p.ficha_estado === 'enviado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.ficha_estado === 'borrador'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.ficha_estado === 'enviado' ? 'Enviada' : p.ficha_estado === 'borrador' ? 'Borrador' : 'No iniciada'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {p.correo_laboratorio && (
                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                              Admin creado
                            </span>
                          )}
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            {rondasPendientes} pendientes
                          </span>
                          <Link href={`/dashboard/participantes/${encodeURIComponent(p.workos_user_id)}`} className="btn-primary inline-flex px-3 py-1 text-xs">
                            Abrir
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--border-soft)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Directorio WorkOS</h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Muestra todas las personas creadas en WorkOS, incluso si todavía no están en una ronda.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem]">
            <thead>
              <tr className="border-b-2 border-[var(--pt-primary)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Correo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">WorkOS ID</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {workosUsers.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-[var(--foreground-muted)]" colSpan={4}>
                    No hay usuarios en WorkOS.
                  </td>
                </tr>
              ) : (
                workosUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
                    <td className="px-4 py-4 text-sm font-medium text-[var(--foreground)]">
                      {user.firstName || user.lastName ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : user.displayName}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--foreground)]">
                      {user.email}
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--foreground-muted)]">
                      {user.id}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link href={`/dashboard/participantes/${encodeURIComponent(user.id)}`} className="btn-primary inline-flex px-3 py-1 text-xs">
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

/* ─── Participante View (non-admin) ──────────────────────────────────── */
function estadoParticipanteBadge(estado: Ronda['estado']) {
  if (estado === 'activa') return 'bg-emerald-100 text-emerald-800'
  if (estado === 'cerrada') return 'bg-slate-200 text-slate-700'
  return 'bg-amber-100 text-amber-800'
}

function FichaBadge({ estado }: { estado: RondaParticipanteAsignada['ficha_estado'] }) {
  if (estado === 'enviado') {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        Ficha enviada ✓
      </span>
    )
  }
  if (estado === 'borrador') {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        Ficha en borrador
      </span>
    )
  }
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      Ficha no iniciada
    </span>
  )
}

function RondaParticipanteCard({ ronda }: { ronda: RondaParticipanteAsignada }) {
  const esActiva = ronda.estado === 'activa'
  const fichaEnviada = ronda.ficha_estado === 'enviado'
  const fichaLabel =
    ronda.ficha_estado === 'enviado'
      ? 'Ver ficha'
      : ronda.ficha_estado === 'borrador'
        ? 'Continuar ficha'
        : 'Diligenciar ficha'
  const puedeCargarDatos = esActiva && fichaEnviada

  return (
    <article className="card grid gap-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{ronda.nombre}</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${estadoParticipanteBadge(ronda.estado)}`}
            >
              {ronda.estado}
            </span>
          </div>
          <p className="text-sm text-[var(--foreground-muted)]">
            Código <span className="font-medium text-[var(--foreground)]">{ronda.codigo}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <FichaBadge estado={ronda.ficha_estado} />
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
            <Link href={`/ronda/${ronda.codigo}/registro`} className="btn-primary self-start">
              {fichaLabel} →
            </Link>

            {puedeCargarDatos ? (
              <Link href={`/ronda/${ronda.codigo}`} className="btn-outline self-start">
                Cargar datos
              </Link>
            ) : (
              <span className="self-start rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--foreground-muted)]">
                Cargar datos
              </span>
            )}
          </div>

          {!puedeCargarDatos && (
            <p className="max-w-64 text-left text-xs leading-5 text-[var(--foreground-muted)] sm:text-right">
              {ronda.estado === 'borrador'
                ? 'Diligencie la ficha ahora. La carga de datos se habilita cuando el coordinador active la ronda.'
                : fichaEnviada
                  ? 'La carga de datos no está disponible para esta ronda.'
                  : 'Complete la ficha para habilitar el ingreso de resultados.'}
            </p>
          )}
        </div>
      </div>

      {ronda.contaminantes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ronda.contaminantes.map((c) => (
            <span
              key={c.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs text-[var(--foreground-muted)]"
            >
              {c.contaminante} · {c.niveles}N · {c.replicas}R
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

function ParticipanteView({ rondas }: { rondas: RondaParticipanteAsignada[] }) {
  return (
    <section className="grid gap-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Mis rondas asignadas</h2>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Rondas en las que está habilitado para cargar resultados.
        </p>
      </div>

      {rondas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--foreground-muted)]">
          No tiene rondas asignadas todavía. Contacte al coordinador para que lo agregue.
        </div>
      ) : (
        rondas.map((r) => <RondaParticipanteCard key={r.id} ronda={r} />)
      )}
    </section>
  )
}

/* ─── Coordinator KPI Bar ─────────────────────────────────────────────── */
type CoordinatorKpiBarProps = {
  rondasActivas: number
  rondasBorrador: number
  fichasPendientes: number
  enlacesSinReclamar: number
  rondasListasParaExportar: number
}

function CoordinatorKpiBar({
  rondasActivas,
  rondasBorrador,
  fichasPendientes,
  enlacesSinReclamar,
  rondasListasParaExportar,
}: CoordinatorKpiBarProps) {
  const kpis = [
    {
      label: 'Rondas activas',
      value: rondasActivas,
      detail: 'Disponibles para gestión',
      href: '/dashboard?tab=rondas',
      negative: false,
    },
    {
      label: 'Fichas pendientes',
      value: fichasPendientes,
      detail: 'Por revisar o completar',
      href: '/dashboard?tab=participantes',
      negative: true,
    },
    {
      label: 'Cupos sin reclamar',
      value: enlacesSinReclamar,
      detail: 'Invitaciones pendientes',
      href: '/dashboard?tab=participantes',
      negative: true,
    },
    {
      label: 'Listas para exportar',
      value: rondasListasParaExportar,
      detail: 'Con resultados finales',
      href: '/dashboard?tab=resultados',
      negative: false,
    },
    {
      label: 'En borrador',
      value: rondasBorrador,
      detail: 'Rondas aún no activas',
      href: '/dashboard?tab=rondas',
      negative: false,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {kpis.map(({ label, value, detail, href, negative }) => (
        <Link
          key={label}
          href={href}
          className={`card-accent px-5 py-4 transition hover:border-[var(--pt-primary)] ${
            value > 0 && negative ? 'border-amber-300 bg-amber-50/50' : ''
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
            {label}
          </p>
          <div className={`numeric mt-2 text-3xl font-semibold ${
            value > 0 && negative ? 'text-amber-700' : 'text-[var(--foreground)]'
          }`}>
            {value}
          </div>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">{detail}</p>
        </Link>
      ))}
    </div>
  )
}

/* ─── Attention List ─────────────────────────────────────────────────── */
function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null
  return (
    <section className="grid gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
        Requiere atención
      </h2>
      <ul className="grid gap-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition hover:border-[var(--pt-primary)] ${
                item.severity === 'warning'
                  ? 'border-amber-200 bg-amber-50/60 text-amber-800'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]'
              }`}
            >
              <span>{item.message}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                item.severity === 'warning'
                  ? 'bg-amber-200 text-amber-800'
                  : 'bg-[var(--pt-primary-subtle)] text-[var(--foreground)]'
              }`}>
                {item.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ─── Estado Operativo Badge ─────────────────────────────────────────── */
const estadoColorClasses: Record<EstadoOperativo['color'], string> = {
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  slate: 'bg-slate-200 text-slate-700',
  violet: 'bg-violet-100 text-violet-800',
}

function EstadoOperativoBadge({ estado }: { estado: EstadoOperativo }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap ${estadoColorClasses[estado.color]}`}>
      {estado.label}
    </span>
  )
}

/* ─── Mini Progress Bar ──────────────────────────────────────────────── */
function MiniProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="mt-1 h-1.5 w-full max-w-[5rem] rounded-full bg-[var(--border)]" title={`${pct}%`}>
      <div
        className="h-full rounded-full bg-[var(--pt-primary)] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/* ─── Rondas en Curso (inicio view) ──────────────────────────────────── */
function RondasEnCurso({
  rondasActivas,
  participantesPorRonda,
}: {
  rondasActivas: Ronda[]
  participantesPorRonda: ParticipanteRondaResumen[][]
}) {
  if (rondasActivas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--foreground-muted)]">
        No hay rondas activas en este momento.
      </div>
    )
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
        Rondas en curso
      </h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem]">
            <thead>
              <tr className="border-b-2 border-[var(--pt-primary)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Ronda</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Cupos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Fichas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">Envíos PT</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]"></th>
              </tr>
            </thead>
            <tbody>
              {rondasActivas.map((ronda, i) => {
                const participantes = participantesPorRonda[i] ?? []
                const estado = derivarEstadoOperativo(ronda, participantes)
                const fichasEnviadas = participantes.filter((p) => p.ficha_estado === 'enviado').length
                const totalEnviosPT = participantes.reduce((sum, p) => sum + p.envios_pt_count, 0)
                return (
                  <tr key={ronda.id} className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-muted)]">
                    <td className="px-4 py-4">
                      <EstadoOperativoBadge estado={estado} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-sm text-[var(--foreground)]">{ronda.nombre}</div>
                      <div className="text-xs text-[var(--foreground-muted)] mt-0.5">{ronda.codigo}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="numeric text-sm text-[var(--foreground)]">
                        {ronda.participantes_asignados ?? 0}/{ronda.participantes_planeados ?? 0}
                      </span>
                      <MiniProgressBar current={ronda.participantes_asignados ?? 0} total={ronda.participantes_planeados ?? 0} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="numeric text-sm text-[var(--foreground)]">
                        {fichasEnviadas}/{participantes.length}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="numeric text-sm text-[var(--foreground)]">{totalEnviosPT}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/dashboard/rondas/${ronda.id}`}
                        className="inline-flex items-center rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--pt-primary)] hover:bg-[var(--pt-primary-subtle)]"
                      >
                        Abrir →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}


/* ─── Main Page ──────────────────────────────────────────────────────── */
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')

  const params = searchParams ? await searchParams : {}
  const success = getParamValue(params.success)
  const error = getParamValue(params.error)
  const admin = isAdmin(auth)
  const activeTab = getParamValue(params.tab) ?? 'inicio'
  const editando = getParamValue(params.editando) ?? ''
  const resultadosContaminante = (getParamValue(params.contaminante) ?? null) as Contaminante | null

  const rondas = admin ? await listRondas() : []
  const allParticipantes = admin ? await listAllParticipantes() : []
  const workosUsers = admin ? await listWorkOSUsers() : []
  const rondasParticipante = !admin ? await listRondasParticipante(auth.user.id) : []
  const rondasResultados = admin && activeTab === 'resultados'
    ? await loadResultadosDashboard(rondas)
    : []

  const rondasActivas = rondas.filter((r) => r.estado === 'activa')
  const participantesRondasActivas = admin
    ? await Promise.all(rondasActivas.map((r) => listParticipantesRondaResumen(r.id)))
    : []
  const fichasPendientesCount = participantesRondasActivas
    .flat()
    .filter((p) => p.ficha_estado !== 'enviado').length

  // Derived metrics for the coordinator work tray
  const enlacesSinReclamar = participantesRondasActivas
    .flat()
    .filter((p) => p.estado === 'pendiente').length
  const rondasListasParaExportar = rondasActivas.filter((_, i) =>
    participantesRondasActivas[i]?.some((p) => p.envios_pt_count > 0)
  ).length
  const attentionItems = admin
    ? buildAttentionItems(rondas, participantesRondasActivas)
    : []

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="header-bar px-8 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <LogoUnal height={64} />
              <div className="space-y-0.5">
                <h1 className="text-xl font-bold text-[var(--foreground)]">
                  CALAIRE-APP <span className="font-medium text-[var(--foreground-muted)]">Ensayos de Aptitud</span>
                </h1>
                <p className="text-base font-medium text-[var(--pt-primary-dark)]">
                  Gases Contaminantes Criterio
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Laboratorio CALAIRE · Universidad Nacional de Colombia — Sede Medellín
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {auth.user.email} · {admin ? 'Coordinador' : 'Participante'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {admin && (
                <Link
                  href="/dashboard/rondas/nueva"
                  className="btn-primary"
                >
                  ＋ Nueva ronda
                </Link>
              )}
              <form
                action={async () => {
                  'use server'
                  await signOut({ returnTo: buildAbsoluteAppUrl('/login') })
                }}
              >
                <button type="submit" className="btn-outline">
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </header>

        <Alert tone="success" message={success} />
        <Alert tone="error" message={error} />

        {!admin ? (
          <ParticipanteView rondas={rondasParticipante} />
        ) : (
          <div className="grid gap-6">
            {/* ── KPI bar ───────────────────────────────────────── */}
            <CoordinatorKpiBar
              rondasActivas={rondasActivas.length}
              rondasBorrador={rondas.filter((r) => r.estado === 'borrador').length}
              fichasPendientes={fichasPendientesCount}
              enlacesSinReclamar={enlacesSinReclamar}
              rondasListasParaExportar={rondasListasParaExportar}
            />

            {/* ── Vista de inicio: bandeja de trabajo ─────────── */}
            {activeTab === 'inicio' && (
              <>
                <AttentionList items={attentionItems} />
                <RondasEnCurso
                  rondasActivas={rondasActivas}
                  participantesPorRonda={participantesRondasActivas}
                />
                {/* PT App link at the bottom of work tray */}
                <a
                  href="https://w421.shinyapps.io/pt_app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card flex items-center justify-between gap-4 p-5 transition hover:border-[var(--pt-primary)]"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-[var(--foreground)]">Herramienta de análisis PT App</p>
                    <p className="text-xs text-[var(--foreground-muted)]">Aplicativo R/Shiny para el procesamiento estadístico de resultados</p>
                  </div>
                  <span className="btn-primary shrink-0">Abrir →</span>
                </a>
              </>
            )}

            {/* ── Tab rondas: lista completa ──────────────────── */}
            {activeTab === 'rondas' && (
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {rondas.length} ronda{rondas.length !== 1 ? 's' : ''} registrada{rondas.length !== 1 ? 's' : ''}
                  </p>
                  <Link href="/dashboard/rondas/nueva" className="btn-primary">
                    ＋ Nueva ronda
                  </Link>
                </div>
                <RondasTable rondas={rondas} editando={editando} />
              </div>
            )}

            {activeTab === 'registros' && (
              <RegistrosTabView participantesGlobal={allParticipantes} workosUsers={workosUsers} />
            )}

            {activeTab === 'participantes' && (
              <ParticipantesGlobalView
                participantes={allParticipantes}
              />
            )}

            {activeTab === 'resultados' && (
              <ResultadosGlobalView
                rondasResultados={rondasResultados}
                activeContaminante={resultadosContaminante}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
