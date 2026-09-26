import type { Node, ObjectExpression } from 'estree'

import { chainMethods } from './ast/chain'

/**
 * Finds the fields of a `z.object({ ... })` schema, also behind modifiers like `.strict()`.
 *
 * @param schema The schema expression.
 *
 * @returns The object literal with the fields, or `undefined`.
 */
export function objectShape(schema: Node | undefined): ObjectExpression | undefined {
  let current = schema

  while (current?.type === 'CallExpression' && current.callee.type === 'MemberExpression' && current.callee.property.type === 'Identifier') {
    const [shape] = current.arguments

    if (current.callee.property.name === 'object' && shape?.type === 'ObjectExpression') {
      return shape
    }

    current = current.callee.object
  }

  return undefined
}

/**
 * Checks whether a schema accepts `null`, e.g. `z.string().nullable()`.
 *
 * @param schema The schema expression.
 *
 * @returns `true` if the chain has `.nullable()` or `.nullish()`.
 */
export function isNullable(schema: Node) {
  return chainMethods(schema).some(method => method === 'nullable' || method === 'nullish')
}
