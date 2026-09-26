import type { Expression, Node, ObjectExpression, Pattern, SpreadElement } from 'estree'

import { defineRule } from '../../../lib/rule'
import { findProperty } from '../../../utils/ast/object'

/**
 * Lists the methods called along a chain, outermost first, e.g. `optional` and `nullable` for `z.string().nullable().optional()`.
 *
 * @param node The chain.
 *
 * @returns The method names.
 */
function chainMethods(node: Node | undefined) {
  const methods: string[] = []
  let current = node

  while (current?.type === 'CallExpression' && current.callee.type === 'MemberExpression' && current.callee.property.type === 'Identifier') {
    methods.push(current.callee.property.name)
    current = current.callee.object
  }

  return methods
}

/**
 * Finds the shape of a `z.object({ ... })` schema, also behind modifiers like `.strict()`.
 *
 * @param schema The schema expression.
 *
 * @returns The object literal with the fields, or `undefined`.
 */
function objectShape(schema: Expression | Pattern | SpreadElement | undefined): ObjectExpression | undefined {
  let current: Node | undefined = schema

  while (current?.type === 'CallExpression' && current.callee.type === 'MemberExpression' && current.callee.property.type === 'Identifier') {
    const [shape] = current.arguments

    if (current.callee.property.name === 'object' && shape?.type === 'ObjectExpression') {
      return shape
    }

    current = current.callee.object
  }

  return undefined
}

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow nullable top-level fields in entity component tokens, which Studio can\'t bind.',
    },
    schema: [],
    messages: {
      nullable: 'Studio can\'t bind a nullable field. Resolve it to an empty value instead, e.g. \'\' or [].',
    },
  },

  applies: file => file.side === 'app' || file.side === 'server' || file.side === 'shared',

  create: ({ report }) => ({
    CallExpression: (node) => {
      const options = node.arguments[1]

      if (node.callee.type !== 'Identifier' || node.callee.name !== 'defineEntityComponentToken' || options?.type !== 'ObjectExpression') {
        return
      }

      for (const field of objectShape(findProperty(options, 'schema'))?.properties ?? []) {
        if (field.type === 'Property' && chainMethods(field.value).some(method => method === 'nullable' || method === 'nullish')) {
          report({ node: field, messageId: 'nullable' })
        }
      }
    },
  }),
})
