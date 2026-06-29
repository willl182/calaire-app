import Link from 'next/link'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type Variant = 'documentos' | 'versiones' | 'expedientes' | 'cumplimiento' | 'mapa'

const variants: { key: Variant; label: string }[] = [
  { key: 'documentos', label: 'Centro documental' },
  { key: 'versiones', label: 'Versiones y registros' },
  { key: 'expedientes', label: 'Expedientes de ronda' },
  { key: 'cumplimiento', label: 'Matriz normativa' },
  { key: 'mapa', label: 'Mapa SGC' },
]

const documents = [
  {
    code: 'DG-PSEA-02',
    title: 'Aplicativo calaire-app',
    scope: 'PEA / ISO 17043',
    family: 'DG',
    status: 'vigente',
    mode: 'no_diligenciable',
    coverage: 'cubierto',
    source: 'Drive editable',
    official: 'PDF oficial v3',
  },
  {
    code: 'P-SGC-04',
    title: 'Control documental y registros',
    scope: 'Transversal SGC',
    family: 'P',
    status: 'en_revision',
    mode: 'solo_archivo',
    coverage: 'parcial',
    source: 'SharePoint editable',
    official: 'DOCX oficial v2',
  },
  {
    code: 'F-PSEA-13',
    title: 'Revision de datos de ronda',
    scope: 'PEA / ISO 17043',
    family: 'F',
    status: 'vigente',
    mode: 'ui_nativo_exportable',
    coverage: 'cubierto',
    source: 'Plantilla Drive',
    official: 'XLSX/PDF oficial v4',
  },
  {
    code: 'F-17025-02',
    title: 'Control de equipo de referencia',
    scope: 'Laboratorio / ISO 17025',
    family: 'F',
    status: 'borrador',
    mode: 'ui_nativo',
    coverage: 'pendiente',
    source: 'Sin fuente',
    official: 'Sin version oficial',
  },
]

const versions = [
  { version: 'v4', status: 'vigente', file: 'F-PSEA-13_revision_datos_v4.pdf', date: '2026-06-20', by: 'Coordinador PEA' },
  { version: 'v3', status: 'obsoleto', file: 'F-PSEA-13_revision_datos_v3.xlsx', date: '2026-05-11', by: 'Admin SGC' },
  { version: 'v2', status: 'obsoleto', file: 'F-PSEA-13_revision_datos_v2.xlsx', date: '2026-03-04', by: 'Admin SGC' },
]

const requirements = [
  { norm: 'ISO/IEC 17043:2023', clause: '7.4', title: 'Diseno del programa de EA', state: 'cubierto', docs: 'DG-PSEA-01, F-PSEA-03' },
  { norm: 'ISO/IEC 17043:2023', clause: '7.8', title: 'Informes de EA', state: 'parcial', docs: 'F-PSEA-13, F-PSEA-14' },
  { norm: 'ISO/IEC 17025:2017', clause: '6.4', title: 'Equipamiento', state: 'pendiente', docs: 'F-17025-02' },
  { norm: 'ISO 13528:2022', clause: 'Annex C', title: 'Estadistica robusta', state: 'cubierto', docs: 'P-PSEA-18, F-PSEA-10' },
]

const roundReadiness = [
  {
    code: 'EA-PP-2026-R1',
    name: 'Ronda piloto gases contaminantes',
    status: 'documentacion_pendiente',
    progress: 86,
    missing: ['F-PSEA-08 evidencia vigente', 'F-PSEA-14 informe final'],
    checks: [
      ['Planificacion', 'completo', '8/8'],
      ['Comunicaciones', 'completo', '3/3'],
      ['Preparacion item', 'observado', '4/5'],
      ['Datos y preproceso', 'completo', '6/6'],
      ['H/E', 'observado', '3/4'],
      ['Analisis informe', 'pendiente', '2/4'],
      ['Cierre SGC', 'pendiente', '1/3'],
    ],
  },
  {
    code: 'EA-PP-2026-R2',
    name: 'Ronda programada segundo ciclo',
    status: 'activa',
    progress: 58,
    missing: ['F-PSEA-05A fichas pendientes', 'F-PSEA-12 envios finales'],
    checks: [
      ['Planificacion', 'completo', '7/8'],
      ['Comunicaciones', 'observado', '2/3'],
      ['Preparacion item', 'pendiente', '1/5'],
      ['Datos y preproceso', 'pendiente', '0/6'],
      ['H/E', 'pendiente', '0/4'],
      ['Analisis informe', 'pendiente', '0/4'],
      ['Cierre SGC', 'pendiente', '0/3'],
    ],
  },
  {
    code: 'EA-TEST-2026-R1',
    name: 'Ronda de prueba',
    status: 'cerrada',
    progress: 100,
    missing: [],
    checks: [
      ['Planificacion', 'completo', '8/8'],
      ['Comunicaciones', 'completo', '3/3'],
      ['Preparacion item', 'completo', '5/5'],
      ['Datos y preproceso', 'completo', '6/6'],
      ['H/E', 'completo', '4/4'],
      ['Analisis informe', 'completo', '4/4'],
      ['Cierre SGC', 'completo', '3/3'],
    ],
  },
]

