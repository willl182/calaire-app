import { mutation, query } from '../_generated/server'

import { getPanelSgcConfig, generateUploadUrlConfig, transitionRondaToDocumentacionPendienteConfig, transitionRondaToCerradaConfig, reabrirRondaSgcConfig, inicializarPanelSgcConfig, listRondasSgcResumenConfig } from './panel'
import { getPlanRondaConfig, createOrUpdatePlanRondaConfig, finalizarPlanRondaConfig } from './plan'
import { getRevisionDatosConfig, getRevisionHomogeneidadConfig, createOrUpdateRevisionDatosConfig, finalizarRevisionDatosConfig, createOrUpdateRevisionHomogeneidadConfig, finalizarRevisionHomogeneidadConfig } from './revision'
import { listHitosRondaConfig, createHitoRondaConfig, updateHitoRondaConfig, getHitosVisibleParticipanteConfig } from './hitos'
import { listEvidenciaSeriesConfig, listEvidenciaVersionesConfig, getDownloadUrlConfig, getEvidenciaVersionContextConfig, createEvidenciaSeriesConfig, registrarEvidenciaVersionConfig, retirarEvidenciaVersionConfig, upsertJustificacionConfig, retirarJustificacionConfig, getEvidenciasPublicasConfig } from './evidencias'
import { listDocumentosSgcConfig, listMatrizDocumentalSgcConfig, listDocumentoSgcVersionesConfig, getDocumentoSgcDownloadUrlConfig, upsertDocumentoSgcConfig, registrarDocumentoSgcVersionConfig, retirarDocumentoSgcVersionConfig } from './documentos'
import { listAuditLogConfig } from './audit'
import { listSnapshotsConfig } from './snapshots'
import { listComunicacionesConfig, createComunicacionConfig, updateComunicacionConfig, deleteComunicacionConfig } from './comunicaciones'
import { listPublicacionesConfig, createPublicacionConfig, deletePublicacionConfig } from './publicaciones'
import { listComentariosRondaConfig, listMisComentariosRondaConfig, createComentarioRondaConfig, responderComentarioRondaConfig } from './comentarios'
import { crearNotificacionConfig, listMisNotificacionesConfig, marcarNotificacionLeidaConfig } from './notificaciones'
import { upsertResultadoPtAppConfig, crearCasoSgcConfig, actualizarCasoSgcConfig } from './casos'
import { crearRegistroSgcConfig, getDocumentoMaestroConfig, importarDocumentosSeedSgcConfig, importarMapaSeedSgcConfig, importarRequisitosSeedSgcConfig, importarSeedSgcConfig, listExpedientesSgcConfig, listMapaSgcConfig, listNormativaSgcConfig, listSgcMaestroConfig, registrarVersionOficialConfig, upsertDocumentoMaestroConfig, upsertDocumentoRequisitoConfig } from './maestro'

