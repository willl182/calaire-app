'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  devolverF21Action,
  eliminarInstrumentoAction,
  enviarValidacionF21Action,
  generarExportacionesF21Action,
  guardarInstrumentoAction,
  registrarFotoF21Action,
  retirarFotoF21Action,
  solicitarUploadF21Action,
  validarF21Action,
} from './actions'

const tipos = [
  ['analizador', 'Analizador'],
  ['aire_cero', 'Aire cero'],
  ['calibrador_dinamico', 'Calibrador dinámico'],
  ['cilindro', 'Cilindro'],
  ['otro', 'Otro'],
] as const

type Item = {
  _id: string
  tipo: string
  codigoInterno: string
  marca: string
  modelo: string
  serialIdentificacion: string
  observaciones: string
  fotoGeneralStorageId?: string | null
  fotoGeneralFileName?: string | null
  fotoPlacaStorageId?: string | null
  fotoPlacaFileName?: string | null
}

type Props = {
  rondaId: string
  relacionId: string
  estado: string
  items: Item[]
  completo: boolean
  tecnicoNombre?: string | null
  coordinadorNombre?: string | null
  observacionDevolucion?: string | null
  canValidate: boolean
  hasPdf: boolean
  hasXlsx: boolean
  pdfUrl?: string | null
  xlsxUrl?: string | null
}

