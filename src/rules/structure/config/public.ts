import type { Rule } from 'eslint'
import type { Identifier } from 'estree'

import { defineRule } from '../../../lib/rule'
import { memberPath, nameOf } from '../../../utils/ast/chain'
import { isReference } from '../../../utils/ast/values'
import { walk } from '../../../utils/ast/walk'
import { setupOptions } from '../../../utils/nuxt/config'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow copying module options into the public runtime config, which reaches the browser.',
    },
    schema: [],
    messages: {
      options: 'runtimeConfig.public reaches the browser, and with it every token or secret among the module options. Copy only the options meant to be public.',
    },
  },

  applies: file => file.side === 'build',

  create: ({ report }) => ({
    AssignmentExpression: (node) => {
      const path = memberPath(node.left)
      const index = path.indexOf('runtimeConfig')
      const options = index !== -1 && path[index + 1] === 'public' ? setupOptions(node as Rule.Node) : undefined

      if (!options) {
        return
      }

      walk(node.right, (child) => {
        if (child.type !== 'Identifier' || child.name !== options || !isReference(child as Identifier & Rule.NodeParentExtension)) {
          return
        }

        const { parent } = child as Identifier & Rule.NodeParentExtension
        const publicOnly = parent.type === 'MemberExpression' && parent.object === child && nameOf(parent) === 'public'

        if (!publicOnly) {
          report({ node: child, messageId: 'options' })
        }
      })
    },
  }),
})
