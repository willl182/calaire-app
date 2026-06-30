import { redirect } from 'next/navigation'
import { isAdmin, requireAuth } from '@/server/auth'
import { listRondas } from '@/server/rondas'
import { listComunicaciones, createComunicacion, deleteComunicacion } from '@/server/sgc'

async function ComunicacionesPage() {
  const auth = await requireAuth()
  if (!auth.user) redirect('/login')
  if (!isAdmin(auth)) redirect('/denied?reason=role')

  const rondas = await listRondas()
  const comunicacionesPorRonda = await Promise.all(
    rondas.map(async (ronda) => {
      const comunicaciones = await listComunicaciones(ronda.id)
      return { ronda, comunicaciones }
    })
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Comunicaciones SGC</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Registro manual de comunicaciones con participantes y stakeholders.
        </p>
      </header>

      <div className="grid gap-6">
        {comunicacionesPorRonda.map(({ ronda, comunicaciones }) => (
          <div key={ronda.id} className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">{ronda.codigo}</h2>
                <p className="text-sm text-[var(--foreground-muted)]">{ronda.nombre}</p>
              </div>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.14em] bg-[var(--surface-muted)] text-[var(--foreground-muted)]">
                {ronda.estado}
              </span>
            </div>

            <form
              action={async (formData: FormData) => {
                'use server'
                const rondaId = String(formData.get('ronda_id'))
                await createComunicacion({
                  rondaId,
                  tipo: String(formData.get('tipo')) as 'email' | 'llamada' | 'reunion' | 'otro',
                  destinatario: String(formData.get('destinatario')),
                  asunto: String(formData.get('asunto')),
                  notas: String(formData.get('notas')) || null,
                  fecha: String(formData.get('fecha')),
                  responsable: String(formData.get('responsable')),
                })
                redirect('/dashboard/sgc/comunicaciones')
              }}
              className="mb-4 grid gap-3 rounded-lg border border-[var(--border)] p-4 md:grid-cols-6"
            >
              <input type="hidden" name="ronda_id" value={ronda.id} />
              <select className="input" name="tipo">
                <option value="email">Email</option>
                <option value="llamada">Llamada</option>
                <option value="reunion">Reunion</option>
                <option value="otro">Otro</option>
              </select>
              <input className="input" name="destinatario" placeholder="Destinatario" />
              <input className="input md:col-span-2" name="asunto" placeholder="Asunto" />
              <input className="input" name="fecha" type="date" />
              <input className="input" name="responsable" placeholder="Responsable" />
              <input className="input md:col-span-5" name="notas" placeholder="Notas (opcional)" />
              <button className="btn-primary md:col-span-1" type="submit">Registrar</button>
            </form>

            {comunicaciones.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)]">Sin comunicaciones registradas.</p>
            ) : (
              <div className="grid gap-2">
                {comunicaciones.map((com) => (
                  <div
                    key={com._id}
                    className="grid gap-2 rounded-lg border border-[var(--border)] p-3 text-sm md:grid-cols-[120px_1fr_1fr_120px_1fr_auto]"
                  >
                    <div className="font-semibold uppercase text-[var(--foreground-muted)]">{com.tipo}</div>
                    <div>{com.destinatario}</div>
                    <div>{com.asunto}</div>
                    <div>{com.fecha}</div>
                    <div className="text-[var(--foreground-muted)]">{com.responsable}</div>
                    <div className="flex gap-2">
                      <form
                        action={async (formData: FormData) => {
                          'use server'
                          await deleteComunicacion(String(formData.get('comunicacion_id')))
                          redirect('/dashboard/sgc/comunicaciones')
                        }}
                      >
                        <input type="hidden" name="comunicacion_id" value={com._id} />
                        <button className="btn-outline text-xs" type="submit">Eliminar</button>
                      </form>
                    </div>
                    {com.notas && (
                      <div className="md:col-span-6 text-[var(--foreground-muted)]">{com.notas}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {rondas.length === 0 && (
          <div className="card p-10 text-center text-sm text-[var(--foreground-muted)]">
            No hay rondas registradas.
          </div>
        )}
      </div>
    </div>
  )
}

export default ComunicacionesPage
