import { authkitProxy } from '@workos-inc/authkit-nextjs'

export default authkitProxy({
  // Redirige a /login si el usuario no está autenticado al acceder a rutas protegidas
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ['/login', '/auth/callback', '/denied', '/'],
  },
})

export const config = {
  matcher: [
    '/((?!agent/(?:me|auth(?:/claim(?:/complete)?)?|v1(?:/.*)?)/?$|_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff2?)$).*)',
  ],
}