export const getPanelSgc = query(getPanelSgcConfig)
export const getPlanRonda = query(getPlanRondaConfig)
export const getRevisionDatos = query(getRevisionDatosConfig)
export const getRevisionHomogeneidad = query(getRevisionHomogeneidadConfig)
export const listHitosRonda = query(listHitosRondaConfig)
export const listEvidenciaSeries = query(listEvidenciaSeriesConfig)
export const listEvidenciaVersiones = query(listEvidenciaVersionesConfig)
export const listDocumentosSgc = query(listDocumentosSgcConfig)
export const listMatrizDocumentalSgc = query(listMatrizDocumentalSgcConfig)
export const listSgcMaestro = query(listSgcMaestroConfig)
export const getDocumentoMaestro = query(getDocumentoMaestroConfig)
export const listNormativaSgc = query(listNormativaSgcConfig)
export const listMapaSgc = query(listMapaSgcConfig)
export const listExpedientesSgc = query(listExpedientesSgcConfig)
export const listDocumentoSgcVersiones = query(listDocumentoSgcVersionesConfig)
export const getDocumentoSgcDownloadUrl = query(getDocumentoSgcDownloadUrlConfig)
export const listAuditLog = query(listAuditLogConfig)
export const listSnapshots = query(listSnapshotsConfig)
export const getDownloadUrl = query(getDownloadUrlConfig)
export const getEvidenciaVersionContext = query(getEvidenciaVersionContextConfig)
export const generateUploadUrl = mutation(generateUploadUrlConfig)
export const upsertDocumentoSgc = mutation(upsertDocumentoSgcConfig)
export const upsertDocumentoMaestro = mutation(upsertDocumentoMaestroConfig)
export const registrarDocumentoSgcVersion = mutation(registrarDocumentoSgcVersionConfig)
export const registrarVersionOficial = mutation(registrarVersionOficialConfig)
export const crearRegistroSgc = mutation(crearRegistroSgcConfig)
export const upsertDocumentoRequisito = mutation(upsertDocumentoRequisitoConfig)
export const importarSeedSgc = mutation(importarSeedSgcConfig)
export const importarDocumentosSeedSgc = mutation(importarDocumentosSeedSgcConfig)
export const importarRequisitosSeedSgc = mutation(importarRequisitosSeedSgcConfig)
export const importarMapaSeedSgc = mutation(importarMapaSeedSgcConfig)
export const retirarDocumentoSgcVersion = mutation(retirarDocumentoSgcVersionConfig)
export const createOrUpdatePlanRonda = mutation(createOrUpdatePlanRondaConfig)
export const finalizarPlanRonda = mutation(finalizarPlanRondaConfig)
export const createOrUpdateRevisionDatos = mutation(createOrUpdateRevisionDatosConfig)
export const finalizarRevisionDatos = mutation(finalizarRevisionDatosConfig)
export const createOrUpdateRevisionHomogeneidad = mutation(createOrUpdateRevisionHomogeneidadConfig)
export const finalizarRevisionHomogeneidad = mutation(finalizarRevisionHomogeneidadConfig)
export const createHitoRonda = mutation(createHitoRondaConfig)
export const updateHitoRonda = mutation(updateHitoRondaConfig)
export const createEvidenciaSeries = mutation(createEvidenciaSeriesConfig)
export const registrarEvidenciaVersion = mutation(registrarEvidenciaVersionConfig)
export const retirarEvidenciaVersion = mutation(retirarEvidenciaVersionConfig)
export const upsertJustificacion = mutation(upsertJustificacionConfig)
export const retirarJustificacion = mutation(retirarJustificacionConfig)
export const transitionRondaToDocumentacionPendiente = mutation(transitionRondaToDocumentacionPendienteConfig)
export const transitionRondaToCerrada = mutation(transitionRondaToCerradaConfig)
export const reabrirRondaSgc = mutation(reabrirRondaSgcConfig)
export const inicializarPanelSgc = mutation(inicializarPanelSgcConfig)
export const listComunicaciones = query(listComunicacionesConfig)
export const createComunicacion = mutation(createComunicacionConfig)
export const updateComunicacion = mutation(updateComunicacionConfig)
export const deleteComunicacion = mutation(deleteComunicacionConfig)
export const listRondasSgcResumen = query(listRondasSgcResumenConfig)
export const getHitosVisibleParticipante = query(getHitosVisibleParticipanteConfig)
export const getEvidenciasPublicas = query(getEvidenciasPublicasConfig)
export const listPublicaciones = query(listPublicacionesConfig)
export const createPublicacion = mutation(createPublicacionConfig)
export const deletePublicacion = mutation(deletePublicacionConfig)
export const listComentariosRonda = query(listComentariosRondaConfig)
export const listMisComentariosRonda = query(listMisComentariosRondaConfig)
export const createComentarioRonda = mutation(createComentarioRondaConfig)
export const responderComentarioRonda = mutation(responderComentarioRondaConfig)
export const crearNotificacion = mutation(crearNotificacionConfig)
export const listMisNotificaciones = query(listMisNotificacionesConfig)
export const marcarNotificacionLeida = mutation(marcarNotificacionLeidaConfig)
export const upsertResultadoPtApp = mutation(upsertResultadoPtAppConfig)
export const crearCasoSgc = mutation(crearCasoSgcConfig)
export const actualizarCasoSgc = mutation(actualizarCasoSgcConfig)
