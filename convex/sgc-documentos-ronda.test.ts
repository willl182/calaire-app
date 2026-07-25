// @vitest-environment edge-runtime

import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')
delete modules['./sgc-documentos-ronda.test.ts']

const adminIdentity = { subject: 'admin-sgc', email: 'admin@calaire.test', role: 'admin' }
const staffIdentity = { subject: 'staff-sgc', email: 'staff@calaire.test', role: 'staff' }

async function seedRonda(t: ReturnType<typeof convexTest>, estado: 'borrador' | 'activa' = 'activa') {
  return t.run(async (ctx) => {
    const rondaId = await ctx.db.insert('rondas', {
      codigo: `R-SGC-${Date.now()}`,
      nombre: 'Ronda documentos SGC',
      estado,
      createdAt: Date.now(),
    })
    await ctx.db.insert('sgcHitosRonda', {
      rondaId,
      codigo: 'INICIO_RONDA',
      nombre: 'Inicio de ronda',
      fase: 'Inicio de ronda',
      fechaObjetivo: '2026-08-01',
      fechaReal: null,
      estado: 'pendiente',
      responsable: 'Calaire',
      visibleParticipante: true,
      bloqueaCierre: false,
      formatoRelacionado: 'F-PSEA-19',
      notas: null,
      createdAt: Date.now(),
      createdBy: 'seed',
      updatedAt: Date.now(),
      updatedBy: 'seed',
    })
    return rondaId
  })
}

async function seedRecurso(
  t: ReturnType<typeof convexTest>,
  rondaId: Awaited<ReturnType<typeof seedRonda>>,
  codigo: 'F-PSEA-19' | 'F-PSEA-20' | 'F-PSEA-21'
) {
  return t.run((ctx) =>
    ctx.db.insert('sgcDriveRecursos', {
      rondaId,
      parentId: null,
      proveedor: 'google_drive',
      tipo: codigo === 'F-PSEA-20' ? 'archivo' : 'pdf',
      codigo,
      nombre: codigo,
      fase: 'Inicio de ronda',
      formatoRelacionado: codigo,
      documentoSgcId: null,
      documentoSgcVersionId: null,
      evidenciaSerieId: null,
      critico: true,
      bloqueaCierre: false,
      usadoEnRonda: false,
      publicaParticipante: false,
      driveFileId: null,
      driveFolderId: null,
      webUrl: null,
      templateUrl: null,
      definitivo: null,
      estado: 'pendiente',
      notas: null,
      createdAt: Date.now(),
      createdBy: 'seed',
      updatedAt: Date.now(),
      updatedBy: 'seed',
    })
  )
}

async function store(t: ReturnType<typeof convexTest>, content: string, type: string) {
  const bytes = new TextEncoder().encode(content)
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob([bytes], { type })))
  return { storageId, size: bytes.byteLength }
}

function recursoArgs(
  rondaId: Awaited<ReturnType<typeof seedRonda>>,
  recursoId: Awaited<ReturnType<typeof seedRecurso>>,
  definitivo?: {
    storageId: Awaited<ReturnType<typeof store>>['storageId']
    fileName: string
    contentType: string
    size: number
    tipo: string
  }
) {
  return {
    recursoId,
    rondaId,
    parentId: null,
    codigo: 'F-PSEA-20',
    nombre: 'Rotulado anónimo',
    fase: 'Inicio de ronda',
    tipo: 'archivo' as const,
    formatoRelacionado: 'F-PSEA-20',
    webUrl: null,
    templateUrl: null,
    notas: null,
    ...(definitivo === undefined ? {} : { definitivo }),
  }
}