const mapSummary = [
  { value: '01', label: 'bloque general', detail: 'fuente documental maestra' },
  { value: '02', label: 'despliegue rondas', detail: 'registros y evidencias' },
  { value: '7', label: 'etapas de ronda', detail: 'checklist operativo' },
  { value: '34', label: 'nodos base', detail: 'DG, P, I y F' },
]

const mapColumns = [
  {
    title: 'Gobierno maestro',
    description: 'Define arquitectura, control documental, registros y flujo de datos.',
    items: [
      { code: 'P-PSEA-02', name: 'Matriz documental del PEA', status: 'Elaborado' },
      { code: 'P-PSEA-03', name: 'Control de registros y evidencias', status: 'Elaborado' },
      { code: 'P-PSEA-08', name: 'Flujo tecnico de datos digitales', status: 'Elaborado' },
      { code: 'DG-PSEA-01', name: 'Protocolo participacion EA', status: 'Elaborado' },
    ],
  },
  {
    title: 'Aplicativos e instructivos',
    description: 'Conecta operacion digital, captura, analisis y uso de interfaces.',
    items: [
      { code: 'DG-PSEA-02', name: 'Aplicativo calaire-app', status: 'Elaborado' },
      { code: 'DG-PSEA-03', name: 'Aplicativo pt_app', status: 'Elaborado' },
      { code: 'I-PSEA-02', name: 'Uso de calaire-app', status: 'Implementado' },
      { code: 'I-PSEA-04', name: 'Uso de pt_app', status: 'Implementado' },
    ],
  },
  {
    title: 'Formatos y registros',
    description: 'Plantillas maestras que producen copias diligenciadas por ronda.',
    items: [
      { code: 'F-PSEA-03', name: 'Plan de ronda', status: 'Implementado' },
      { code: 'F-PSEA-08', name: 'Preparacion item gaseoso', status: 'Implementado' },
      { code: 'F-PSEA-12', name: 'Dataset oficial consolidado', status: 'Implementado' },
      { code: 'F-PSEA-13', name: 'Informe final de resultados', status: 'Implementado' },
    ],
  },
]

const criticalRoutes = [
  {
    label: 'Flujo oficial de datos',
    hint: 'P-PSEA-08 > calaire-app > pt_app > informe',
    nodes: ['P-PSEA-08', 'DG-PSEA-02', 'I-PSEA-02', 'F-PSEA-08', 'F-PSEA-09', 'DG-PSEA-03', 'F-PSEA-10', 'F-PSEA-12', 'F-PSEA-13'],
  },
  {
    label: 'Planificacion de ronda',
    hint: 'P-PSEA-04 > ficha, calendario, plan',
    nodes: ['P-PSEA-04', 'P-PSEA-05', 'DG-PSEA-02', 'F-PSEA-01', 'F-PSEA-02', 'F-PSEA-03', 'F-PSEA-05', 'F-PSEA-18'],
  },
  {
    label: 'Estructura de ronda',
    hint: 'P-PSEA-03 > siete etapas > expediente',
    nodes: ['P-PSEA-03', 'F-PSEA-03', 'F-PSEA-07', 'F-PSEA-08', 'F-PSEA-09', 'F-PSEA-10', 'F-PSEA-12', 'F-PSEA-13', 'F-PSEA-14'],
  },
  {
    label: 'Cierre y gestion SGC',
    hint: 'cierre documental, quejas, apelaciones y CAPA',
    nodes: ['P-PSEA-14', 'P-PSEA-15', 'P-PSEA-20', 'P-PSEA-21', 'F-PSEA-14', 'F-PSEA-15', 'F-PSEA-16', 'F-PSEA-17'],
  },
]

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseVariant(value: string | string[] | undefined): Variant {
  const selected = firstParam(value)
  return variants.some((variant) => variant.key === selected) ? selected as Variant : 'documentos'
}

