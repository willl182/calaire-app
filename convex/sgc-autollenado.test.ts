// @vitest-environment edge-runtime

import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')
delete modules['./sgc-autollenado.test.ts']

const adminIdentity = { subject: 'admin-sgc', email: 'admin@calaire.test', role: 'admin' }

const ficha = (rondaParticipanteId: never, estado: 'borrador' | 'enviado') => ({
  rondaParticipanteId,
  nombreLaboratorio: 'Lab',
  estacionamiento: false,
  decDatosCorrectos: true,
  decAceptaCondiciones: true,
  decCompromisos: true,
  decFirmaAutorizada: true,
  estado,
  createdAt: 1,
  updatedAt: 1,
})

describe('autollenado B2', () => {
  test('F-03/F-04 automaticos alimentan el avance de B1; F-05 sigue exigiendo revisado', async () => {
    const t = convexTest(schema, modules)
    const admin = t.withIdentity(adminIdentity)
    const { rondaId, p1, p2 } = await t.run(async (ctx) => {
      const rondaId = await ctx.db.insert('rondas', { codigo: 'R-B2', nombre: 'Ronda B2', estado: 'activa', createdAt: 1 })
      await ctx.db.insert('rondaContaminantes', { rondaId, contaminante: 'CO', niveles: 1, replicas: 2 })
      const p1 = await ctx.db.insert('rondaParticipantes', { rondaId, workosUserId: 'u1', email: 'a@x.co', invitadoAt: 1, participantProfile: 'member', participantCode: 'P1' })
      const p2 = await ctx.db.insert('rondaParticipantes', { rondaId, workosUserId: 'u2', email: 'b@x.co', invitadoAt: 1, participantProfile: 'member', participantCode: 'P2' })
      // Cupo sin reclamar: no cuenta para F-03.
      await ctx.db.insert('rondaParticipantes', { rondaId, workosUserId: 'pendiente:c@x.co', email: 'c@x.co', invitadoAt: 1, participantProfile: 'member' })
      await ctx.db.insert('sgcHitosRonda', { rondaId, codigo: 'INICIO_RONDA', nombre: 'Inicio', fase: 'ejecucion', fechaObjetivo: '2026-12-01', estado: 'pendiente', responsable: 'coord', visibleParticipante: true, bloqueaCierre: false, createdAt: 1, createdBy: 'a', updatedAt: 1, updatedBy: 'a' })
      return { rondaId, p1, p2 }
    })
    await admin.mutation(api.sgc.index.actualizarExpediente, { rondaId })

    const f1 = await t.run(async (ctx) => {
      const f1 = await ctx.db.insert('fichasRegistro', ficha(p1 as never, 'enviado'))
      await ctx.db.insert('fichasRegistro', ficha(p2 as never, 'borrador'))
      await ctx.db.insert('fichasAnalizadores', { fichaId: f1, sortOrder: 0, analito: 'CO', fabricante: 'T', modelo: 'M', numeroSerie: 'S', metodoEpa: 'E', tipoVerificacion: 'v', incertidumbreDeclarada: '1', unidadSalida: 'ppm' })
      return f1
    })
    expect((await admin.query(api.sgc.index.getEstadoAutomatico, { rondaId, codigo: 'F-PSEA-03' })).cumplido).toBe(false)

    await t.run(async (ctx) => {
      const borrador = await ctx.db.query('fichasRegistro').withIndex('by_ronda_participante', (q) => q.eq('rondaParticipanteId', p2)).first()
      await ctx.db.patch(borrador!._id, { estado: 'enviado' })
    })
    expect((await admin.query(api.sgc.index.getEstadoAutomatico, { rondaId, codigo: 'F-PSEA-03' })).cumplido).toBe(true)
    expect((await admin.query(api.sgc.index.getEstadoAutomatico, { rondaId, codigo: 'F-PSEA-04' })).cumplido).toBe(true)
    expect(await admin.query(api.sgc.index.getEstadoAutomatico, { rondaId, codigo: 'F-PSEA-05' })).toMatchObject({ cumplido: true, requiereRevision: true })
    expect((await admin.query(api.sgc.index.getEstadoAutomatico, { rondaId, codigo: 'F-PSEA-01' })).soportado).toBe(false)

    const avance = await admin.query(api.sgc.index.getAvanceExpediente, { rondaId })
    const estado = (codigo: string) => avance.items.find((item) => item.codigo === codigo)?.estado
    expect(estado('F-PSEA-03')).toBe('completo')
    expect(estado('F-PSEA-04')).toBe('completo')
    expect(estado('F-PSEA-05')).toBe('pendiente')
    expect(estado('F-PSEA-01')).not.toBe('completo')

    const equipos = await admin.query(api.sgc.index.getEquiposExport, { rondaId })
    expect(equipos?.equipos).toHaveLength(1)
    expect(equipos?.equipos[0]).toMatchObject({ participantCode: 'P1', descripcion: 'CO' })
    expect(f1).toBeTruthy()

    const hitos = await admin.query(api.sgc.index.getHitosExport, { rondaId })
    expect(hitos?.calendario.map((h) => h.codigo)).toEqual(['INICIO_RONDA'])
  })
})