export default function InstrumentosEditor(props: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState('')

  const run = (task: () => Promise<unknown>) => startTransition(async () => {
    setError('')
    try { await task(); router.refresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No fue posible completar la operación.') }
  })

  const upload = async (itemId: string, tipoFoto: 'general' | 'placa_serial', file: File) => {
    setError('')
    setUploading(`${itemId}:${tipoFoto}`)
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Seleccione imagen JPEG, PNG o WebP.')
      if (file.size > 10 * 1024 * 1024) throw new Error('Imagen supera 10 MB.')
      const uploadUrl = await solicitarUploadF21Action()
      const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
      if (!response.ok) throw new Error('No fue posible subir imagen.')
      const { storageId } = await response.json() as { storageId: string }
      await registrarFotoF21Action(props.rondaId, { itemId, tipoFoto, storageId, fileName: file.name, contentType: file.type, size: file.size })
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible subir imagen.')
    } finally { setUploading('') }
  }

  return (
    <div className="grid gap-6">
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
      {props.observacionDevolucion && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Devolución: {props.observacionDevolucion}</p>}

      <section className="grid gap-4">
        {props.items.map((item, index) => (
          <form key={item._id} action={(formData) => run(() => guardarInstrumentoAction(props.rondaId, formData))} className="card grid gap-3 p-5">
            <input type="hidden" name="item_id" value={item._id} />
            <input type="hidden" name="relacion_id" value={props.relacionId} />
            <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Instrumento {index + 1}</h2><button className="text-xs font-semibold text-red-700 underline" type="button" disabled={pending} onClick={() => { if (window.confirm('¿Eliminar instrumento y sus referencias de fotos?')) run(() => eliminarInstrumentoAction(props.rondaId, item._id)) }}>Eliminar</button></div>
            <div className="grid gap-3 md:grid-cols-5">
              <select className="input" name="tipo" defaultValue={item.tipo}>{tipos.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <input className="input" name="codigo_interno" defaultValue={item.codigoInterno} placeholder="Código interno" required />
              <input className="input" name="marca" defaultValue={item.marca} placeholder="Marca" required />
              <input className="input" name="modelo" defaultValue={item.modelo} placeholder="Modelo" required />
              <input className="input" name="serial_identificacion" defaultValue={item.serialIdentificacion} placeholder="Serial/identificación" required />
            </div>
            <textarea className="input min-h-20" name="observaciones" defaultValue={item.observaciones} placeholder="Observaciones" />
            <div className="grid gap-3 md:grid-cols-2">
              {(['general', 'placa_serial'] as const).map((tipoFoto) => {
                const current = tipoFoto === 'general' ? item.fotoGeneralStorageId : item.fotoPlacaStorageId
                const fileName = tipoFoto === 'general' ? item.fotoGeneralFileName : item.fotoPlacaFileName
                const key = `${item._id}:${tipoFoto}`
                return <div className="rounded-lg border border-[var(--border)] p-3" key={tipoFoto}><div className="mb-2 text-xs font-semibold uppercase">{tipoFoto === 'general' ? 'Foto general' : 'Foto placa/serial'}</div><input type="file" accept="image/jpeg,image/png" disabled={uploading === key || pending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(item._id, tipoFoto, file) }} />{current && <div className="mt-2 flex items-center justify-between gap-2 text-xs"><span>{fileName ?? 'Imagen cargada'}</span><button type="button" className="text-red-700 underline" onClick={() => run(() => retirarFotoF21Action(props.rondaId, item._id, tipoFoto))}>Retirar</button></div>}</div>
              })}
            </div>
            <button className="btn-outline justify-self-start" disabled={pending}>Guardar instrumento</button>
          </form>
        ))}
      </section>

      <form action={(formData) => run(() => guardarInstrumentoAction(props.rondaId, formData))} className="card grid gap-3 p-5">
        <h2 className="font-semibold">Agregar instrumento</h2><input type="hidden" name="relacion_id" value={props.relacionId} />
        <div className="grid gap-3 md:grid-cols-5"><select className="input" name="tipo">{tipos.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input className="input" name="codigo_interno" placeholder="Código interno" required /><input className="input" name="marca" placeholder="Marca" required /><input className="input" name="modelo" placeholder="Modelo" required /><input className="input" name="serial_identificacion" placeholder="Serial/identificación" required /></div>
        <textarea className="input" name="observaciones" placeholder="Observaciones" /><button className="btn-primary justify-self-start" disabled={pending}>Agregar</button>
      </form>

      <section className="card grid gap-4 p-5">
        <h2 className="font-semibold">Envío y validación</h2>
        {props.estado !== 'pendiente_validacion' && props.estado !== 'validado' && <form action={(formData) => run(() => enviarValidacionF21Action(props.rondaId, props.relacionId, String(formData.get('tecnico_nombre') ?? '')))} className="flex flex-wrap gap-3"><input className="input min-w-72" name="tecnico_nombre" defaultValue={props.tecnicoNombre ?? ''} placeholder="Nombre técnico responsable" required /><button className="btn-primary" disabled={pending || !props.completo}>Enviar a validación</button></form>}
        {props.canValidate && props.estado === 'pendiente_validacion' && <div className="grid gap-3 md:grid-cols-2"><form action={(formData) => run(() => validarF21Action(props.rondaId, props.relacionId, String(formData.get('coordinador_nombre') ?? '')))} className="flex gap-2"><input className="input" name="coordinador_nombre" defaultValue={props.coordinadorNombre ?? ''} placeholder="Nombre coordinador" required /><button className="btn-primary" disabled={pending}>Validar</button></form><form action={(formData) => run(() => devolverF21Action(props.rondaId, props.relacionId, String(formData.get('observacion') ?? '')))} className="flex gap-2"><input className="input" name="observacion" placeholder="Motivo de devolución" required /><button className="btn-outline" disabled={pending}>Devolver</button></form></div>}
      </section>

      <section className="card flex flex-wrap items-center gap-3 p-5"><button className="btn-primary" type="button" disabled={pending || props.estado !== 'validado'} onClick={() => run(() => generarExportacionesF21Action(props.rondaId))}>Generar PDF y XLSX</button>{props.hasPdf && props.pdfUrl && <a className="btn-outline" href={props.pdfUrl}>Descargar PDF</a>}{props.hasXlsx && props.xlsxUrl && <a className="btn-outline" href={props.xlsxUrl}>Descargar XLSX</a>}</section>
    </div>
  )
}
