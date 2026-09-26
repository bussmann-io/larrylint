import type { CallExpression } from 'estree'

const COOKIE_WRITES = new Set(['setCookie', 'deleteCookie', 'setManagedCookie', 'deleteManagedCookie'])

const HEADER_WRITES = new Set(['setHeader', 'setHeaders', 'appendHeader', 'appendHeaders', 'setResponseHeader', 'setResponseHeaders', 'appendResponseHeader', 'appendResponseHeaders', 'setResponseStatus', 'sendRedirect'])

/**
 * Reads the h3 or frontend-core function a call writes the response with, e.g. `setCookie` in `setCookie(event, …)`.
 *
 * @param call The call.
 *
 * @returns The function's name and whether it writes a cookie or a header, or `undefined` for other calls.
 */
export function responseWrite(call: CallExpression) {
  const name = call.callee.type === 'Identifier' ? call.callee.name : ''

  if (COOKIE_WRITES.has(name)) {
    return { name, kind: 'cookie' as const }
  }

  return HEADER_WRITES.has(name) ? { name, kind: 'header' as const } : undefined
}
