import type { AST } from 'vue-eslint-parser'

import { uiKitTags } from '../../../laioutr/ui-kit'
import { defineRule } from '../../../lib/rule'
import { kebabCase } from '../../../utils/string'

export default defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require `<l-*>` tags to be ui-kit or ui components.',
    },
    schema: [],
    messages: {
      unknown: '<{{tag}}> isn\'t a ui-kit or ui component, so it renders nothing. Only their components have the l- prefix; use your own components by their own name.',
    },
  },

  applies: file => file.path.endsWith('.vue'),

  create: ({ file, report, visitTemplate }) => {
    const imported = new Set<string>()

    visitTemplate({
      VElement: (node: AST.VElement) => {
        const tag = kebabCase(node.rawName)

        if (tag.startsWith('l-') && !imported.has(tag) && !uiKitTags(file.root).has(tag)) {
          report({ loc: node.startTag.loc, messageId: 'unknown', data: { tag: node.rawName } })
        }
      },
    })

    return {
      ImportDefaultSpecifier: (node) => {
        imported.add(kebabCase(node.local.name))
      },
    }
  },
})
