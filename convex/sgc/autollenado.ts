import { v } from 'convex/values'

import type { Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { isParticipanteReclamado, requireSgcViewer, type SgcQueryConfig } from './shared'

/**
 * B2: documentos autollenados desde la app.
 * - F-PSEA-01/02: ayuda de exportacion desde los hitos. NO se marcan cumplidos (decision 4: los
 *   diligencia el coordinador).
 */

const rondaArgs = { rondaId: v.id('rondas') }

type Ctx = QueryCtx | MutationCtx

export type HitoExportRow = {
  codigo: string
  nombre: string
  fase: string
  fechaObjetivo: string
  fechaReal: string
  estado: string
  responsable: string
  formatoRelacionado: string
  notas: string
}

export type HitosExport = {
  rondaCodigo: string
  rondaNombre: string
  /** F-PSEA-01: calendario global (un renglon por hito con fecha). */
  calendario: HitoExportRow[]
  /** F-PSEA-02: cronograma detallado (todos los hitos vigentes, agrupados por fase). */
  cronograma: HitoExportRow[]
}

type HitoInput = {
  codigo: string
  nombre: string
  fase: string
  fechaObjetivo?: string | null
  fechaReal?: string | null
  estado: string
  responsable: string
  formatoRelacionado?: string | null
  notas?: string | null
}

const porFecha = (a: HitoExportRow, b: HitoExportRow) =>
  (a.fechaObjetivo || '9999').localeCompare(b.fechaObjetivo || '9999') || a.codigo.localeCompare(b.codigo)

export function construirHitosExport(ronda: { codigo: string; nombre: string }, hitos: HitoInput[]): HitosExport {
  const vigentes = hitos
    .filter((hito) => hito.estado !== 'cancelado' && hito.estado !== 'no_aplica')
    .map<HitoExportRow>((hito) => ({
      codigo: hito.codigo,
      nombre: hito.nombre,
      fase: hito.fase,
      fechaObjetivo: hito.fechaObjetivo?.trim() ?? '',
      fechaReal: hito.fechaReal?.trim() ?? '',
      estado: hito.estado,
      responsable: hito.responsable,
      formatoRelacionado: hito.formatoRelacionado ?? '',
      notas: hito.notas ?? '',
    }))
  return {
    rondaCodigo: ronda.codigo,
    rondaNombre: ronda.nombre,
    calendario: vigentes.filter((hito) => hito.fechaObjetivo !== '').sort(porFecha),
    cronograma: [...vigentes].sort((a, b) => a.fase.localeCompare(b.fase) || porFecha(a, b)),
  }
}

async function collectHitosExport(ctx: Ctx, rondaId: Id<'rondas'>) {
  const ronda = await ctx.db.get(rondaId)
  if (!ronda) return null
  const hitos = await ctx.db.query('sgcHitosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
  return construirHitosExport(ronda, hitos)
}

/** B2.1: datos de F-PSEA-01/02 desde los hitos (ayuda de exportacion, no marca cumplido). */
export const getHitosExportConfig = {
  args: rondaArgs,
  handler: async (ctx, { rondaId }) => {
    await requireSgcViewer(ctx)
    return collectHitosExport(ctx, rondaId)
  },
} satisfies SgcQueryConfig<typeof rondaArgs>

// ---------------------------------------------------------------------------
// F-PSEA-03 / F-PSEA-04: fichas y equipos
// ---------------------------------------------------------------------------

export type EquipoExportRow = {
  participantCode: string
  laboratorio: string
  tipo: 'analizador' | 'instrumento'
  /** Analito (analizador) o nombre del equipo (instrumento). */
  descripcion: string
  fabricanteModelo: string
  numeroSerie: string
  metodoEpa: string
  fechaUltimaCalibracion: string
  incertidumbreDeclarada: string
  unidadSalida: string
  cantidad: number
}

export type EquiposExport = {
  rondaCodigo: string
  rondaNombre: string
  fichasEnviadas: number
  equipos: EquipoExportRow[]
}

type FichaConEquipos = {
  participantCode: string
  workosUserId: string
  ficha: { estado: 'borrador' | 'enviado'; nombreLaboratorio?: string | null } | null
  analizadores: Array<{ sortOrder: number; analito: string; fabricante: string; modelo: string; numeroSerie: string; metodoEpa: string; fechaUltimaCalibracion?: string; incertidumbreDeclarada: string; unidadSalida: string }>
  instrumentos: Array<{ sortOrder: number; equipo: string; marcaModelo: string; numeroSerie: string; cantidad: number }>
}

/** F-PSEA-04: equipos declarados en las fichas ENVIADAS (los borradores no se exportan). */
export function construirEquiposExport(ronda: { codigo: string; nombre: string }, fichas: FichaConEquipos[]): EquiposExport {
  const enviadas = fichas
    .filter((item) => item.ficha?.estado === 'enviado')
    .sort((a, b) => a.participantCode.localeCompare(b.participantCode))
  const equipos: EquipoExportRow[] = []
  for (const item of enviadas) {
    const base = { participantCode: item.participantCode, laboratorio: item.ficha?.nombreLaboratorio ?? '' }
    for (const a of [...item.analizadores].sort((x, y) => x.sortOrder - y.sortOrder)) {
      equipos.push({
        ...base,
        tipo: 'analizador',
        descripcion: a.analito,
        fabricanteModelo: [a.fabricante, a.modelo].filter(Boolean).join(' '),
        numeroSerie: a.numeroSerie,
        metodoEpa: a.metodoEpa,
        fechaUltimaCalibracion: a.fechaUltimaCalibracion ?? '',
        incertidumbreDeclarada: a.incertidumbreDeclarada,
        unidadSalida: a.unidadSalida,
        cantidad: 1,
      })
    }
    for (const i of [...item.instrumentos].sort((x, y) => x.sortOrder - y.sortOrder)) {
      equipos.push({
        ...base,
        tipo: 'instrumento',
        descripcion: i.equipo,
        fabricanteModelo: i.marcaModelo,
        numeroSerie: i.numeroSerie,
        metodoEpa: '',
        fechaUltimaCalibracion: '',
        incertidumbreDeclarada: '',
        unidadSalida: '',
        cantidad: i.cantidad,
      })
    }
  }
  return { rondaCodigo: ronda.codigo, rondaNombre: ronda.nombre, fichasEnviadas: enviadas.length, equipos }
}

async function collectFichas(ctx: Ctx, rondaId: Id<'rondas'>): Promise<FichaConEquipos[]> {
  const participantes = await ctx.db.query('rondaParticipantes').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect()
  return Promise.all(
    participantes.map(async (p) => {
      const fichas = await ctx.db
        .query('fichasRegistro')
        .withIndex('by_ronda_participante', (q) => q.eq('rondaParticipanteId', p._id))
        .collect()
      const ficha = fichas.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
      const [analizadores, instrumentos] = ficha
        ? await Promise.all([
            ctx.db.query('fichasAnalizadores').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
            ctx.db.query('fichasInstrumentos').withIndex('by_ficha', (q) => q.eq('fichaId', ficha._id)).collect(),
          ])
        : [[], []]
      return { participantCode: p.participantCode ?? '', workosUserId: p.workosUserId, ficha, analizadores, instrumentos }
    })
  )
}

/** B2.3: exportacion de equipos (F-PSEA-04) desde las fichas F-PSEA-03. */
export const getEquiposExportConfig = {
  args: rondaArgs,
  handler: async (ctx, { rondaId }) => {
    await requireSgcViewer(ctx)
    const ronda = await ctx.db.get(rondaId)
    if (!ronda) return null
    return construirEquiposExport(ronda, await collectFichas(ctx, rondaId))
  },
} satisfies SgcQueryConfig<typeof rondaArgs>

// ---------------------------------------------------------------------------
// Estado automatico (B2.2 / B2.4)
// ---------------------------------------------------------------------------

/** Codigos con estado automatico calculado por B2. F-PSEA-01/02 quedan fuera (manuales). */
export const CODIGOS_AUTOMATICOS = ['F-PSEA-03', 'F-PSEA-04', 'F-PSEA-05'] as const

export type DatosAutollenado = {
  participantes: number
  participantesReclamados: number
  /** Fichas enviadas de cupos reclamados. */
  fichasEnviadasReclamados: number
  equiposExportados: number
  contaminantes: number
  hitoInicioConFecha: boolean
}

export type EstadoAutomatico = {
  codigo: string
  /** Hay calculo automatico para este codigo. */
  soportado: boolean
  /**
   * true = cumplido automatico (F-03, F-04). Para F-PSEA-05 indica solo "datos listos": el
   * cumplido exige ademas la marca "revisado" del coordinador (`aprobarDocumentoExpediente`).
   */
  cumplido: boolean
  requiereRevision: boolean
  motivo: string
}

export function calcularEstadoAutomatico(codigo: string, datos: DatosAutollenado): EstadoAutomatico {
  const c = codigo.trim().toUpperCase()
  const base = { codigo: c, soportado: true, requiereRevision: false }
  const fichasCompletas = datos.participantesReclamados > 0 && datos.fichasEnviadasReclamados >= datos.participantesReclamados
  switch (c) {
    case 'F-PSEA-03':
      return {
        ...base,
        cumplido: fichasCompletas,
        motivo: fichasCompletas
          ? 'Fichas enviadas por todos los cupos reclamados.'
          : datos.participantesReclamados === 0
            ? 'Ningun cupo reclamado todavia.'
            : `Fichas enviadas ${datos.fichasEnviadasReclamados}/${datos.participantesReclamados} cupos reclamados.`,
      }
    case 'F-PSEA-04': {
      const cumplido = fichasCompletas && datos.equiposExportados > 0
      return {
        ...base,
        cumplido,
        motivo: cumplido
          ? `Exportacion lista: ${datos.equiposExportados} equipo(s) desde F-PSEA-03.`
          : !fichasCompletas
            ? 'Se genera al completar F-PSEA-03.'
            : 'Las fichas enviadas no declaran equipos.',
      }
    }
    case 'F-PSEA-05': {
      const faltan = [
        datos.contaminantes > 0 ? null : 'contaminantes',
        datos.participantes > 0 ? null : 'participantes',
        datos.hitoInicioConFecha ? null : 'fecha de INICIO_RONDA',
      ].filter(Boolean)
      return {
        ...base,
        requiereRevision: true,
        cumplido: faltan.length === 0,
        motivo: faltan.length === 0 ? 'Datos listos: falta la marca "revisado" del coordinador.' : `Faltan datos: ${faltan.join(', ')}.`,
      }
    }
    default:
      return {
        codigo: c,
        soportado: false,
        cumplido: false,
        requiereRevision: false,
        motivo: c === 'F-PSEA-01' || c === 'F-PSEA-02'
          ? 'Lo diligencia el coordinador; hay exportacion de ayuda desde los hitos.'
          : 'Sin calculo automatico.',
      }
  }
}

export async function collectDatosAutollenado(ctx: Ctx, rondaId: Id<'rondas'>): Promise<DatosAutollenado> {
  const [fichas, contaminantes, hitos] = await Promise.all([
    collectFichas(ctx, rondaId),
    ctx.db.query('rondaContaminantes').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
    ctx.db.query('sgcHitosRonda').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect(),
  ])
  const reclamadas = fichas.filter((item) => isParticipanteReclamado(item.workosUserId))
  const enviadas = reclamadas.filter((item) => item.ficha?.estado === 'enviado')
  return {
    participantes: fichas.length,
    participantesReclamados: reclamadas.length,
    fichasEnviadasReclamados: enviadas.length,
    equiposExportados: enviadas.reduce((n, item) => n + item.analizadores.length + item.instrumentos.length, 0),
    contaminantes: contaminantes.length,
    hitoInicioConFecha: hitos.some(
      (hito) => hito.codigo === 'INICIO_RONDA' && hito.estado !== 'cancelado' && Boolean(hito.fechaObjetivo?.trim())
    ),
  }
}

/**
 * Punto de entrada para `EstadosNativosExpediente.automaticos` de B1. F-PSEA-05 NO se incluye:
 * B1 exige siempre la marca "revisado" y su estado automatico es solo "datos listos".
 */
export async function collectAutomaticos(ctx: Ctx, rondaId: Id<'rondas'>): Promise<Partial<Record<string, boolean>>> {
  const datos = await collectDatosAutollenado(ctx, rondaId)
  return {
    'F-PSEA-03': calcularEstadoAutomatico('F-PSEA-03', datos).cumplido,
    'F-PSEA-04': calcularEstadoAutomatico('F-PSEA-04', datos).cumplido,
  }
}

/** `estadoAutomatico(rondaId, codigo)` para avance / siguiente paso / UI. */
export async function estadoAutomatico(ctx: Ctx, rondaId: Id<'rondas'>, codigo: string) {
  return calcularEstadoAutomatico(codigo, await collectDatosAutollenado(ctx, rondaId))
}

const estadoArgs = { rondaId: v.id('rondas'), codigo: v.string() }

export const getEstadoAutomaticoConfig = {
  args: estadoArgs,
  handler: async (ctx, { rondaId, codigo }) => {
    await requireSgcViewer(ctx)
    return estadoAutomatico(ctx, rondaId, codigo)
  },
} satisfies SgcQueryConfig<typeof estadoArgs>
