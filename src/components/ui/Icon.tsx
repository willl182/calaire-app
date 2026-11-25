/**
 * Íconos de interfaz (trazo, 24×24, `currentColor`). Decorativos por defecto
 * (`aria-hidden`); si el ícono transmite información sin texto al lado, pase `label`.
 */
const PATHS = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alerta: (
    <>
      <path d="M12 3.5l9.5 16.5h-19L12 3.5z" />
      <path d="M12 10v4.5M12 17.5v.01" />
    </>
  ),
  candado: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  carpeta: <path d="M3 6.5a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5z" />,
  carpetaAbierta: (
    <path d="M3 18V6.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V10M3 18l2.6-6.6A2 2 0 0 1 7.5 10H21l-2.7 8.6a2 2 0 0 1-1.9 1.4H5a2 2 0 0 1-2-2z" />
  ),
  archivo: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path d="M14 3v5h5" />
    </>
  ),
  grafica: <path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3" />,
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
} as const

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  className = 'h-4 w-4',
  label,
}: {
  name: IconName
  className?: string
  label?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {PATHS[name]}
    </svg>
  )
}
