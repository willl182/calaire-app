import { authkitProxy } from '@workos-inc/authkit-nextjs'

export default authkitProxy({
  // Redirige a /login si el usuario no está autenticado al acceder a rutas protegidas
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: [
      '/',
      '/login',
      '/login/start',
      '/auth/callback',
      '/denied',
      '/guia.html',
      '/docs/screenshots/:path*',
    ],
  },
})

export const config = {
  matcher: [
    '/((?!agent/(?:me|auth(?:/claim(?:/complete)?)?|v1(?:/.*)?)/?$|sgc(?:/.*)?$|_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff2?)$).*)',
  ],
}
