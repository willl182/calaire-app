'use node'

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'
import { v } from 'convex/values'
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'

function ascii(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '') }

export const generate = internalAction({
  args: { certificateId: v.id('ptCertificados') },
  handler: async (ctx, { certificateId }) => {
    const shouldRun = await ctx.runMutation(internal.pt.certificates.markGenerating, { certificateId })
    if (!shouldRun) return null
    try {
      const data = await ctx.runQuery(internal.pt.certificates.getGenerationData, { certificateId })
      if (!data) throw new Error('Datos del certificado no disponibles.')
      const verifyUrl = `${process.env.SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://calaire.unal.edu.co'}/certificados/${certificateId}/verificar`
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240 })
      const pdf = await PDFDocument.create(), page = pdf.addPage([842, 595]), font = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold)
      page.drawRectangle({ x: 28, y: 28, width: 786, height: 539, borderColor: rgb(0.05, 0.35, 0.55), borderWidth: 3 })
      page.drawText('CERTIFICADO DE PARTICIPACION', { x: 170, y: 485, size: 26, font: bold, color: rgb(0.05, 0.3, 0.5) })
      page.drawText('CALAIRE - Universidad Nacional de Colombia', { x: 255, y: 450, size: 12, font })
      page.drawText(ascii(`Certifica que ${data.laboratory}`), { x: 90, y: 385, size: 17, font: bold })
      page.drawText(ascii(`Codigo de participante: ${data.participantCode}`), { x: 90, y: 350, size: 13, font })
      page.drawText(ascii(`participo en ${data.ronda.nombre} (${data.ronda.codigo}).`), { x: 90, y: 315, size: 14, font })
      page.drawText(ascii(`Contaminantes: ${data.pollutants.join(', ') || 'segun alcance de la ronda'}.`), { x: 90, y: 282, size: 12, font })
      page.drawText('Este certificado acredita exclusivamente la participacion y no implica un desempeno satisfactorio.', { x: 90, y: 225, size: 11, font, color: rgb(0.45, 0.18, 0.05) })
      page.drawText(ascii(`Emitido: ${new Date().toISOString().slice(0, 10)}`), { x: 90, y: 170, size: 11, font })
      const qr = await pdf.embedPng(qrDataUrl); page.drawImage(qr, { x: 650, y: 70, width: 120, height: 120 }); page.drawText('Verificacion', { x: 675, y: 55, size: 9, font })
      const bytes = await pdf.save()
      const storageId = await ctx.storage.store(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }))
      await ctx.runMutation(internal.pt.certificates.markResult, { certificateId, storageId, error: null })
    } catch (error) {
      await ctx.runMutation(internal.pt.certificates.markResult, { certificateId, storageId: null, error: error instanceof Error ? error.message.slice(0, 500) : 'Error de generación.' })
    }
    return null
  },
})