function stateClass(state: string) {
  if (state === 'vigente' || state === 'cubierto' || state === 'completo') return 'bg-emerald-100 text-emerald-800'
  if (state === 'en_revision' || state === 'parcial' || state === 'en_progreso') return 'bg-amber-100 text-amber-800'
  if (state === 'activa') return 'bg-sky-100 text-sky-800'
  if (state === 'cerrada') return 'bg-slate-200 text-slate-700'
  if (state === 'obsoleto' || state === 'no_aplica') return 'bg-slate-200 text-slate-700'
  return 'bg-rose-100 text-rose-800'
}

function Badge({ children, tone }: { children: string; tone?: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone ?? stateClass(children)}`}>
      {children}
    </span>
  )
}

function PrototypeHeader({ variant }: { variant: Variant }) {
  return (
    <header className="header-bar px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
            Prototipo throwaway
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            SGC Maestro CALAIRE
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Exploracion de una experiencia general para control documental, versiones oficiales, fuente editable externa,
            relaciones normativas y registros derivados por ronda o equipo.
          </p>
        </div>
        <div className="grid gap-2 rounded-lg border border-[var(--border)] bg-white/55 p-4 text-sm">
          <div className="font-semibold text-[var(--foreground)]">Estado visible del prototipo</div>
          <div className="text-[var(--foreground-muted)]">Variante: {variants.find((item) => item.key === variant)?.label}</div>
          <div className="text-[var(--foreground-muted)]">Persistencia: ninguna</div>
          <div className="text-[var(--foreground-muted)]">Convex: no conectado</div>
        </div>
      </div>
    </header>
  )
}

function DocumentsVariant() {
  return (
    <div className="grid gap-5">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-accent px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Documentos</div>
          <div className="numeric mt-2 text-3xl font-semibold">{documents.length}</div>
          <div className="mt-2 text-xs text-[var(--foreground-muted)]">Catalogo simulado</div>
        </div>
        <div className="card-accent border-l-emerald-500 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Vigentes</div>
          <div className="numeric mt-2 text-3xl font-semibold">2</div>
          <div className="mt-2 text-xs text-[var(--foreground-muted)]">Con version oficial</div>
        </div>
        <div className="card-accent border-l-amber-500 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">En revision</div>
          <div className="numeric mt-2 text-3xl font-semibold">1</div>
          <div className="mt-2 text-xs text-[var(--foreground-muted)]">No restrictivo</div>
        </div>
        <div className="card-accent border-l-sky-500 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Ambitos</div>
          <div className="numeric mt-2 text-3xl font-semibold">4</div>
          <div className="mt-2 text-xs text-[var(--foreground-muted)]">Transversal, PEA, 17025, equipos</div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-lg font-semibold">Matriz documental maestra</h2>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Vista centrada en documento controlado. El archivo oficial vive en la app; el editable externo es solo referencia.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th>Codigo</th>
                <th>Documento</th>
                <th>Ambito</th>
                <th>Estado</th>
                <th>Modo</th>
                <th>Fuente editable</th>
                <th>Oficial</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.code} className="border-b border-[var(--border-soft)] bg-[var(--surface)]">
                  <td className="px-6 py-4 font-semibold">{doc.code}</td>
                  <td className="px-6 py-4">{doc.title}</td>
                  <td className="px-6 py-4 text-[var(--foreground-muted)]">{doc.scope}</td>
                  <td className="px-6 py-4"><Badge>{doc.status}</Badge></td>
                  <td className="px-6 py-4"><Badge tone="bg-slate-100 text-slate-700">{doc.mode}</Badge></td>
                  <td className="px-6 py-4 text-[var(--foreground-muted)]">{doc.source}</td>
                  <td className="px-6 py-4 text-[var(--foreground-muted)]">{doc.official}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function VersionsVariant() {
  return (
    <div className="grid gap-5">
      <section className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="card p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Documento seleccionado</div>
          <h2 className="mt-2 text-xl font-semibold">Ficha maestra y fuente editable</h2>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Aqui se administra un documento del centro documental: metadatos, enlace editable opcional y relaciones.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-[var(--foreground)]">Codigo</span>
              <input className="rounded-lg border border-[var(--border)] bg-white px-3 py-2" defaultValue="P-SGC-04" readOnly />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-[var(--foreground)]">Ambito</span>
              <select className="rounded-lg border border-[var(--border)] bg-white px-3 py-2" defaultValue="transversal">
                <option value="transversal">Transversal SGC</option>
                <option value="pea">PEA / ISO 17043</option>
                <option value="17025">Laboratorio / ISO 17025</option>
                <option value="equipos">Equipos de referencia</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-semibold text-[var(--foreground)]">Fuente editable opcional</span>
              <input className="rounded-lg border border-[var(--border)] bg-white px-3 py-2" defaultValue="https://drive.google.com/..." readOnly />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-primary" type="button">Guardar cambios</button>
            <button className="btn-outline" type="button">Relacionar requisito</button>
          </div>
        </div>

        <div className="card p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Version oficial</div>
          <h2 className="mt-2 text-xl font-semibold">Cargar archivo oficial</h2>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Este es el punto donde Drive deja de ser fuente de trabajo y la app conserva una version oficial en Convex Storage.
          </p>
          <div className="mt-5 grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-[var(--foreground)]">Archivo principal</span>
              <input className="rounded-lg border border-[var(--border)] bg-white px-3 py-2" type="file" disabled />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-[var(--foreground)]">Resumen de cambios</span>
              <textarea className="min-h-24 rounded-lg border border-[var(--border)] bg-white px-3 py-2" defaultValue="Ajuste de alcance para SGC general CALAIRE." readOnly />
            </label>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Prototipo: este control no sube archivos. En produccion invocaria `generateUploadUrl` y registraria la version oficial.
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-primary" type="button">Registrar version</button>
            <button className="btn-outline" type="button">Agregar anexo</button>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <section className="card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Documento maestro</div>
            <h2 className="mt-2 text-xl font-semibold">F-PSEA-13 Revision de datos de ronda</h2>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              Documento controlado con version oficial congelada en la app, fuente editable externa y registros derivados por ronda.
            </p>
          </div>
          <Badge>vigente</Badge>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--border)] bg-white/50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Archivo oficial</div>
            <div className="mt-2 font-semibold">F-PSEA-13 v4.pdf</div>
            <div className="mt-1 text-sm text-[var(--foreground-muted)]">Convex Storage</div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-white/50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Fuente editable</div>
            <div className="mt-2 font-semibold">Drive opcional</div>
            <div className="mt-1 text-sm text-[var(--foreground-muted)]">Sin sync automatico</div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-white/50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Modo</div>
            <div className="mt-2 font-semibold">UI + exportable</div>
            <div className="mt-1 text-sm text-[var(--foreground-muted)]">Registro por ronda</div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-base font-semibold">Historial oficial</h3>
          <div className="mt-3 grid gap-3">
            {versions.map((item) => (
              <div key={item.version} className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-white/50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.version}</span>
                    <Badge>{item.status}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-[var(--foreground-muted)]">{item.file}</div>
                </div>
                <div className="text-sm text-[var(--foreground-muted)]">{item.date} · {item.by}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className="card p-6">
        <h2 className="text-lg font-semibold">Registro derivado</h2>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Ejemplo de instancia operativa separada del documento maestro.
        </p>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-[var(--border-soft)] pb-2">
            <span className="text-[var(--foreground-muted)]">Entidad</span>
            <span className="font-semibold">EA-PP-2026-R1</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-[var(--border-soft)] pb-2">
            <span className="text-[var(--foreground-muted)]">Basado en</span>
            <span className="font-semibold">F-PSEA-13 v4</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-[var(--border-soft)] pb-2">
            <span className="text-[var(--foreground-muted)]">Estado</span>
            <Badge>en_progreso</Badge>
          </div>
          <div className="flex justify-between gap-4 border-b border-[var(--border-soft)] pb-2">
            <span className="text-[var(--foreground-muted)]">Visibilidad</span>
            <span className="font-semibold">interna</span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn-primary" type="button">Exportar PDF</button>
          <button className="btn-outline" type="button">Ver auditoria</button>
        </div>
      </aside>
      </div>
    </div>
  )
}

function RoundExpedientsVariant() {
  return (
    <section className="card p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Rondas creadas</div>
          <h2 className="mt-2 text-xl font-semibold">Check rapido de expedientes por ronda</h2>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Esta vista responde si cada ronda tiene lo minimo documental antes de cierre o auditoria.
          </p>
        </div>
        <button className="btn-outline" type="button">Ver todas las rondas</button>
      </div>

      <div className="mt-5 grid gap-4">
        {roundReadiness.map((round) => (
          <div key={round.code} className="rounded-lg border border-[var(--border)] bg-white/50 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{round.code}</h3>
                  <Badge>{round.status}</Badge>
                  <span className="numeric text-sm font-semibold">{round.progress}%</span>
                </div>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">{round.name}</p>
                <div className="mt-3 h-2 max-w-xl rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${round.progress}%` }} />
                </div>
              </div>

              <div className="grid min-w-[320px] gap-2">
                <div className="flex flex-wrap gap-2">
                  {round.checks.map(([label, state]) => (
                    <span key={label} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateClass(state)}`}>
                      {label}: {state}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-[var(--foreground-muted)]">
                  {round.missing.length === 0 ? (
                    <span className="font-semibold text-emerald-700">Sin faltantes criticos</span>
                  ) : (
                    <span>Faltantes: {round.missing.join(', ')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ComplianceVariant() {
  return (
    <div className="grid gap-5">
      <section className="card p-6">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Matriz normativa</div>
          <h2 className="mt-2 text-xl font-semibold">Norma, clausula y documentos que la cubren</h2>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Esta vista no es para gestionar rondas ni cargar archivos. Sirve para auditoria: muestra que requisito ISO o interno
            esta cubierto por que documento maestro o evidencia del SGC.
          </p>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-lg font-semibold">Matriz normativa sencilla</h2>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Relaciones explicitas entre requisito, documentos controlados y estado de cobertura.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th>Norma</th>
                <th>Clausula</th>
                <th>Requisito</th>
                <th>Cobertura</th>
                <th>Documentos</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((req) => (
                <tr key={`${req.norm}-${req.clause}`} className="border-b border-[var(--border-soft)]">
                  <td className="px-6 py-4 font-semibold">{req.norm}</td>
                  <td className="px-6 py-4">{req.clause}</td>
                  <td className="px-6 py-4 text-[var(--foreground-muted)]">{req.title}</td>
                  <td className="px-6 py-4"><Badge>{req.state}</Badge></td>
                  <td className="px-6 py-4 text-[var(--foreground-muted)]">{req.docs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function MapVariant() {
  return (
    <div className="grid gap-5">
      <section className="card p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Mapa de navegacion SGC PEA</div>
            <h2 className="mt-2 text-xl font-semibold">Arquitectura documental maestra y registros por ronda</h2>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              Vista adaptada desde <span className="font-semibold">mapa_navegacion_sgc_pea.html</span>. La idea para app v2 es convertir
              este mapa en una capa viva sobre documentos controlados, requisitos, checklists e instancias operativas.
            </p>
          </div>
          <a className="btn-outline text-sm" href="/sgc/mapa_navegacion_sgc_pea.html" target="_blank" rel="noopener noreferrer">
            Abrir HTML original
          </a>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-lg font-semibold">Mapa interactivo original embebido</h2>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Este bloque muestra el mapa completo de `mapa_navegacion_sgc_pea.html` dentro del prototipo.
          </p>
        </div>
        <iframe
          className="h-[820px] w-full bg-white"
          src="/sgc/mapa_navegacion_sgc_pea.html"
          title="Mapa interactivo de navegacion del SGC"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mapSummary.map((item) => (
          <div key={item.label} className="card-accent px-5 py-4">
            <div className="numeric text-3xl font-semibold">{item.value}</div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{item.label}</div>
            <div className="mt-2 text-xs text-[var(--foreground-muted)]">{item.detail}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {mapColumns.map((column) => (
          <div key={column.title} className="card p-5">
            <h3 className="text-base font-semibold">{column.title}</h3>
            <p className="mt-1 min-h-10 text-sm text-[var(--foreground-muted)]">{column.description}</p>
            <div className="mt-4 grid gap-3">
              {column.items.map((item) => (
                <div key={item.code} className="rounded-lg border border-[var(--border)] bg-white/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{item.code}</div>
                      <div className="mt-1 text-sm text-[var(--foreground-muted)]">{item.name}</div>
                    </div>
                    <Badge tone="bg-slate-100 text-slate-700">{item.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="card p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Rutas criticas del mapa</h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Estas rutas deberian convertirse en vistas filtradas del SGC Maestro, no solo en ayudas visuales.
            </p>
          </div>
          <Badge tone="bg-amber-100 text-amber-800">prototipo de navegacion</Badge>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {criticalRoutes.map((route) => (
            <div key={route.label} className="rounded-lg border border-[var(--border)] bg-white/50 p-4">
              <div className="font-semibold">{route.label}</div>
              <div className="mt-1 text-sm text-[var(--foreground-muted)]">{route.hint}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {route.nodes.map((node) => (
                  <span key={node} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {node}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Lectura para app v2</h2>
          <div className="mt-4 grid gap-3 text-sm text-[var(--foreground-muted)]">
            <p>
              <span className="font-semibold text-[var(--foreground)]">01_bloque_general</span> debe modelarse como documentos
              maestros controlados, con version oficial, fuente editable opcional y relaciones normativas.
            </p>
            <p>
              <span className="font-semibold text-[var(--foreground)]">02_despliegue_rondas</span> debe modelarse como registros
              diligenciados y evidencias operativas derivadas de esos documentos maestros.
            </p>
            <p>
              El mapa original es una buena base para una navegacion por rutas: datos, planificacion, estructura de ronda,
              homogeneidad/estabilidad y cierre SGC.
            </p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold">Pendiente para convertirlo en funcionalidad real</h2>
          <div className="mt-4 grid gap-3">
            {[
              'Importar nodos y relaciones como catalogo versionado.',
              'Relacionar cada nodo con documento maestro o registro operativo.',
              'Permitir filtros por ambito: transversal, PEA 17043, 17025 y equipos.',
              'Mostrar cobertura de requisitos y checklist asociado a cada ruta.',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-[var(--border)] bg-white/50 p-3 text-sm">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--pt-primary)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default async function SgcMasterPrototypePage({ searchParams }: PageProps) {
  const query = searchParams ? await searchParams : {}
  const variant = parseVariant(query.v)

  return (
    <div className="grid gap-6 pb-24">
      <PrototypeHeader variant={variant} />

      <section className="grid gap-3 rounded-lg border border-[var(--border)] bg-white/60 p-4 text-sm md:grid-cols-4">
        <div>
          <div className="font-semibold text-[var(--foreground)]">Una sola fuente</div>
          <div className="mt-1 text-[var(--foreground-muted)]">Documentos, versiones, requisitos, registros y rondas comparten datos base.</div>
        </div>
        <div>
          <div className="font-semibold text-[var(--foreground)]">Centro documental</div>
          <div className="mt-1 text-[var(--foreground-muted)]">Inventario maestro, no carga operativa.</div>
        </div>
        <div>
          <div className="font-semibold text-[var(--foreground)]">Versiones y registros</div>
          <div className="mt-1 text-[var(--foreground-muted)]">Carga oficial, enlace editable e historial.</div>
        </div>
        <div>
          <div className="font-semibold text-[var(--foreground)]">Expedientes</div>
          <div className="mt-1 text-[var(--foreground-muted)]">Check rapido de rondas y faltantes.</div>
        </div>
      </section>

      <nav className="tab-nav overflow-x-auto" aria-label="Variantes de prototipo">
        {variants.map((item) => (
          <Link
            key={item.key}
            href={`/dashboard/sgc/prototype?v=${item.key}`}
            className={item.key === variant ? 'tab-active' : ''}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {variant === 'documentos' && <DocumentsVariant />}
      {variant === 'versiones' && <VersionsVariant />}
      {variant === 'expedientes' && <RoundExpedientsVariant />}
      {variant === 'cumplimiento' && <ComplianceVariant />}
      {variant === 'mapa' && <MapVariant />}

      <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg">
        {variants.map((item) => (
          <Link
            key={item.key}
            href={`/dashboard/sgc/prototype?v=${item.key}`}
            className={item.key === variant ? 'btn-primary text-xs' : 'btn-outline text-xs'}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
