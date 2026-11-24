// Logica pura del expediente documental SGC de ronda (sin ctx de Convex) para poder testearla
// directamente. La politica de cada documento (orden, responsable, obligatoriedad, critico,
// bloqueaCierre) se lee SIEMPRE del catalogo, no de la copia guardada en `sgcDriveRecursos`:
// asi las rondas ya inicializadas toman los cambios del catalogo sin reinicializar.

import {
  getSgcRondaDocumento,
  type SgcObligatoriedad,
  type SgcResponsable,
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
