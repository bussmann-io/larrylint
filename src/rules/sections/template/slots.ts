import type { Rule } from 'eslint'
import type { MemberExpression, Node } from 'estree'

import { defineRule } from '../../../lib/rule'
import { unwrap } from '../../../utils/ast/chain'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow counting slot children, since Studio passes all blocks of a slot as one Fragment.',
    },
    schema: [],
    messages: {
      length: 'Studio passes all blocks of a slot as one Fragment, so this length is 1. Count the rendered blocks with a helper that flattens Fragments.',
    },
  },

  applies: file => file.side === 'app',

  create: ({ report, visitTemplate }) => {
    const slotVariables = new Set(['slots', '$slots'])

    const isSlots = (node: Node) => (node.type === 'Identifier' && slotVariables.has(node.name)) || (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'useSlots')

    const check = (node: MemberExpression) => {
      if (node.computed || node.property.type !== 'Identifier' || node.property.name !== 'length') {
        return
      }

      const call = unwrap(node.object)
      const slot = call.type === 'CallExpression' ? unwrap(call.callee) : undefined

      if (slot?.type === 'MemberExpression' && isSlots(slot.object)) {
        report({ node: node.property, messageId: 'length' })
      }
    }

    visitTemplate({ MemberExpression: check })

    return {
      VariableDeclarator: (node) => {
        if (node.id.type === 'Identifier' && node.init && isSlots(node.init)) {
          slotVariables.add(node.id.name)
        }
      },

      MemberExpression: (node: MemberExpression & Rule.NodeParentExtension) => {
        check(node)
      },
    }
  },
})
