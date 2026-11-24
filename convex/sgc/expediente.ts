import { v } from 'convex/values'

import { compararExpedienteConCatalogo } from '../_lib/sgc/expediente'
import { inicializarDriveRondaConfig } from './drive'
import { requireSgcViewer, type SgcMutationConfig, type SgcQueryConfig } from './shared'

const rondaArgs = { rondaId: v.id('rondas') }

/** B1.3: compara el expediente guardado de la ronda con el catalogo vigente. */
export const getSincronizacionExpedienteConfig = {
  args: rondaArgs,
  handler: async (ctx, { rondaId }) => {
    await requireSgcViewer(ctx)
    const recursos = await ctx.db.query('sgcDriveRecursos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
    return compararExpedienteConCatalogo(
      recursos.map((recurso) => ({
        _id: String(recurso._id),
        codigo: recurso.codigo,
        tipo: recurso.tipo,
        parentId: recurso.parentId ? String(recurso.parentId) : null,
      }))
    )
  },
} satisfies SgcQueryConfig<typeof rondaArgs>

/**
 * B1.3: "Actualizar expediente". Reutiliza la reparacion idempotente de `inicializarDriveRonda`:
 * crea carpetas/documentos faltantes, recoloca los que cuelgan de otra carpeta y nunca borra
 * ni pisa enlaces, definitivos, estado ni visibilidad ya cargados.
 */
export const actualizarExpedienteConfig = {
  args: inicializarDriveRondaConfig.args,
  handler: async (ctx, args) => inicializarDriveRondaConfig.handler(ctx, args),
} satisfies SgcMutationConfig<typeof inicializarDriveRondaConfig.args>
