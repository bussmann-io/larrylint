import type { Node } from 'estree'

import { nameOf } from '../ast/chain'

const NOT_PAGES = /^\/(?:\/|api\/|_|app-|\.well-known\/)/

/**
 * Checks whether a path leads to a page of the app, not to a server route, an app's own route or another host.
 *
 * @param path The path, e.g. `/cart`.
 *
 * @returns `false` for `/api/…`, `/_…`, `/app-…`, `/.well-known/…`, `//host/…` and anything that doesn't start with `/`.
 */
export function isInternalPath(path: string | null | undefined) {
  return path?.startsWith('/') === true && !NOT_PAGES.test(path)
}

/**
 * Checks whether an expression builds an internal path from parts, e.g. `` `/hotels/${slug}` ``.
 *
 * @param node The expression.
 *
 * @returns `true` for a path to a page with variable parts.
 */
export function isHandBuiltPath(node: Node | null | undefined) {
  if (node?.type === 'TemplateLiteral') {
    return node.expressions.length > 0 && isInternalPath(node.quasis[0]?.value.cooked)
  }

  return node?.type === 'BinaryExpression' && node.operator === '+' && node.left.type === 'Literal' && typeof node.left.value === 'string' && isInternalPath(node.left.value)
}

/**
 * Checks whether an expression is the Vue router, e.g. `router`, `$router` or `useRouter()`.
 *
 * @param node The expression.
 *
 * @returns `true` for the router.
 */
export function isRouter(node: Node) {
  const name = nameOf(node.type === 'CallExpression' ? node.callee : node)

  return node.type === 'CallExpression' ? name === 'useRouter' : name === 'router' || name === '$router'
}
