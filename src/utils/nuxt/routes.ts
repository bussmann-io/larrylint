import type { Node } from 'estree'

/**
 * Checks whether a path leads to a page of the app, not to an API route or another host.
 *
 * @param path The path, e.g. `/cart`.
 *
 * @returns `false` for `/api/...`, `//host/...` and anything that doesn't start with `/`.
 */
export function isInternalPath(path: string | null | undefined) {
  return path?.startsWith('/') === true && !path.startsWith('//') && !path.startsWith('/api/')
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
