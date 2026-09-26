import type { AST } from 'vue-eslint-parser'

import { readDefinition } from '../../../laioutr/definition'
import { defineRule } from '../../../lib/rule'
import { findAttribute } from '../../../utils/vue/template'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow an id on the root element of a section or block, which frontend-core replaces with its own.',
    },
    schema: [],
    messages: {
      rootId: 'frontend-core gives the root element of every section and block its own id, so this one never reaches the page. Put it on an inner element.',
    },
  },

  applies: file => file.side === 'app' && file.path.endsWith('.vue'),

  create: ({ context, report }) => {
    let defined = false

    return {
      'CallExpression': (node) => {
        defined ||= readDefinition(node) !== undefined
      },

      'Program:exit': () => {
        const template = (context.sourceCode.ast as AST.ESLintProgram).templateBody

        if (!defined || !template) {
          return
        }

        for (const root of template.children) {
          const id = root.type === 'VElement' ? findAttribute(root, 'id') : undefined

          if (id) {
            report({ loc: id.loc, messageId: 'rootId' })
          }
        }
      },
    }
  },
})
