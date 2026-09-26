import type { Node } from 'estree'

/** Keys that point back up or hold positions, not child nodes. */
const SKIPPED = new Set(['parent', 'loc', 'range', 'tokens', 'comments'])

/**
 * Lists the child nodes of a node, in source order.
 *
 * @param node The node.
 *
 * @returns The children.
 */
export function children(node: Node): Node[] {
  const result: Node[] = []

  for (const [key, value] of Object.entries(node)) {
    if (SKIPPED.has(key)) {
      continue
    }

    for (const child of Array.isArray(value) ? value : [value]) {
      if (typeof child === 'object' && child !== null && typeof (child as { type?: unknown }).type === 'string') {
        result.push(child as Node)
      }
    }
  }

  return result
}

/**
 * Visits a node and all its descendants, in source order.
 *
 * @param node The node to start from.
 * @param enter Called for every node; returning `false` skips the node's children.
 */
export function walk(node: Node, enter: (node: Node) => boolean | void) {
  if (enter(node) === false) {
    return
  }

  for (const child of children(node)) {
    walk(child, enter)
  }
}