describe('F-PSEA-19', () => {
  test('inicializa una vez, exige dos organizadores y publica solo PDF firmado por admin', async () => {
    const t = convexTest(schema, modules)
    const rondaId = await seedRonda(t)
    const recursoId = await seedRecurso(t, rondaId, 'F-PSEA-19')
    await t.run((ctx) =>
      ctx.db.insert('rondaParticipantes', {
        rondaId,
        workosUserId: 'participante-f19',
        email: 'participante@lab.test',
        invitadoAt: Date.now(),
        participantProfile: 'member',
      })
    )
    const staff = t.withIdentity(staffIdentity)
    const admin = t.withIdentity(adminIdentity)
    const participante = t.withIdentity({ subject: 'participante-f19' })

    const primera = await staff.mutation(api.sgc.index.inicializarActaInicio, { rondaId })
    const segunda = await staff.mutation(api.sgc.index.inicializarActaInicio, { rondaId })
    expect(segunda).toMatchObject({ actaId: primera.actaId, creada: false, firmantesCreados: 3 })

    await expect(
      staff.mutation(api.sgc.index.actualizarActaInicio, {
        actaId: primera.actaId,
        fecha: '2026-08-01',
        lugar: 'Calaire',
        textoInicio: 'Inicio formal',
        organizadores: [{ nombre: 'Uno', entidad: 'Calaire' }],
      })
    ).rejects.toThrow(/exactamente dos organizadores/)

    await staff.mutation(api.sgc.index.actualizarActaInicio, {
      actaId: primera.actaId,
      fecha: '2026-08-01',
      lugar: 'Calaire',
      textoInicio: 'Inicio formal',
      organizadores: [
        { nombre: 'Organizador Uno', entidad: 'Calaire' },
        { nombre: 'Organizador Dos', entidad: 'Calaire' },
      ],
    })

    await expect(
      staff.mutation(api.sgc.index.cambiarPublicacionActaInicio, {
        actaId: primera.actaId,
        publicaParticipante: true,
      })
    ).rejects.toThrow(/Permisos insuficientes/)
    await expect(
      admin.mutation(api.sgc.index.cambiarPublicacionActaInicio, {
        actaId: primera.actaId,
        publicaParticipante: true,
      })
    ).rejects.toThrow(/Cargue PDF firmado/)

    const pdf = await store(t, '%PDF-1.4 firmado', 'application/pdf')
    await staff.mutation(api.sgc.index.registrarPdfFirmadoActaInicio, {
      actaId: primera.actaId,
      ...pdf,
      fileName: 'F-PSEA-19-firmado.pdf',
      contentType: 'application/pdf',
    })
    expect(await participante.query(api.sgc.index.getActaInicioDownloadUrl, { rondaId, tipo: 'pdf_firmado' })).toBeNull()

    await admin.mutation(api.sgc.index.cambiarPublicacionActaInicio, {
      actaId: primera.actaId,
      publicaParticipante: true,
    })
    expect(await participante.query(api.sgc.index.getActaInicioDownloadUrl, { rondaId, tipo: 'pdf_firmado' })).toMatch(/^https?:\/\//)

    const persisted = await t.run(async (ctx) => ({
      acta: await ctx.db.get(primera.actaId),
      recurso: await ctx.db.get(recursoId),
    }))
    expect(persisted.acta).toMatchObject({ estado: 'publicado', publicaParticipante: true })
    expect(persisted.recurso).toMatchObject({ estado: 'diligenciado', publicaParticipante: true })

    await staff.mutation(api.sgc.index.actualizarActaInicio, {
      actaId: primera.actaId,
      fecha: '2026-08-02',
      lugar: 'Calaire',
      textoInicio: 'Inicio formal actualizado',
      organizadores: [
        { nombre: 'Organizador Uno', entidad: 'Calaire' },
        { nombre: 'Organizador Dos', entidad: 'Calaire' },
      ],
    })
    expect(await participante.query(api.sgc.index.getActaInicioDownloadUrl, { rondaId, tipo: 'pdf_firmado' })).toBeNull()
    const invalidado = await t.run(async (ctx) => ({
      acta: await ctx.db.get(primera.actaId),
      recurso: await ctx.db.get(recursoId),
    }))
    expect(invalidado.acta).toMatchObject({
      estado: 'borrador',
      pdfStorageId: null,
      publicaParticipante: false,
    })
    expect(invalidado.recurso).toMatchObject({
      definitivo: null,
      estado: 'pendiente',
      publicaParticipante: false,
    })
  })
})

describe('F-PSEA-20', () => {
  test('exige definitivo, reinicia uso al reemplazar y nunca permite publicación', async () => {
    const t = convexTest(schema, modules)
    const rondaId = await seedRonda(t)
    const recursoId = await seedRecurso(t, rondaId, 'F-PSEA-20')
    const staff = t.withIdentity(staffIdentity)

    await expect(
      staff.mutation(api.sgc.index.marcarDriveRecursoUsado, { recursoId, usado: true })
    ).rejects.toThrow(/archivo definitivo/)

    const primero = await store(t, 'rotulado-1', 'application/pdf')
    await staff.mutation(api.sgc.index.upsertDriveRecurso, recursoArgs(rondaId, recursoId, {
      ...primero,
      fileName: 'rotulado-1.pdf',
      contentType: 'application/pdf',
      tipo: 'pdf',
    }))
    await staff.mutation(api.sgc.index.marcarDriveRecursoUsado, { recursoId, usado: true })
    expect(await t.run((ctx) => ctx.db.get(recursoId))).toMatchObject({ usadoEnRonda: true, estado: 'diligenciado' })

    await staff.mutation(api.sgc.index.upsertDriveRecurso, {
      ...recursoArgs(rondaId, recursoId),
      notas: 'Metadato actualizado',
    })
    expect(await t.run((ctx) => ctx.db.get(recursoId))).toMatchObject({ usadoEnRonda: true })

    const segundo = await store(t, 'rotulado-2', 'application/pdf')
    await staff.mutation(api.sgc.index.upsertDriveRecurso, recursoArgs(rondaId, recursoId, {
      ...segundo,
      fileName: 'rotulado-2.pdf',
      contentType: 'application/pdf',
      tipo: 'pdf',
    }))
    expect(await t.run((ctx) => ctx.db.get(recursoId))).toMatchObject({
      usadoEnRonda: false,
      estado: 'creado',
    })

    await expect(
      staff.mutation(api.sgc.index.actualizarVisibilidadDriveRecurso, {
        recursoId,
        publicaParticipante: true,
      })
    ).rejects.toThrow(/documentos internos/)
  })
})

describe('F-PSEA-21', () => {
  test('crea mínimos una vez y rechaza relación incompleta', async () => {
    const t = convexTest(schema, modules)
    const rondaId = await seedRonda(t)
    const staff = t.withIdentity(staffIdentity)

    const primera = await staff.mutation(api.sgc.index.inicializarRelacionInstrumentos, { rondaId })
    const segunda = await staff.mutation(api.sgc.index.inicializarRelacionInstrumentos, { rondaId })
    expect(primera).toMatchObject({ creada: true, minimosAgregados: 7 })
    expect(segunda).toMatchObject({ relacionId: primera.relacionId, creada: false })
    const relacion = await staff.query(api.sgc.index.getRelacionInstrumentosRonda, { rondaId })
    if (!relacion) throw new Error('Relacion F21 no inicializada.')
    expect(relacion.items).toHaveLength(7)
    expect(relacion.resumen).toMatchObject({ analizadores: 4, aireCero: 1, calibradores: 1, cilindros: 1 })
    await expect(
      staff.mutation(api.sgc.index.enviarRelacionInstrumentosAValidacion, {
        relacionId: primera.relacionId,
        tecnicoNombre: 'Técnico',
      })
    ).rejects.toThrow(/sin identificacion completa/)
  })

  test('valida con admin, controla revisión de exportación e invalida al editar', async () => {
    const t = convexTest(schema, modules)
    const rondaId = await seedRonda(t)
    const recursoId = await seedRecurso(t, rondaId, 'F-PSEA-21')
    const staff = t.withIdentity(staffIdentity)
    const admin = t.withIdentity(adminIdentity)
    const participante = t.withIdentity({ subject: 'participante-f21' })
    const { relacionId, itemId } = await t.run(async (ctx) => {
      const now = Date.now()
      const relacionId = await ctx.db.insert('sgcInstrumentosRonda', {
        rondaId,
        estado: 'pendiente_validacion',
        revision: 4,
        tecnicoNombre: 'Técnico Calaire',
        enviadoAt: now,
        coordinadorNombre: null,
        validadoAt: null,
        observacionDevolucion: null,
        pdfStorageId: null,
        pdfRevision: null,
        xlsxStorageId: null,
        xlsxRevision: null,
        createdAt: now,
        createdBy: 'seed',
        updatedAt: now,
        updatedBy: 'seed',
      })
      const tipos = ['analizador', 'analizador', 'analizador', 'analizador', 'aire_cero', 'calibrador_dinamico', 'cilindro'] as const
      let itemId
      for (let index = 0; index < tipos.length; index += 1) {
        const general = await ctx.storage.store(new Blob([`general-${index}`], { type: 'image/jpeg' }))
        const placa = await ctx.storage.store(new Blob([`placa-${index}`], { type: 'image/jpeg' }))
        const id = await ctx.db.insert('sgcInstrumentosRondaItems', {
          relacionId,
          tipo: tipos[index],
          origen: 'placeholder_minimo',
          codigoInterno: `CAL-${index}`,
          marca: 'Marca',
          modelo: 'Modelo',
          serialIdentificacion: `SER-${index}`,
          observaciones: '',
          fotoGeneralStorageId: general,
          fotoGeneralFileName: `general-${index}.jpg`,
          fotoPlacaStorageId: placa,
          fotoPlacaFileName: `placa-${index}.jpg`,
          sortOrder: index,
          createdAt: now,
          updatedAt: now,
          updatedBy: 'seed',
        })
        itemId ??= id
      }
      if (!itemId) throw new Error('Fixture F21 sin instrumentos.')
      return { relacionId, itemId }
    })

    await expect(
      staff.mutation(api.sgc.index.validarRelacionInstrumentos, {
        relacionId,
        coordinadorNombre: 'Coordinador',
      })
    ).rejects.toThrow(/Permisos insuficientes/)
    await admin.mutation(api.sgc.index.validarRelacionInstrumentos, {
      relacionId,
      coordinadorNombre: 'Coordinador',
    })

    const pdf = await store(t, '%PDF-1.4 instrumentos', 'application/pdf')
    await expect(
      staff.mutation(api.sgc.index.registrarExportacionInstrumentos, {
        relacionId,
        tipo: 'pdf',
        ...pdf,
        fileName: 'instrumentos.pdf',
        contentType: 'application/pdf',
        revision: 3,
      })
    ).rejects.toThrow(/revision exportada/)
    await staff.mutation(api.sgc.index.registrarExportacionInstrumentos, {
      relacionId,
      tipo: 'pdf',
      ...pdf,
      fileName: 'instrumentos.pdf',
      contentType: 'application/pdf',
      revision: 4,
    })
    expect(await t.run((ctx) => ctx.db.get(recursoId))).toMatchObject({ estado: 'diligenciado', publicaParticipante: false })
    await expect(
      participante.query(api.sgc.index.getExportacionInstrumentosUrl, { rondaId, tipo: 'pdf' })
    ).rejects.toThrow(/Permisos insuficientes/)
    await expect(
      staff.mutation(api.sgc.index.actualizarVisibilidadDriveRecurso, {
        recursoId,
        publicaParticipante: true,
      })
    ).rejects.toThrow(/documentos internos/)

    await staff.mutation(api.sgc.index.actualizarInstrumentoRonda, {
      itemId,
      tipo: 'analizador',
      codigoInterno: 'CAL-EDITADO',
      marca: 'Marca',
      modelo: 'Modelo',
      serialIdentificacion: 'SER-EDITADO',
      observaciones: 'Cambio posterior',
    })
    expect(await t.run((ctx) => ctx.db.get(relacionId))).toMatchObject({
      estado: 'requiere_ajustes',
      revision: 5,
      coordinadorNombre: null,
      validadoAt: null,
      pdfStorageId: null,
      pdfRevision: null,
      xlsxStorageId: null,
      xlsxRevision: null,
    })
    expect(await t.run((ctx) => ctx.db.get(recursoId))).toMatchObject({
      definitivo: null,
      estado: 'pendiente',
      publicaParticipante: false,
    })
  })
})
