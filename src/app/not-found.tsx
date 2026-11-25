import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-6 py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-[2rem] border border-line-soft bg-white/95 p-8 shadow-sm">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted text-2xl">
          404
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Recurso no encontrado
          </p>
          <h1 className="text-3xl font-semibold text-foreground">La ruta solicitada no existe</h1>
          <p className="max-w-xl text-sm leading-6 text-muted">
            Verifique el enlace de la ronda o vuelva al panel principal para continuar con la
            operacion.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-foreground"
          >
            Abrir dashboard
          </Link>
          <Link
            href="/"
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-line-strong hover:text-foreground"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
