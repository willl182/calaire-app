import Link from 'next/link'
import { SGC_PLAN_BLOQUES } from '@/lib/sgc/catalog'
import type { SgcPanel } from '@/lib/sgc'
import {
  finalizarPlanRondaAction,
  finalizarRevisionDatosAction,
  finalizarRevisionHomogeneidadAction,
  guardarPlanRondaAction,
  guardarRevisionDatosAction,
  guardarRevisionHomogeneidadAction,
} from './actions'

const INFORME_CHECK_LABELS: Record<string, string> = {
  participantes_revisados: 'Participantes, codigos y fichas revisados',
  fichas_revisadas: 'F-PSEA-03 y registros de participacion consistentes',
  envios_finales_revisados: 'F-PSEA-08/F-PSEA-12 revisados contra envios finales',
  metricas_revisadas: 'Metricas y salidas usadas en el informe revisadas',
  evidencias_revisadas: 'Evidencias F-PSEA-09, F-PSEA-10 y anexos revisadas',
  inconsistencias_resueltas: 'Inconsistencias resueltas o justificadas',
  f_psea_11_no_aplica: 'Homogeneidad/estabilidad revisada o no aplicabilidad justificada',
}

const HOMOGENEIDAD_CHECK_LABELS: Record<string, string> = {
  plan_muestreo_revisado: 'Plan de muestreo revisado',
  criterios_aceptacion_definidos: 'Criterios de aceptacion definidos',
  resultados_homogeneidad_revisados: 'Resultados de homogeneidad revisados',
  resultados_estabilidad_revisados: 'Resultados de estabilidad revisados',
  desviaciones_documentadas: 'Desviaciones documentadas',
  conclusion_lote_aprobada: 'Conclusion de lote aprobada',
}

/** Codigos de recurso Drive que tienen un registro diligenciable embebido en el detalle. */
export const REGISTROS_DILIGENCIABLES = new Set(['F-PSEA-06', 'F-PSEA-13', 'F-PSEA-11'])

function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-[var(--border)] bg-white p-4">
      {children}
    </div>
  )
}

function PlanRondaForm({ panel, rondaId }: { panel: SgcPanel; rondaId: string }) {
  const planBloques = panel.plan?.bloques ?? {}
  const planCampos = panel.plan?.camposEstructurados ?? {}
  return (
    <SectionShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-[var(--foreground)]">Registro diligenciable · F-PSEA-06</h4>
          <p className="text-xs text-[var(--foreground-muted)]">Estado: {panel.plan?.estado ?? 'borrador'}</p>
        </div>
        <Link className="btn-outline px-3 py-1 text-xs" href={`/dashboard/rondas/${rondaId}/sgc/plan/print`}>Vista imprimible</Link>
      </div>
      <form action={guardarPlanRondaAction} className="mt-3 space-y-3">
        <input type="hidden" name="ronda_id" value={rondaId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input" name="responsable" placeholder="Responsable" defaultValue={planCampos.responsable ?? ''} />
          <input className="input" name="fecha_plan" type="date" defaultValue={planCampos.fecha_plan ?? ''} />
        </div>
        <div className="max-h-[420px] space-y-4 overflow-y-auto rounded-lg border border-[var(--border)] bg-slate-50/50 p-4 pr-2">
          {SGC_PLAN_BLOQUES.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">{label}</label>
              <textarea
                className="input min-h-24 w-full bg-white"
                name={`bloque_${key}`}
                placeholder={`Ingrese el contenido para el bloque ${key.toUpperCase()}...`}
                defaultValue={planBloques[key] ?? ''}
              />
            </div>
          ))}
        </div>
        <input className="input" name="motivo_revision" placeholder="Motivo si edita un plan finalizado" />
        <button className="btn-primary" type="submit">Guardar F-PSEA-06</button>
      </form>
      <form action={finalizarPlanRondaAction} className="mt-3">
        <input type="hidden" name="ronda_id" value={rondaId} />
        <button className="btn-outline" type="submit">Finalizar F-PSEA-06 y crear snapshot</button>
      </form>
    </SectionShell>
  )
}

