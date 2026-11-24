// @vitest-environment edge-runtime

import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')
delete modules['./sgc-expediente.test.ts']

const adminIdentity = { subject: 'admin-sgc', email: 'admin@calaire.test', role: 'admin' }

async function seedRonda(t: ReturnType<typeof convexTest>) {
  return t.run((ctx) =>
    ctx.db.insert('rondas', { codigo: 'R-B1', nombre: 'Ronda B1', estado: 'activa', createdAt: Date.now() })
  )
}

describe('sincronizacion del expediente (B1.3)', () => {
  test('detecta carpetas y documentos faltantes y actualizar es idempotente', async () => {
    const t = convexTest(schema, modules)
    const rondaId = await seedRonda(t)
    const admin = t.withIdentity(adminIdentity)

    const vacio = await admin.query(api.sgc.index.getSincronizacionExpediente, { rondaId })
    expect(vacio.inicializado).toBe(false)
    expect(vacio.sincronizado).toBe(false)

    await admin.mutation(api.sgc.index.actualizarExpediente, { rondaId })
    const sincronizado = await admin.query(api.sgc.index.getSincronizacionExpediente, { rondaId })
    expect(sincronizado.sincronizado).toBe(true)

    // Simula un expediente antiguo: sin carpeta 02A ni F-PSEA-19/20/21.
    await t.run(async (ctx) => {
      const recursos = await ctx.db.query('sgcDriveRecursos').withIndex('by_rondaId', (q) => q.eq('rondaId', rondaId)).collect()
      for (const recurso of recursos) {
        if (['INICIO_RONDA', 'F-PSEA-19', 'F-PSEA-20', 'F-PSEA-21'].includes(recurso.codigo)) await ctx.db.delete(recurso._id)
      }
    })
    const antiguo = await admin.query(api.sgc.index.getSincronizacionExpediente, { rondaId })
    expect(antiguo.inicializado).toBe(true)
    expect(antiguo.sincronizado).toBe(false)
    expect(antiguo.carpetasFaltantes.map((c) => c.carpeta)).toEqual(['02A_inicio_ronda'])
    expect(antiguo.documentosFaltantes.map((d) => d.codigo).sort()).toEqual(['F-PSEA-19', 'F-PSEA-20', 'F-PSEA-21'])

    const reparado = await admin.mutation(api.sgc.index.actualizarExpediente, { rondaId })
    expect(reparado.creados).toBe(4)
    expect((await admin.query(api.sgc.index.getSincronizacionExpediente, { rondaId })).sincronizado).toBe(true)

    const otraVez = await admin.mutation(api.sgc.index.actualizarExpediente, { rondaId })
    expect(otraVez.creados).toBe(0)
    expect(otraVez.reparados).toBe(0)
  })

  test('avance: marcar "si aplica" y aprobaciones explicitas (B1.4)', async () => {
    const t = convexTest(schema, modules)
    const rondaId = await seedRonda(t)
    const admin = t.withIdentity(adminIdentity)
    await admin.mutation(api.sgc.index.actualizarExpediente, { rondaId })

    const inicial = await admin.query(api.sgc.index.getAvanceExpediente, { rondaId })
    expect(inicial.items.find((i) => i.codigo === 'F-PSEA-17')?.cuentaEnAvance).toBe(false)

    await expect(
      admin.mutation(api.sgc.index.marcarAplicaDocumento, { rondaId, codigo: 'F-PSEA-06', aplica: true })
    ).rejects.toThrow(/si aplica/)
    expect(await admin.mutation(api.sgc.index.marcarAplicaDocumento, { rondaId, codigo: 'f-psea-17', aplica: true })).toEqual({ cambiado: true })
    expect(await admin.mutation(api.sgc.index.marcarAplicaDocumento, { rondaId, codigo: 'F-PSEA-17', aplica: true })).toEqual({ cambiado: false })
    const activado = await admin.query(api.sgc.index.getAvanceExpediente, { rondaId })
    expect(activado.total).toBe(inicial.total + 1)

    await admin.mutation(api.sgc.index.aprobarDocumentoExpediente, { rondaId, codigo: 'F-PSEA-05', aprobado: true })
    const revisado = await admin.query(api.sgc.index.getAvanceExpediente, { rondaId })
    expect(revisado.items.find((i) => i.codigo === 'F-PSEA-05')?.estado).toBe('completo')

    await expect(
      admin.mutation(api.sgc.index.aprobarDocumentoExpediente, { rondaId, codigo: 'EVID-CIERRE', aprobado: true })
    ).rejects.toThrow(/bloqueante/)
    await expect(
      admin.mutation(api.sgc.index.aprobarDocumentoExpediente, { rondaId, codigo: 'F-PSEA-06', aprobado: true })
    ).rejects.toThrow(/no requiere/)
  })

  test('estado Drive de la ronda (B1.5)', async () => {
    const t = convexTest(schema, modules)
    const rondaId = await seedRonda(t)
    const admin = t.withIdentity(adminIdentity)
    expect((await admin.query(api.sgc.index.getEstadoDriveRonda, { rondaId })).expedienteInicializado).toBe(false)
    await admin.mutation(api.sgc.index.actualizarExpediente, { rondaId })
    const estado = await admin.query(api.sgc.index.getEstadoDriveRonda, { rondaId })
    expect(estado).toMatchObject({ expedienteInicializado: true, carpetaRondaCreada: false })
  })

  test('sin rol SGC no consulta la sincronizacion', async () => {
    const t = convexTest(schema, modules)
    const rondaId = await seedRonda(t)
    await expect(
      t.withIdentity({ subject: 'p', email: 'p@lab.test' }).query(api.sgc.index.getSincronizacionExpediente, { rondaId })
    ).rejects.toThrow()
  })
})
