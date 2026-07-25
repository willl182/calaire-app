import Link from 'next/link'

type CarpetaServicio = {
  nombre: string
  contenido: string
  descripcion: string
  restringida?: boolean
}

const carpetas: CarpetaServicio[] = [
  {
    nombre: '00_control',
    contenido: '5 documentos',
    descripcion: 'Gobierno, registro de artefactos, versiones, viaje del cliente y equivalencias con el SGC.',
  },
  {
    nombre: '01_mercado',
    contenido: '3 artefactos',
    descripcion: 'Catálogo, programa de ronda y expresión de interés.',
  },
  {
    nombre: '02_precios_restringidos',
    contenido: '3 archivos',
    descripcion: 'Modelo de costos, listas aprobadas y reglas de propiedad de la información.',
    restringida: true,
  },
  {
    nombre: '03_ventas_contratacion',
    contenido: '4 artefactos',
    descripcion: 'Cotización, inscripción, términos y revisión de contrato.',
  },
  {
    nombre: '04_inscripcion_restringida',
    contenido: '5 archivos',
    descripcion: 'Rastreador de cupos, simulación, confirmaciones y políticas de acceso.',
    restringida: true,
  },
  {
    nombre: '05_cambios_finanzas',
    contenido: '1 artefacto',
    descripcion: 'Cambios, cancelaciones, créditos y reembolsos.',
  },
  {
    nombre: '06_entrega_retencion',
    contenido: '3 artefactos',
    descripcion: 'Entrega de informes, retroalimentación y renovación.',
  },
]

function FolderGlyph({ restringida = false }: { restringida?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
        restringida ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-700'
      }`}
    >
      {restringida ? '🔒' : '📁'}
    </span>
  )
}

export function DirectorioServicio() {
  return (
    <section className="card overflow-hidden" aria-labelledby="directorio-servicio-title">
      <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">Arquitectura documental</p>
            <h2 id="directorio-servicio-title" className="mt-1 text-lg font-semibold text-[var(--foreground)]">
              Directorio del servicio comercial
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Organiza los entregables por etapa del ciclo comercial. La ejecución técnica de cada ronda permanece en el Sistema de Gestión y se referencia sin duplicarla.
            </p>
          </div>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
            7 etapas · 2 restringidas
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(250px,0.75fr)_minmax(0,2fr)]">
        <div className="border-b border-[var(--border)] bg-slate-950 p-5 font-mono text-sm text-slate-200 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between border-b border-slate-700 pb-3">
            <strong className="text-white">servicio_comercial/</strong>
            <span className="text-[10px] font-semibold tracking-[0.12em] text-sky-300">ESTRUCTURA</span>
          </div>
          <div aria-label="Estructura del directorio del servicio comercial" className="space-y-2">
            <div className="font-semibold text-white">📁 servicio_comercial/</div>
            <div className="space-y-2 border-l border-slate-700 pl-4">
              {carpetas.map((carpeta) => (
                <div key={carpeta.nombre} className={carpeta.restringida ? 'text-amber-300' : undefined}>
                  {carpeta.restringida ? '🔒' : '📁'} {carpeta.nombre}/
                </div>
              ))}
              <div>📁 fichas/</div>
              <div>📄 README.md</div>
              <div>📄 presentación_del_sistema</div>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-[var(--border)] sm:grid-cols-2">
          {carpetas.map((carpeta) => (
            <article key={carpeta.nombre} className="flex gap-3 bg-[var(--surface-panel)] p-4 sm:p-5">
              <FolderGlyph restringida={carpeta.restringida} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="break-all font-mono text-sm font-semibold text-[var(--foreground)]">{carpeta.nombre}/</h3>
                  <span className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--foreground-muted)]">
                    {carpeta.contenido}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--foreground-muted)]">{carpeta.descripcion}</p>
                {carpeta.restringida && (
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-amber-800">Acceso controlado</p>
                )}
              </div>
            </article>
          ))}

          <article className="flex gap-3 bg-sky-50/60 p-4 sm:p-5">
            <FolderGlyph />
            <div>
              <h3 className="font-mono text-sm font-semibold text-[var(--foreground)]">fichas/</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--foreground-muted)]">15 vistas de consulta más su índice, sin exponer los documentos operativos.</p>
            </div>
          </article>

          <article className="bg-emerald-50/60 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-800">Fuente técnica vinculada</p>
            <p className="mt-1 text-xs leading-5 text-[var(--foreground-muted)]">
              Los expedientes, formatos y evidencias de ejecución se administran en el SGC.
            </p>
            <Link className="mt-3 inline-flex text-xs font-semibold text-emerald-800 hover:underline" href="/dashboard/sgc/documentos">
              Abrir Centro documental →
            </Link>
          </article>
        </div>
      </div>
    </section>
  )
}