function InformeFinalForm({ panel, rondaId }: { panel: SgcPanel; rondaId: string }) {
  const informeChecks = panel.revision?.checks ?? {}
  const informeCheckKeys = Object.keys(INFORME_CHECK_LABELS)
  return (
    <SectionShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-[var(--foreground)]">Registro diligenciable · F-PSEA-13</h4>
          <p className="text-xs text-[var(--foreground-muted)]">Estado: {panel.revision?.estado ?? 'borrador'}</p>
        </div>
        <Link className="btn-outline px-3 py-1 text-xs" href={`/dashboard/rondas/${rondaId}/sgc/f-psea-13/print`}>Vista imprimible</Link>
      </div>
      <form action={guardarRevisionDatosAction} className="mt-3 space-y-3">
        <input type="hidden" name="ronda_id" value={rondaId} />
        <input type="hidden" name="check_keys" value={informeCheckKeys.join(',')} />
        {informeCheckKeys.map((key) => {
          const check = informeChecks[key]
          return (
            <div key={key} className="rounded-lg border border-[var(--border)] p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name={`check_${key}`} defaultChecked={check?.cumple ?? false} />
                {INFORME_CHECK_LABELS[key]}
              </label>
              <input className="input mt-2" name={`obs_${key}`} placeholder="Observacion si no cumple" defaultValue={check?.observacion ?? ''} />
            </div>
          )
        })}
        <button className="btn-primary" type="submit">Guardar F-PSEA-13</button>
      </form>
      <form action={finalizarRevisionDatosAction} className="mt-3">
        <input type="hidden" name="ronda_id" value={rondaId} />
        <button className="btn-outline" type="submit">Finalizar F-PSEA-13 y crear snapshot</button>
      </form>
    </SectionShell>
  )
}

function HomogeneidadForm({ panel, rondaId }: { panel: SgcPanel; rondaId: string }) {
  const homogeneidadChecks = panel.revisionHomogeneidad?.checks ?? {}
  const homogeneidadCheckKeys = Object.keys(HOMOGENEIDAD_CHECK_LABELS)
  return (
    <SectionShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-[var(--foreground)]">Registro diligenciable · F-PSEA-11</h4>
          <p className="text-xs text-[var(--foreground-muted)]">Estado: {panel.revisionHomogeneidad?.estado ?? 'borrador'}</p>
        </div>
      </div>
      <form action={guardarRevisionHomogeneidadAction} className="mt-3 space-y-3">
        <input type="hidden" name="ronda_id" value={rondaId} />
        <input type="hidden" name="homogeneidad_check_keys" value={homogeneidadCheckKeys.join(',')} />
        <textarea
          className="input min-h-24"
          name="homogeneidad_conclusiones"
          placeholder="Conclusion documentada de homogeneidad y estabilidad"
          defaultValue={panel.revisionHomogeneidad?.conclusiones ?? ''}
        />
        <div className="grid gap-3 lg:grid-cols-2">
          {homogeneidadCheckKeys.map((key) => {
            const check = homogeneidadChecks[key]
            return (
              <div key={key} className="rounded-lg border border-[var(--border)] p-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" name={`homogeneidad_check_${key}`} defaultChecked={check?.cumple ?? false} />
                  {HOMOGENEIDAD_CHECK_LABELS[key]}
                </label>
                <input className="input mt-2" name={`homogeneidad_obs_${key}`} placeholder="Observacion si no cumple" defaultValue={check?.observacion ?? ''} />
              </div>
            )
          })}
        </div>
        <button className="btn-primary" type="submit">Guardar F-PSEA-11</button>
      </form>
      <form action={finalizarRevisionHomogeneidadAction} className="mt-3">
        <input type="hidden" name="ronda_id" value={rondaId} />
        <button className="btn-outline" type="submit">Finalizar F-PSEA-11 y crear snapshot</button>
      </form>
    </SectionShell>
  )
}

/**
 * Registro diligenciable embebido en el detalle del Drive documental.
 * Renderiza el formulario nativo (F-PSEA-06/13/11) que corresponde al codigo
 * del recurso seleccionado, o nada si el recurso no tiene registro nativo.
 */
export function SgcRegistroDiligenciable({
  codigo,
  panel,
  rondaId,
}: {
  codigo: string
  panel: SgcPanel
  rondaId: string
}) {
  if (codigo === 'F-PSEA-06') return <PlanRondaForm panel={panel} rondaId={rondaId} />
  if (codigo === 'F-PSEA-13') return <InformeFinalForm panel={panel} rondaId={rondaId} />
  if (codigo === 'F-PSEA-11') return <HomogeneidadForm panel={panel} rondaId={rondaId} />
  return null
}
