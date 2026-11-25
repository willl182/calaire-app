// Barril de las acciones SGC de la ronda, divididas por subtema en ./_acciones.
// Sin 'use server' aquí: los archivos de ./_acciones lo declaran y este módulo solo reexporta.
// Las utilidades de ./_acciones/comunes no se reexportan (no son acciones).
export {
  actualizarExpedienteAction,
  marcarAplicaDocumentoAction,
  aprobarDocumentoExpedienteAction,
  transicionSgcAction,
} from './_acciones/expediente'
export {
  inicializarDriveRondaAction,
  crearDriveGoogleAction,
  guardarDriveEditableAction,
  reemplazarDriveRecursoAction,
  guardarDriveDefinitivoAction,
  subirDriveDefinitivoAction,
  cambiarEstadoDriveAction,
  cambiarVisibilidadDriveAction,
  retirarDriveRecursoAction,
  solicitarUploadDriveAction,
  registrarDefinitivoF20Action,
  marcarUsoF20Action,
} from './_acciones/drive'
export {
  guardarPlanRondaAction,
  finalizarPlanRondaAction,
  guardarRevisionDatosAction,
  finalizarRevisionDatosAction,
  guardarRevisionHomogeneidadAction,
  finalizarRevisionHomogeneidadAction,
} from './_acciones/registros'
export {
  crearHitoRondaAction,
  actualizarHitoRondaAction,
} from './_acciones/hitos'
export {
  subirEvidenciaAction,
  retirarEvidenciaAction,
  guardarJustificacionAction,
  retirarJustificacionAction,
  descargarEvidenciaAction,
} from './_acciones/evidencias'
export {
  crearPublicacionAction,
  eliminarPublicacionAction,
  responderComentarioAction,
  crearNotificacionAction,
} from './_acciones/participante'
export {
  guardarResultadoPtAppAction,
  crearCasoSgcAction,
  actualizarCasoSgcAction,
} from './_acciones/casos'
