import { withAuth } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'

import { LogoUnal } from '@/app/components/LogoUnal'

export default async function LoginPage() {
  const { user } = await withAuth()
  if (user) redirect('/dashboard')

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--background)' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <LogoUnal height={64} />

        <div className="card-accent w-full p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--foreground)' }}
            >
              CALAIRE APP
            </h1>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              Dashboard para Ensayos de Aptitud de Calidad de Aire
            </p>
          </div>

          <a href="/login/start" className="btn-primary">
            Ingresar con correo electrónico
          </a>

          <p className="text-xs text-center" style={{ color: 'var(--foreground-muted)' }}>
            Recibirás un enlace de acceso en tu correo registrado.
          </p>

          <div className="flex items-center justify-center gap-2 pt-2">
            <a
              href="/guia.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--pt-primary-dark)] hover:text-[var(--foreground)] transition-colors"
              title="Abrir guía del participante"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              Guía del participante
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
