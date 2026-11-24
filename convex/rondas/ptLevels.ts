import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

type Ctx = QueryCtx | MutationCtx
type Contaminante = Doc<'rondaContaminantes'>['contaminante']

export type NivelesPTDescuadre = { contaminante: string; niveles: number; nivelesPT: number }

/**
 * Compara, por contaminante, los niveles definidos al crear la ronda con los
 * niveles PT (run/nivel) cargados en Configuracion PT. Devuelve solo los que no cuadran.
 */
export async function getNivelesPTDescuadres(ctx: Ctx, rondaId: Id<'rondas'>): Promise<NivelesPTDescuadre[]> {
  const [contaminantes, items] = await Promise.all([
    ctx.db.query('rondaContaminantes').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
    ctx.db.query('rondaPtItems').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect(),
  ])
  const conteo = new Map<string, number>()
  for (const item of items) conteo.set(item.contaminante, (conteo.get(item.contaminante) ?? 0) + 1)

  const descuadres: NivelesPTDescuadre[] = []
  for (const c of contaminantes) {
    const nivelesPT = conteo.get(c.contaminante) ?? 0
    if (nivelesPT !== c.niveles) descuadres.push({ contaminante: c.contaminante, niveles: c.niveles, nivelesPT })
    conteo.delete(c.contaminante)
  }
  for (const [contaminante, nivelesPT] of conteo) descuadres.push({ contaminante, niveles: 0, nivelesPT })
  return descuadres
}

/** Impide cargar mas niveles PT de los definidos para el contaminante en la ronda. */
export async function assertCapacidadNivelesPT(ctx: Ctx, rondaId: Id<'rondas'>, contaminante: Contaminante, nuevos: number) {
  const configurado = await ctx.db
    .query('rondaContaminantes')
    .withIndex('by_ronda_contaminante', (q) => q.eq('rondaId', rondaId).eq('contaminante', contaminante))
    .first()
  if (!configurado) throw new Error(`${contaminante} no esta incluido en la ronda.`)
  const existentes = (await ctx.db.query('rondaPtItems').withIndex('by_ronda', (q) => q.eq('rondaId', rondaId)).collect())
    .filter((item) => item.contaminante === contaminante).length
  if (existentes + nuevos > configurado.niveles) {
    throw new Error(
      `${contaminante} tiene ${configurado.niveles} nivel(es) definidos en la ronda y ya hay ${existentes} nivel(es) PT; no se pueden agregar ${nuevos} mas.`
    )
  }
}

/** Impide activar la ronda si algun contaminante no tiene tantos niveles PT como niveles definidos. */
export async function assertNivelesPTCuadran(ctx: Ctx, rondaId: Id<'rondas'>) {
  const descuadres = await getNivelesPTDescuadres(ctx, rondaId)
  if (descuadres.length === 0) return
  const detalle = descuadres.map((d) => `${d.contaminante}: ${d.nivelesPT} nivel(es) PT de ${d.niveles}`).join('; ')
  throw new Error(`Los niveles PT no coinciden con los niveles de la ronda (${detalle}).`)
}
