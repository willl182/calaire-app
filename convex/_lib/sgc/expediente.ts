// Logica pura del expediente documental SGC de ronda (sin ctx de Convex) para poder testearla
// directamente. La politica de cada documento (orden, responsable, obligatoriedad, critico,
// bloqueaCierre) se lee SIEMPRE del catalogo, no de la copia guardada en `sgcDriveRecursos`:
// asi las rondas ya inicializadas toman los cambios del catalogo sin reinicializar.

import {
  getSgcRondaDocumento,
  SGC_RONDA_ETAPAS,
  type SgcObligatoriedad,
  type SgcResponsable,
  type SgcRondaEtapa,
} from './catalog'

export type SgcPoliticaDocumento = {
  enCatalogo: boolean
  orden: number | null
  ordenLogico: number | null
  responsable: SgcResponsable | null
  obligatoriedad: SgcObligatoriedad | null
  etapaKey: string | null
}

type RecursoBase = {
  codigo: string
  tipo?: string
  critico?: boolean | null
  bloqueaCierre?: boolean | null
}

/**
 * Sobrepone la politica vigente del catalogo al recurso guardado. Las carpetas y los recursos
 * fuera del catalogo conservan sus valores guardados y quedan con `enCatalogo: false`.
 */
export function enriquecerRecursoConCatalogo<T extends RecursoBase>(recurso: T): T & { politica: SgcPoliticaDocumento } {
  const documento = recurso.tipo === 'carpeta' ? null : getSgcRondaDocumento(recurso.codigo)
  if (!documento) {
    return {
      ...recurso,
      politica: { enCatalogo: false, orden: null, ordenLogico: null, responsable: null, obligatoriedad: null, etapaKey: null },
    }
  }
  return {
    ...recurso,
    critico: documento.critico,
    bloqueaCierre: documento.bloqueaCierre,
    politica: {
      enCatalogo: true,
      orden: documento.orden,
      ordenLogico: documento.ordenLogico,
      responsable: documento.responsable,
      obligatoriedad: documento.obligatoriedad,
      etapaKey: documento.etapaKey,
    },
  }
}

// ---------------------------------------------------------------------------
// Sincronizacion expediente guardado <-> catalogo (B1.3)
// ---------------------------------------------------------------------------

export const DRIVE_ROOT_CODIGO = 'DRIVE_ROOT'

export type RecursoGuardado = {
  _id: string
  codigo: string
  tipo: string
  parentId?: string | null
}

export type SincronizacionExpediente = {
  inicializado: boolean
  sincronizado: boolean
  carpetasFaltantes: Array<{ key: string; numero: string; carpeta: string; nombre: string }>
  documentosFaltantes: Array<{ codigo: string; nombre: string; etapaKey: string; carpeta: string }>
  documentosEnOtraCarpeta: Array<{ codigo: string; etapaKey: string; carpeta: string }>
  recursosFueraDeCatalogo: Array<{ codigo: string; tipo: string }>
}

function norm(codigo: string) {
  return codigo.trim().toUpperCase()
}

/**
 * Compara el expediente guardado de la ronda con el catalogo vigente: carpetas y documentos
 * faltantes (p. ej. `02A_inicio_ronda`, F-PSEA-19/20/21 en expedientes antiguos), documentos
 * colgados de otra carpeta y recursos que ya no estan en el catalogo (solo informativo).
 */
export function compararExpedienteConCatalogo(
  recursos: readonly RecursoGuardado[],
  etapas: readonly SgcRondaEtapa[] = SGC_RONDA_ETAPAS
): SincronizacionExpediente {
  const porCodigo = new Map(recursos.map((recurso) => [norm(recurso.codigo), recurso]))
  const root = porCodigo.get(DRIVE_ROOT_CODIGO)
  const carpetasFaltantes: SincronizacionExpediente['carpetasFaltantes'] = []
  const documentosFaltantes: SincronizacionExpediente['documentosFaltantes'] = []
  const documentosEnOtraCarpeta: SincronizacionExpediente['documentosEnOtraCarpeta'] = []
  const codigosCatalogo = new Set<string>([DRIVE_ROOT_CODIGO])

  for (const etapa of etapas) {
    const carpetaCodigo = norm(etapa.key)
    codigosCatalogo.add(carpetaCodigo)
    const carpeta = porCodigo.get(carpetaCodigo)
    const carpetaValida = carpeta && carpeta.tipo === 'carpeta' ? carpeta : null
    if (!carpetaValida) {
      carpetasFaltantes.push({ key: etapa.key, numero: etapa.numero, carpeta: etapa.carpeta, nombre: etapa.nombre })
    }
    for (const documento of etapa.documentos) {
      const codigo = norm(documento.codigo)
      codigosCatalogo.add(codigo)
      const recurso = porCodigo.get(codigo)
      if (!recurso) {
        documentosFaltantes.push({ codigo, nombre: documento.nombre, etapaKey: etapa.key, carpeta: etapa.carpeta })
      } else if (carpetaValida && (recurso.parentId ?? null) !== carpetaValida._id) {
        documentosEnOtraCarpeta.push({ codigo, etapaKey: etapa.key, carpeta: etapa.carpeta })
      }
    }
  }

  const recursosFueraDeCatalogo = recursos
    .filter((recurso) => !codigosCatalogo.has(norm(recurso.codigo)))
    .map((recurso) => ({ codigo: recurso.codigo, tipo: recurso.tipo }))

  const inicializado = Boolean(root)
  return {
    inicializado,
    sincronizado:
      inicializado &&
      carpetasFaltantes.length === 0 &&
      documentosFaltantes.length === 0 &&
      documentosEnOtraCarpeta.length === 0,
    carpetasFaltantes,
    documentosFaltantes,
    documentosEnOtraCarpeta,
    recursosFueraDeCatalogo,
  }
}
