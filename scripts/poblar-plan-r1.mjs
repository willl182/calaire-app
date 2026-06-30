#!/usr/bin/env node
/**
 * Script para poblar el plan de ronda F-PPSEA-03 con los datos de Planificacion_R1_PP.md
 * Uso: node scripts/poblar-plan-r1.mjs
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { scriptEnv } from './env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RONDA_ID = scriptEnv.rondaId;
const DEPLOYMENT = scriptEnv.convexDeployment;

const bloques = {
  a: `Autorización informe, planificación, evaluación de desempeño.
Experto en calidad del aire (Wilson).
Ingeniero Operativo (Fabian).
Evidencias: Hoja de Vida (HDV) - Contrato.`,
  b: 'N/A',
  c: `El laboratorio debe ser un laboratorio de medición de inmisión de gases contaminantes criterio.
Debe estar acreditado en métodos US-EPA y de monitoreo continuo (no manuales).
Debe tener estimada la incertidumbre de sus mediciones (porque los laboratorios tienen regla de decisión para la evaluación de la conformidad de los límites normativos).
Debe contar con cilindro de gas trazable metrológicamente con regulador, calibrador dinámico con fotómetro, generador de aire cero y generador de ozono.
Debe contar con personal competente para la instalación, calibración y desarrollo del ensayo.
Debe contar al menos con un (1) método de análisis de los analitos ofertados.
Debe cumplir el instructivo de embalaje y transporte para los analizadores y equipos auxiliares (I-PSEA-01).
Evidencias: certificado de acreditación, registros de métodos, certificado de calibración, resolución de acreditación, checklist.`,
  d: `1 participante.
1 instrumento por contaminante.
2 contaminantes: CO y SO2.
Participante: SIATA Laboratorios.
Requisito: laboratorios que tengan implementados los métodos US-EPA para gases contaminantes criterio del país.`,
  e: `Documentación de las actividades e instrucciones (instructivo de embalaje y transporte, cantidad de mediciones, conexiones, tiempo de la prueba).
Reunión previa para aclarar dudas y retroalimentación.
Plantilla de cargue de datos en el aplicativo (F-PSEA-XX-Plantilla datos).`,
  f: `Intervalos de concentración para SO2, O3, NO-NO2: 0 – 500 ppb.
Intervalo para CO: 0 – 10 ppm.
SO2: ±7.1% (Appendix D EPA).
O3: ±7.1% (Appendix D EPA).
Concentración cero: no debe superar 3.1 nmol/mol (ppb) para SO2, O3, NO-NO2.
Concentración cero: no debe superar 0.41 µmol/mol (ppm) para CO.`,
  g: `Falta de homogeneidad y estabilidad de la fuente (incertidumbre y/o criterio de parada de la ronda si es muy inestable).
Caída de presión en el sistema.
Fugas.
Fluctuación de condiciones ambientales.
Conectividad e instalación.
Falla instrumental.
Manejo y/o interpretación de resultados.`,
  h: `Certificado de Material de Referencia Certificado (MRC) vigente.
Generador de ozono con fotómetro nivel 2 en la cadena de trazabilidad.
Sistema de distribución (manifold, tubería, acoples) inerte.
Verificación de fugas.
Controladores de flujo adecuados para la cantidad de instrumentos.
Garantizar aire cero por debajo del límite de detección (LD), sin humedad, con scrubber para limpieza de contaminantes.
Control y aseguramiento de condiciones ambientales (temperatura, humedad): aire acondicionado, termohigrómetro.
UPS para estabilización de flujo de corriente.
Resolución de medición: minutal.
Instrumentos de referencia previamente calibrados.
Cumplir las condiciones generales de seguridad y salud en el trabajo (SST).`,
  i: 'Suministro de datos crudos.',
  j: `Rangos tentativos de los ítems de ensayo.
Instrucciones.
Cronograma.
Fechas.
Tiempo de envío: similar a la operación de rutina (8-15 días).`,
  k: `Frecuencia de distribución: a definir.
Fecha límite para reportes: 15 días (sujeto a ajuste).
Tiempo de ejecución: 9 horas por cada contaminante (4 niveles y un cero).`,
  l: `Métodos US-EPA.
Calibración exitosa previa a las rondas.
Adherencia a los métodos de referencia y/o equivalentes para cada contaminante/analito.
Cumplir el instructivo de embalaje y transporte para los analizadores y equipos auxiliares (I-PSEA-01).`,
  m: `Diseño basado en ISO 13528.
Procedimiento P-PSEA-06 define las pruebas.
Evidencias: registro + informe.`,
  n: 'Plantilla de cargue de datos en el aplicativo (F-PSEA-XX-Plantilla datos).',
  o: `Para el valor asignado: 1 participante.
Referencia: CALAIRE.`,
  p: `Material de Referencia Certificado (CRM) para la referencia.
Incertidumbre a partir de la norma ISO 13528.`,
  q: 'Todos los participantes emplean el método US-EPA.',
  r: 'Error normalizado (recordar: incertidumbre expandida).',
  s: `Informe de análisis interno de datos para verificar correspondencia.
Informe final.`,
  t: `El resultado forma parte del proyecto; se anonimizarán.
Se evaluará rápidamente para publicar.
Se usará para el proceso de acreditación de CALAIRE.`,
  u: 'Suspensión o cancelación de la ronda.',
};

const camposEstructurados = {
  responsable: 'Wilson Salas / Fabian Operativo',
  fecha_plan: '2026-06-10',
};

const payload = {
  rondaId: RONDA_ID,
  bloques,
  camposEstructurados,
};

const jsonPayload = JSON.stringify(payload);

console.log('Poblando plan F-PPSEA-03 para Ronda 1 (producción)...');
console.log('Ronda ID:', RONDA_ID);
console.log('Deployment:', DEPLOYMENT);

try {
  const result = execSync(
    `pnpm exec convex run sgc:seedPlanRonda --deployment ${DEPLOYMENT} -- '${jsonPayload}'`,
    { cwd: join(__dirname, '..'), encoding: 'utf-8', stdio: 'pipe' }
  );
  console.log('Resultado:', result);
  console.log('Plan poblado exitosamente en producción.');
} catch (error) {
  console.error('Error al poblar el plan:', error.stderr || error.message);
  process.exit(1);
}
