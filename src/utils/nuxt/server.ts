import type { CallExpression, Expression } from 'estree'

import { nameOf } from '../ast/chain'
import { findProperty } from '../ast/object'

const COOKIE_SETTERS = new Set(['setCookie', 'deleteCookie'])
const REDIRECTS = new Set(['sendRedirect', 'navigateTo'])
const HEADER_SETTERS = new Set(['setHeader', 'setHeaders', 'appendHeader', 'setResponseHeader', 'setResponseHeaders', 'appendResponseHeader'])

/**
 * Tells whether a call sets a cookie or redirects, which a cached response replays to every visitor.
 *
 * @param call The call.
 *
 * @returns `cookie` or `redirect`, or `undefined` for anything else.
 */
export function responseEffect(call: CallExpression) {
  const name = nameOf(call.callee) ?? ''

  if (COOKIE_SETTERS.has(name)) {
    return 'cookie'
  }

  if (REDIRECTS.has(name)) {
    return 'redirect'
  }

  const header = HEADER_SETTERS.has(name) ? call.arguments.find(argument => argument.type === 'Literal' && typeof argument.value === 'string') : undefined
  const value = header?.type === 'Literal' ? String(header.value).toLowerCase() : undefined

  return value === 'set-cookie' ? 'cookie' : value === 'location' ? 'redirect' : undefined
}

/**
 * Reads the status an error is created with, e.g. `404` for `createError({ status: 404 })`.
 *
 * @param error The thrown expression.
 *
 * @returns The status, or `undefined` if there's no literal one.
 */
export function thrownStatus(error: Expression) {
  if (error.type !== 'CallExpression' && error.type !== 'NewExpression') {
    return undefined
  }

  for (const argument of error.arguments) {
    const status = argument.type === 'ObjectExpression' ? findProperty(argument, 'status') ?? findProperty(argument, 'statusCode') : undefined

    if (status?.type === 'Literal' && typeof status.value === 'number') {
      return status.value
    }
  }

  return undefined
}
